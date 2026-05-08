import asyncio
import base64
import json
import re

import anthropic
import httpx
from temporalio import activity

from src.config import get_anthropic_client, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, logger
from src.models import CorrelatedFrame, ExtractedFrame, FrameCorrelation, KeyMoment

TEMPORAL_WINDOW_SECONDS = 15
MAX_CANDIDATES_PER_MOMENT = 6
ROLLING_CONTEXT_SIZE = 5


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


def _select_anchor_frames(
    candidates: list[ExtractedFrame],
    moment_timestamp: float,
    max_frames: int = MAX_CANDIDATES_PER_MOMENT,
) -> list[ExtractedFrame]:
    """Select anchor frames using intelligent subsampling.

    Always keeps: closest frame to moment, earliest in window, latest in window.
    Fills remaining slots evenly from remaining frames.
    """
    if len(candidates) <= max_frames:
        return candidates

    sorted_by_dist = sorted(candidates, key=lambda f: abs(f.timestamp_seconds - moment_timestamp))
    closest = sorted_by_dist[0]
    earliest = candidates[0]  # candidates already sorted by timestamp
    latest = candidates[-1]
    selected_indices = {closest.index, earliest.index, latest.index}

    # Fill remaining slots evenly from remaining frames
    remaining = [f for f in candidates if f.index not in selected_indices]
    slots_left = max_frames - len(selected_indices)
    if remaining and slots_left > 0:
        step = max(1, len(remaining) // slots_left)
        for ri in range(0, len(remaining), step):
            if len(selected_indices) >= max_frames:
                break
            selected_indices.add(remaining[ri].index)

    return sorted(
        [f for f in candidates if f.index in selected_indices],
        key=lambda f: f.timestamp_seconds,
    )


@activity.defn
async def correlate_frames(
    frames_data: list[dict],
    moments_data: list[dict],
) -> list[dict]:
    """Correlate frames to key moments using vision API with temporal windowing."""
    activity.heartbeat(f"correlating {len(frames_data)} frames with {len(moments_data)} moments")

    frames = [ExtractedFrame(**f) for f in frames_data]
    moments = [KeyMoment(**m) for m in moments_data]

    if not frames or not moments:
        return []

    client = get_anthropic_client()
    correlations: list[FrameCorrelation] = []
    rolling_context: list[dict] = []

    for moment_idx, moment in enumerate(moments):
        # Find candidate frames within temporal window
        candidates = [
            f for f in frames
            if abs(f.timestamp_seconds - moment.timestamp) <= TEMPORAL_WINDOW_SECONDS
        ]

        if not candidates:
            # Expand window to find nearest frames
            sorted_by_dist = sorted(frames, key=lambda f: abs(f.timestamp_seconds - moment.timestamp))
            candidates = sorted_by_dist[:3]

        # Sort candidates by timestamp before anchor selection
        candidates.sort(key=lambda f: f.timestamp_seconds)

        # Intelligent anchor selection instead of simple striding
        candidates = _select_anchor_frames(candidates, moment.timestamp)

        n_frames = len(candidates)
        frame_timestamps = [
            f"[{_format_timestamp_display(f.timestamp_seconds)}] ({f.timestamp_seconds:.1f}s)"
            for f in candidates
        ]
        window_start = min(f.timestamp_seconds for f in candidates)
        window_end = max(f.timestamp_seconds for f in candidates)
        window_start_display = _format_timestamp_display(max(0, window_start))
        window_end_display = _format_timestamp_display(window_end)

        # Build vision API request — download frames from storage
        content_blocks = []
        storage_timeout = httpx.Timeout(30.0, connect=15.0)
        async with httpx.AsyncClient(timeout=storage_timeout) as http_client:
            for frame in candidates:
                # frame.path is now a storage path like _frames/abc123/frame_0001.jpg
                # frame.base64_jpeg may be empty if frames were uploaded to storage
                if frame.base64_jpeg:
                    b64_data = frame.base64_jpeg
                else:
                    url = f"{SUPABASE_URL}/storage/v1/object/field-media/{frame.path}"
                    headers = {
                        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    }
                    for attempt in range(3):
                        try:
                            resp = await http_client.get(url, headers=headers)
                            resp.raise_for_status()
                            break
                        except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as exc:
                            if attempt < 2:
                                logger.warning("Frame download attempt %d failed: %s, retrying...", attempt + 1, exc)
                                await asyncio.sleep(2)
                            else:
                                raise
                    b64_data = base64.b64encode(resp.content).decode("ascii")
                content_blocks.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": b64_data,
                    },
                })

        # Build rolling context block
        prior_context_block = ""
        if rolling_context:
            context_lines = []
            for rc in rolling_context[-ROLLING_CONTEXT_SIZE:]:
                truncated_caption = rc["enriched_caption"][:100]
                context_lines.append(
                    f"[{rc['display']}] {rc['category']}: \"{rc['description']}\" → Enriched: \"{truncated_caption}\""
                )
            context_text = "\n".join(context_lines)
            prior_context_block = f"""

**Recent correlation context (what was just described in the prior moments):**
{context_text}

Use this context to:
- Avoid repeating descriptions of things already covered
- Note when the current moment is a continuation of a prior topic
- Provide fresh observations rather than restating what's already been documented"""

        moment_display = _format_timestamp_display(moment.timestamp)

        vision_prompt = f"""You are analyzing frames from a video recording alongside transcript context.

**What the speaker is discussing at [{moment_display}]:**
{moment.description}

**Surrounding transcript:**
{moment.transcript_context}

**You are shown {n_frames} frames from [{window_start_display}] to [{window_end_display}].**
Frame timestamps: {', '.join(frame_timestamps)}{prior_context_block}

The speaker's words and the relevant visual content are often temporally offset by 5-15 seconds.
The camera may show something BEFORE or AFTER the speaker mentions it.

Analyze:
1. **Best matching frame**: Which frame (by timestamp) best shows what the speaker is discussing? If none clearly match, say so.
2. **Visual context**: What does the best-matching frame show? Be specific.
3. **Speech-visual relationship**: How does what's shown relate to what's said? What context does the visual add?
4. **Enriched description**: 2-4 sentence caption synthesizing both speech and visual content.
5. **Ranked frames**: Rank ALL frames shown from most to least relevant. For each, provide the timestamp, rank (1 = best), and a brief relevance note.
6. **Scrub window**: Recommend a time range (start and end in seconds) that a user should scrub through to see everything relevant to this moment. This may extend beyond the frames shown if the context suggests the speaker is still referencing something.

Return ONLY valid JSON:
{{"best_frame_timestamp": 125.0, "best_frame_matches": true, "ranked_frames": [{{"timestamp": 125.0, "rank": 1, "relevance": "Shows the exact item being discussed"}}, {{"timestamp": 120.0, "rank": 2, "relevance": "Approach view showing context"}}, {{"timestamp": 130.0, "rank": 3, "relevance": "Different angle after speaker moves"}}], "scrub_start": 115.0, "scrub_end": 135.0, "visual_description": "...", "speech_visual_relationship": "...", "enriched_caption": "..."}}"""

        content_blocks.append({"type": "text", "text": vision_prompt})

        try:
            message = await client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2000,
                messages=[{"role": "user", "content": content_blocks}],
            )

            raw = message.content[0].text.strip()
            try:
                result = parse_llm_json(raw)
            except json.JSONDecodeError:
                logger.warning("JSON parse failed for moment %d, skipping", moment_idx)
                result = {}

        except Exception as e:
            logger.warning("Frame correlation failed for moment %d: %s", moment_idx, e)
            result = {}

        # Build ranked frames from the new response format
        ranked: list[CorrelatedFrame] = []
        for fr in result.get("ranked_frames", []):
            fr_ts = float(fr.get("timestamp", -1))
            if fr_ts < 0:
                continue
            # Find the candidate frame closest to the returned timestamp
            closest_frame = min(candidates, key=lambda f: abs(f.timestamp_seconds - fr_ts))
            ranked.append(CorrelatedFrame(
                frame_index=closest_frame.index,
                timestamp_seconds=closest_frame.timestamp_seconds,
                relevance_score=1.0 / fr.get("rank", 1),  # Convert rank to score
                caption=fr.get("relevance", ""),
                speech_visual_relationship=result.get("speech_visual_relationship", ""),
            ))

        # If no ranked frames from LLM, fall back to closest candidate
        if not ranked and candidates:
            closest = min(candidates, key=lambda f: abs(f.timestamp_seconds - moment.timestamp))
            ranked.append(CorrelatedFrame(
                frame_index=closest.index,
                timestamp_seconds=closest.timestamp_seconds,
                relevance_score=0.5,
                caption="(no correlation available)",
                speech_visual_relationship="",
            ))

        # Use LLM-recommended scrub window, fall back to candidate range
        scrub_start = float(result.get("scrub_start", window_start))
        scrub_end = float(result.get("scrub_end", window_end))
        best_frame_matches = result.get("best_frame_matches", True)

        correlation = FrameCorrelation(
            moment_index=moment_idx,
            moment_description=moment.description,
            moment_timestamp=moment.timestamp,
            ranked_frames=ranked,
            scrub_window_start=scrub_start,
            scrub_window_end=scrub_end,
            enriched_caption=result.get("enriched_caption"),
            visual_description=result.get("visual_description"),
            best_frame_matches=best_frame_matches,
        )
        correlations.append(correlation)

        # Update rolling context with detailed info
        enriched = result.get("enriched_caption", "")
        if enriched:
            rolling_context.append({
                "display": moment_display,
                "category": moment.category,
                "description": moment.description,
                "enriched_caption": enriched,
            })

        if (moment_idx + 1) % 5 == 0:
            activity.heartbeat(f"correlated {moment_idx + 1}/{len(moments)} moments")

    activity.heartbeat(f"completed {len(correlations)} correlations")
    logger.info("Correlated %d moments with frames", len(correlations))
    return [c.model_dump() for c in correlations]
