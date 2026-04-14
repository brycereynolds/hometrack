import json

import anthropic
from temporalio import activity

from src.config import ANTHROPIC_API_KEY, logger
from src.models import KeyMoment, TranscriptSegment

CONTEXT_WINDOW_SECONDS = 60


@activity.defn
async def analyze_key_moments(transcript_data: dict) -> list[dict]:
    """Extract key moments from transcript using Claude Haiku."""
    activity.heartbeat("analyzing key moments")

    segments = [TranscriptSegment(**s) for s in transcript_data["segments"]]
    full_text = transcript_data["full_text"]

    if not segments:
        return []

    # Build transcript with timestamps for analysis
    transcript_lines = []
    for seg in segments:
        speaker = f"[{seg.speaker}] " if seg.speaker else ""
        transcript_lines.append(f"({seg.start:.1f}s) {speaker}{seg.text}")

    prompt = f"""Analyze this property walkthrough transcript and identify key moments.

Categories to look for:
- visual_reference: When someone points out or refers to something visible ("look at this", "you can see", "over here")
- observation: Notable observations about property condition, features, or issues
- decision: Decisions made during the walkthrough
- action_item: Tasks or follow-ups mentioned
- topic_change: Significant shifts in topic or location (moving to a new room, etc.)

Transcript:
{chr(10).join(transcript_lines)}

Return a JSON array of key moments:
[{{
  "timestamp": <start_seconds>,
  "end_timestamp": <end_seconds_or_null>,
  "category": "<category>",
  "description": "<what_happened>",
  "importance": "low|medium|high"
}}]

Focus on moments that would benefit from visual context. Return ONLY the JSON array."""

    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        moments_data = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Failed to parse key moments JSON: %s", raw[:200])
        return []

    # Build key moments with transcript context
    moments: list[KeyMoment] = []
    for m in moments_data:
        ts = float(m["timestamp"])
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
