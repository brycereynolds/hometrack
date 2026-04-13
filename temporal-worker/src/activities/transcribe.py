import os
from dataclasses import dataclass

import openai
from temporalio import activity

from src.config import OPENAI_API_KEY, logger

MAX_CHUNK_SIZE = 24 * 1024 * 1024  # 24 MB


@dataclass
class TranscriptSegment:
    start: float
    end: float
    text: str


@dataclass
class TranscriptionResult:
    full_text: str
    segments: list[TranscriptSegment]


@activity.defn
async def transcribe(audio_path: str) -> TranscriptionResult:
    """Transcribe audio using OpenAI Whisper API, handling chunking for large files."""
    activity.heartbeat("starting transcription")

    client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
    file_size = os.path.getsize(audio_path)

    if file_size <= MAX_CHUNK_SIZE:
        return await _transcribe_file(client, audio_path)

    # Split into chunks using ffmpeg
    segments: list[TranscriptSegment] = []
    full_parts: list[str] = []
    chunk_duration = 600  # 10 minutes per chunk
    chunk_index = 0
    offset = 0.0

    while True:
        chunk_path = f"{audio_path}.chunk{chunk_index}.mp3"
        import subprocess
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

        for seg in chunk_result.segments:
            segments.append(TranscriptSegment(
                start=seg.start + offset,
                end=seg.end + offset,
                text=seg.text,
            ))
        full_parts.append(chunk_result.full_text)

        offset += chunk_duration
        chunk_index += 1

    logger.info("Transcribed %d segments, total length: %d chars", len(segments), sum(len(p) for p in full_parts))
    return TranscriptionResult(full_text=" ".join(full_parts), segments=segments)


async def _transcribe_file(client: openai.AsyncOpenAI, path: str) -> TranscriptionResult:
    with open(path, "rb") as f:
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    segments = []
    for seg in (response.segments or []):
        segments.append(TranscriptSegment(start=seg["start"], end=seg["end"], text=seg["text"]))

    return TranscriptionResult(full_text=response.text, segments=segments)
