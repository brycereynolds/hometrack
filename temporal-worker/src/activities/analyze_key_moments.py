import json
import re

import anthropic
from temporalio import activity

from src.config import ANTHROPIC_API_KEY, logger
from src.models import KeyMoment, TranscriptSegment

CONTEXT_WINDOW_SECONDS = 60


def parse_llm_json(raw_text: str) -> dict:
    """Parse JSON from LLM response, handling common issues."""
    text = raw_text.strip()
    # Strip markdown fences
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    # Try parsing as-is
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try fixing common issues: trailing commas
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*]', ']', text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise


def _format_timestamp_display(total_seconds: float) -> str:
    """Convert total seconds to MM:SS display format."""
    mins = int(total_seconds) // 60
    secs = int(total_seconds) % 60
    return f"{mins:02d}:{secs:02d}"


@activity.defn
async def analyze_key_moments(transcript_data: dict) -> list[dict]:
    """Extract key moments from transcript using Claude Haiku."""
    activity.heartbeat("analyzing key moments")

    segments = [TranscriptSegment(**s) for s in transcript_data["segments"]]
    full_text = transcript_data["full_text"]
    media_type = transcript_data.get("media_type", "video")
    is_audio_only = media_type in ("voice_memo", "audio")

    if not segments:
        return []

    # Build transcript with both display timestamps and total seconds
    # so the LLM doesn't confuse MM:SS with just seconds
    transcript_lines = []
    for seg in segments:
        total_secs = int(seg.start)
        display = _format_timestamp_display(seg.start)
        speaker = f"{seg.speaker}: " if seg.speaker else ""
        transcript_lines.append(f"[{display} / {total_secs}s] {speaker}{seg.text}")

    if is_audio_only:
        # Voice memo / audio-only: no visual references, focus on speech content
        categories_block = """Look for:
- **Observations**: notable observations about property condition, features, or issues mentioned in speech
- **Condition notes**: positive or negative assessments ("this is in good shape", "needs work")
- **Decisions or conclusions**: moments where important decisions are stated
- **Action items**: things that need to be done, tasks assigned, follow-ups mentioned
- **Questions**: questions raised that need answers
- **Topic changes**: significant shifts in discussion topic"""
        categories_list = "decision, action_item, observation, condition_note, topic_change"
        source_desc = "an audio recording (voice memo)"
        purpose = "Identify ALL key moments worth documenting from the speech content"
    else:
        # Video: full prompt with visual references
        categories_block = """Look for:
- **Visual references**: "this right here", "look at this", "as you can see", "over here", pointing out physical objects or locations
- **Observations about conditions**: commenting on the state of things ("this needs updating", "this is in good shape", "notice the damage here")
- **Condition notes**: positive observations worth documenting ("this is in good shape", "this is ready to go", "no issues here")
- **Demonstrations**: showing how something works, walking through a space, presenting something
- **Decisions or conclusions**: moments where important decisions are stated
- **Action items**: things that need to be done, tasks assigned
- **Topic changes**: significant shifts in discussion topic"""
        categories_list = "visual_reference, decision, action_item, observation, demonstration, topic_change, condition_note"
        source_desc = "a video recording"
        purpose = "Identify ALL key moments where visual context would enrich understanding"

    prompt = f"""Analyze this transcript from {source_desc}. {purpose}.

Be thorough — extract EVERY actionable observation, not just the major ones. For property walkthroughs, site inspections, or detailed reviews, expect 30-60+ moments.

{categories_block}

IMPORTANT: Timestamps in the transcript are shown as [MM:SS / Xs] where X is the total seconds.
Use the TOTAL SECONDS value (the number before 's') for timestamp_seconds. For example:
- [01:35 / 95s] → timestamp_seconds: 95
- [02:07 / 127s] → timestamp_seconds: 127
- [00:45 / 45s] → timestamp_seconds: 45

For each key moment, extract the timestamp_seconds (TOTAL SECONDS) and categorize it.

Return ONLY valid JSON — no markdown fences, no explanation:
{{"key_moments": [{{"timestamp_seconds": 95, "end_timestamp": null, "category": "observation", "description": "Speaker notes water damage on ceiling", "importance": "high"}}, ...]}}

Categories: {categories_list}

If there are no clear key moments, return: {{"key_moments": []}}

## Transcript

{chr(10).join(transcript_lines)}"""

    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    try:
        parsed = parse_llm_json(raw)
    except json.JSONDecodeError:
        # Retry: ask the LLM to fix its own JSON
        logger.warning("JSON parse failed, attempting repair retry")
        try:
            fix_message = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt},
                    {"role": "assistant", "content": raw},
                    {"role": "user", "content": "Your previous response contained invalid JSON. Please return the same data as valid JSON only — no markdown fences, no explanation."},
                ],
            )
            fix_raw = fix_message.content[0].text.strip()
            parsed = parse_llm_json(fix_raw)
        except Exception as e:
            logger.error("Failed to parse key moments JSON after retry: %s", e)
            return []

    moments_data = parsed.get("key_moments", parsed if isinstance(parsed, list) else [])

    # Build key moments with transcript context
    moments: list[KeyMoment] = []
    for m in moments_data:
        ts = float(m["timestamp_seconds"]) if "timestamp_seconds" in m else float(m.get("timestamp", 0))
        # Get transcript context within CONTEXT_WINDOW_SECONDS
        context_segs = [
            seg for seg in segments
            if abs(seg.start - ts) <= CONTEXT_WINDOW_SECONDS
        ]
        context = " ".join(
            f"[{seg.speaker or '?'}] {seg.text}" if seg.speaker else seg.text
            for seg in context_segs
        )

        moments.append(KeyMoment(
            timestamp=ts,
            end_timestamp=m.get("end_timestamp"),
            category=m.get("category", "observation"),
            description=m["description"],
            transcript_context=context or "(no context available)",
            importance=m.get("importance", "medium"),
        ))

    activity.heartbeat(f"found {len(moments)} key moments")
    logger.info("Identified %d key moments in transcript", len(moments))
    return [m.model_dump() for m in moments]
