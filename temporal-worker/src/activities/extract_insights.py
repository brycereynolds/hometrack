import json
from dataclasses import dataclass

import anthropic
from temporalio import activity

from src.config import ANTHROPIC_API_KEY, logger

EXTRACTION_PROMPT = """\
You are analyzing field notes from a real estate agent who just visited a property listing.
Extract:

1. ACTION ITEMS: Concrete tasks that need to be done
   - Each with: title, priority (low/medium/high/urgent), suggested category
   - Categories: improvements, staging, media, marketing, disclosures, general

2. KEY OBSERVATIONS: Important notes about the property condition, market feedback, client concerns
   - Each with: content, relevance

3. FOLLOW-UPS: Things to communicate to clients, other agents, vendors
   - Each with: content, who to contact, urgency

Return as JSON:
{
  "action_items": [{"title": "...", "priority": "...", "category": "..."}],
  "observations": [{"content": "...", "relevance": "..."}],
  "follow_ups": [{"content": "...", "contact": "...", "urgency": "..."}]
}

Only return the JSON object, no other text."""


@dataclass
class InsightResults:
    action_items: list[dict]
    observations: list[dict]
    follow_ups: list[dict]
    raw_json: str


@activity.defn
async def extract_insights(text: str, frame_captions: list[str] | None = None) -> InsightResults:
    """Extract actionable insights from transcript and frame captions using Claude."""
    activity.heartbeat("extracting insights")

    content = f"TRANSCRIPT / FIELD NOTES:\n{text}"
    if frame_captions:
        content += "\n\nVISUAL OBSERVATIONS FROM VIDEO FRAMES:\n"
        for i, caption in enumerate(frame_captions):
            content += f"- Frame {i + 1}: {caption}\n"

    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    message = await client.messages.create(
        model="claude-sonnet-4-5-20250514",
        max_tokens=2000,
        messages=[
            {"role": "user", "content": f"{EXTRACTION_PROMPT}\n\n{content}"},
        ],
    )

    raw = message.content[0].text.strip()

    # Handle potential markdown code block wrapping
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Failed to parse insights JSON: %s", raw[:200])
        data = {"action_items": [], "observations": [], "follow_ups": []}

    logger.info(
        "Extracted %d action items, %d observations, %d follow-ups",
        len(data.get("action_items", [])),
        len(data.get("observations", [])),
        len(data.get("follow_ups", [])),
    )

    return InsightResults(
        action_items=data.get("action_items", []),
        observations=data.get("observations", []),
        follow_ups=data.get("follow_ups", []),
        raw_json=raw,
    )
