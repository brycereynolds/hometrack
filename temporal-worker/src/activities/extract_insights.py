import json

import anthropic
from temporalio import activity

from src.config import get_anthropic_client, logger
from src.models import FieldNoteInsights

EXTRACTION_PROMPT = """\
You are analyzing a field note from a real estate listing agent who just completed a property walkthrough.
This is a professional property visit — extract structured insights for the agent's listing workflow.

Extract the following:

1. ACTION ITEMS: Concrete tasks that need to be done
   - title: Short task name
   - description: Details
   - priority: low / medium / high / urgent
   - category: improvements / staging / media / marketing / disclosures / general
   - quote_needed: true/false (does this need a vendor quote?)
   - source_quote: The exact words from the transcript that led to this item

2. OBSERVATIONS: Notable property observations
   - content: What was observed
   - observation_type: positive / concern / neutral
   - area: Room or area (kitchen, bathroom, exterior, etc.)

3. DECISIONS: Decisions made during the walkthrough
   - content: What was decided
   - decided_by: Who made the decision (if identifiable)

4. QUOTES NEEDED: Vendor quotes that should be obtained
   - description: What work needs quoting
   - trade: plumber / electrician / painter / roofer / landscaper / general_contractor / other
   - priority: low / medium / high / urgent
   - source_quote: The exact words from the transcript

5. QUESTIONS RAISED: Unanswered questions from the walkthrough
   - content: The question
   - directed_to: Who should answer (seller, inspector, contractor, etc.)

Return as JSON:
{
  "action_items": [...],
  "observations": [...],
  "decisions": [...],
  "quotes_needed": [...],
  "questions_raised": [...],
  "summary": "2-3 sentence summary of the walkthrough"
}

Only return the JSON object, no other text."""


@activity.defn
async def extract_insights(
    enriched_transcript: str,
    correlations_summary: str | None = None,
) -> dict:
    """Extract HomeTrack-specific insights using Pydantic models for structured output."""
    activity.heartbeat("extracting insights")

    content = f"ENRICHED TRANSCRIPT / FIELD NOTES:\n{enriched_transcript}"
    if correlations_summary:
        content += f"\n\nVISUAL CORRELATION SUMMARY:\n{correlations_summary}"

    client = get_anthropic_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
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
        insights = FieldNoteInsights(**data)
    except (json.JSONDecodeError, Exception) as e:
        logger.error("Failed to parse insights: %s — raw: %s", e, raw[:200])
        insights = FieldNoteInsights()

    logger.info(
        "Extracted %d action items, %d observations, %d decisions, %d quotes, %d questions",
        len(insights.action_items),
        len(insights.observations),
        len(insights.decisions),
        len(insights.quotes_needed),
        len(insights.questions_raised),
    )

    return insights.model_dump()
