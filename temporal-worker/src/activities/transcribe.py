import os
import subprocess

import anthropic
import openai
from temporalio import activity

from src.config import get_anthropic_client, OPENAI_API_KEY, logger
from src.models import TranscriptSegment

MAX_CHUNK_SIZE = 24 * 1024 * 1024  # 24 MB


@activity.defn
async def transcribe(audio_path: str) -> dict:
    """Transcribe audio using OpenAI Whisper API with speaker diarization via Claude Haiku."""
    activity.heartbeat("starting transcription")

    client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
    file_size = os.path.getsize(audio_path)

    if file_size <= MAX_CHUNK_SIZE:
        result = await _transcribe_file(client, audio_path)
    else:
        result = await _transcribe_chunked(client, audio_path)

    activity.heartbeat("transcription complete, starting diarization")

    # Speaker diarization via Claude Haiku
    segments_with_speakers = await _diarize_speakers(result["segments"], result["full_text"])

    logger.info(
        "Transcribed %d segments with speaker labels, total length: %d chars",
        len(segments_with_speakers), len(result["full_text"]),
    )
    return {
        "full_text": result["full_text"],
        "segments": [s.model_dump() for s in segments_with_speakers],
    }


async def _transcribe_file(client: openai.AsyncOpenAI, path: str) -> dict:
    with open(path, "rb") as f:
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    segments = []
    for seg in (response.segments or []):
        segments.append(TranscriptSegment(start=seg.start, end=seg.end, text=seg.text))

    return {"full_text": response.text, "segments": segments}


async def _transcribe_chunked(client: openai.AsyncOpenAI, audio_path: str) -> dict:
    segments: list[TranscriptSegment] = []
    full_parts: list[str] = []
    chunk_duration = 600  # 10 minutes per chunk
    chunk_index = 0
    offset = 0.0

    while True:
        chunk_path = f"{audio_path}.chunk{chunk_index}.mp3"
        cmd = [
            "ffmpeg", "-i", audio_path,
            "-ss", str(int(offset)),
            "-t", str(chunk_duration),
            "-acodec", "libmp3lame", "-q:a", "4",
            "-y", chunk_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0 or not os.path.exists(chunk_path) or os.path.getsize(chunk_path) < 1000:
            if os.path.exists(chunk_path):
                os.unlink(chunk_path)
            break

        activity.heartbeat(f"transcribing chunk {chunk_index}")
        chunk_result = await _transcribe_file(client, chunk_path)
        os.unlink(chunk_path)

        for seg in chunk_result["segments"]:
            segments.append(TranscriptSegment(
                start=seg.start + offset,
                end=seg.end + offset,
                text=seg.text,
            ))
        full_parts.append(chunk_result["full_text"])

        offset += chunk_duration
        chunk_index += 1

    return {"full_text": " ".join(full_parts), "segments": segments}


async def _diarize_speakers(segments: list[TranscriptSegment], full_text: str) -> list[TranscriptSegment]:
    """Use Claude Haiku to assign speaker labels to transcript segments."""
    if not segments:
        return segments

    # Build segment text for diarization
    segment_lines = []
    for i, seg in enumerate(segments):
        segment_lines.append(f"[{i}] ({seg.start:.1f}s-{seg.end:.1f}s): {seg.text}")

    prompt = f"""Analyze this transcript and identify distinct speakers. Assign a speaker label to each segment.

Rules:
- Use "Speaker A", "Speaker B", etc. for distinct voices
- Base speaker identification on context clues (questions vs answers, role references, topic shifts)
- If you can identify roles (e.g., "Agent", "Client", "Inspector"), use those instead

Segments:
{chr(10).join(segment_lines)}

Return ONLY a JSON array of speaker labels in segment order, e.g.:
["Agent", "Client", "Agent", "Client"]"""

    try:
        client = get_anthropic_client()
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )

        import json
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

        labels = json.loads(raw)
        if isinstance(labels, list) and len(labels) == len(segments):
            for seg, label in zip(segments, labels):
                seg.speaker = str(label)
        else:
            logger.warning("Diarization returned %d labels for %d segments, skipping", len(labels) if isinstance(labels, list) else 0, len(segments))
    except Exception as e:
        logger.warning("Speaker diarization failed, continuing without labels: %s", e)

    return segments
