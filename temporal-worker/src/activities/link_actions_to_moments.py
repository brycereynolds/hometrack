import json
import re

from temporalio import activity

from src.config import get_anthropic_client, logger
from src.models import ActionMomentLink, LinkActionsToMomentsOutput

LINKING_PROMPT = """\
You are analyzing data from a property walkthrough video processing pipeline.

You have two lists:
1. KEY MOMENTS — timestamped events from the video (observations, decisions, visual references, etc.)
2. ACTION ITEMS — tasks extracted from the walkthrough (repairs, improvements, follow-ups, etc.)

Your job: for each action item, identify which key moments are relevant to it.
An action item may relate to MULTIPLE moments (e.g., "replace all vents" might reference several moments where vents were shown at different timestamps).
An action item may also relate to ZERO moments if it was mentioned generally without a specific moment.

Return ONLY valid JSON — no markdown fences, no explanation:
{{"links": [{{"action_index": 0, "moment_indices": [2, 5], "relevance": "Brief explanation of why these moments relate to this action"}}, ...]}}

- action_index: zero-based index into the action items list
- moment_indices: zero-based indices into the key moments list (empty array if no moments match)
- relevance: one sentence explaining the connection

## KEY MOMENTS
{moments}

## ACTION ITEMS
{actions}"""


def _format_moments(moments: list[dict]) -> str:
    lines = []
    for i, m in enumerate(moments):
        ts = m.get("timestamp", 0)
        desc = m.get("description", "")
        cat = m.get("category", "")
        ctx = m.get("transcript_context", "")
        lines.append(f"[{i}] ({ts:.0f}s) [{cat}] {desc}")
        if ctx:
            lines.append(f"    Context: {ctx[:200]}")
    return "\n".join(lines)


def _format_actions(actions: list[dict]) -> str:
    lines = []
    for i, a in enumerate(actions):
        title = a.get("title", "")
        desc = a.get("description", "")
        cat = a.get("category", "")
        quote = a.get("source_quote", "")
        ts = a.get("source_timestamp")
        ts_str = f" @{ts:.0f}s" if ts else ""
        lines.append(f"[{i}] [{cat}] {title}{ts_str}")
        if desc:
            lines.append(f"    {desc[:150]}")
        if quote:
            lines.append(f"    Quote: \"{quote[:150]}\"")
    return "\n".join(lines)


def _parse_llm_json(raw_text: str) -> dict:
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*]', ']', text)
    return json.loads(text)


@activity.defn
async def link_actions_to_moments(
    moments_data: list[dict],
    action_items_data: list[dict],
) -> dict:
    """Use an LLM to link action items to their related key moments."""
    activity.heartbeat("linking actions to moments")

    if not moments_data or not action_items_data:
        return LinkActionsToMomentsOutput().model_dump()

    prompt = LINKING_PROMPT.format(
        moments=_format_moments(moments_data),
        actions=_format_actions(action_items_data),
    )

    client = get_anthropic_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    try:
        parsed = _parse_llm_json(raw)
    except json.JSONDecodeError:
        logger.error("Failed to parse action-moment links JSON: %s", raw[:200])
        return LinkActionsToMomentsOutput().model_dump()

    links_data = parsed.get("links", [])
    num_actions = len(action_items_data)
    num_moments = len(moments_data)

    links = []
    for link in links_data:
        action_idx = link.get("action_index")
        moment_indices = link.get("moment_indices", [])
        relevance = link.get("relevance", "")

        if action_idx is None or not isinstance(action_idx, int):
            continue
        if action_idx < 0 or action_idx >= num_actions:
            continue

        # Filter out invalid moment indices
        valid_indices = [
            mi for mi in moment_indices
            if isinstance(mi, int) and 0 <= mi < num_moments
        ]

        if valid_indices:
            links.append(ActionMomentLink(
                action_index=action_idx,
                moment_indices=valid_indices,
                relevance=relevance,
            ))

    output = LinkActionsToMomentsOutput(links=links)
    logger.info(
        "Linked %d action items to moments (%d total links)",
        len(output.links),
        sum(len(l.moment_indices) for l in output.links),
    )
    return output.model_dump()
