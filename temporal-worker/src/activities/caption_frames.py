import json

import anthropic
from temporalio import activity

from src.config import ANTHROPIC_API_KEY, logger
from src.models import CorrelatedFrame, ExtractedFrame, FrameCorrelation, KeyMoment

TEMPORAL_WINDOW_SECONDS = 15
MAX_CANDIDATES_PER_MOMENT = 6
ROLLING_CONTEXT_SIZE = 5


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

    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    correlations: list[FrameCorrelation] = []
    rolling_context: list[str] = []

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

        # Subsample to max candidates
        if len(candidates) > MAX_CANDIDATES_PER_MOMENT:
            step = len(candidates) / MAX_CANDIDATES_PER_MOMENT
            candidates = [candidates[int(i * step)] for i in range(MAX_CANDIDATES_PER_MOMENT)]

        # Build vision API request with all candidate frames
        content_blocks = []
        for i, frame in enumerate(candidates):
            content_blocks.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": frame.base64_jpeg,
                },
            })
            content_blocks.append({
                "type": "text",
                "text": f"Frame {i + 1} (timestamp: {frame.timestamp_seconds:.1f}s)",
            })

        rolling_str = ""
        if rolling_context:
            rolling_str = f"\n\nPrevious correlations (avoid redundancy):\n" + "\n".join(f"- {c}" for c in rolling_context[-ROLLING_CONTEXT_SIZE:])

        content_blocks.append({
            "type": "text",
            "text": (
                f"You are analyzing frames from a real estate property walkthrough video.\n\n"
                f"Key moment: {moment.description}\n"
                f"Category: {moment.category}\n"
                f"Transcript context: {moment.transcript_context}\n"
                f"{rolling_str}\n\n"
                f"For each of the {len(candidates)} frames above:\n"
                f"1. Rate relevance to this moment (0.0-1.0)\n"
                f"2. Describe what you see relevant to the moment\n"
                f"3. Describe the relationship between what's being said and what's visible\n\n"
                f"Return JSON:\n"
                f'{{"frames": [{{"frame_number": 1, "relevance": 0.8, "caption": "...", "speech_visual_relationship": "..."}}]}}'
            ),
        })

        try:
            message = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=2000,
                messages=[{"role": "user", "content": content_blocks}],
            )

            raw = message.content[0].text.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                raw = raw.strip()

            result = json.loads(raw)
            frame_results = result.get("frames", [])
        except Exception as e:
            logger.warning("Frame correlation failed for moment %d: %s", moment_idx, e)
            frame_results = []

        # Build ranked frames
        ranked: list[CorrelatedFrame] = []
        for fr in frame_results:
            frame_num = fr.get("frame_number", 1) - 1
            if 0 <= frame_num < len(candidates):
                candidate = candidates[frame_num]
                ranked.append(CorrelatedFrame(
                    frame_index=candidate.index,
                    timestamp_seconds=candidate.timestamp_seconds,
                    relevance_score=float(fr.get("relevance", 0.5)),
                    caption=fr.get("caption", ""),
                    speech_visual_relationship=fr.get("speech_visual_relationship", ""),
                ))

        ranked.sort(key=lambda f: f.relevance_score, reverse=True)

        # Compute scrub window
        all_ts = [c.timestamp_seconds for c in candidates]
        correlation = FrameCorrelation(
            moment_index=moment_idx,
            moment_description=moment.description,
            moment_timestamp=moment.timestamp,
            ranked_frames=ranked,
            scrub_window_start=min(all_ts) if all_ts else moment.timestamp,
            scrub_window_end=max(all_ts) if all_ts else moment.timestamp,
        )
        correlations.append(correlation)

        # Update rolling context
        if ranked:
            rolling_context.append(f"{moment.description}: {ranked[0].caption[:100]}")

        if (moment_idx + 1) % 5 == 0:
            activity.heartbeat(f"correlated {moment_idx + 1}/{len(moments)} moments")

    activity.heartbeat(f"completed {len(correlations)} correlations")
    logger.info("Correlated %d moments with frames", len(correlations))
    return [c.model_dump() for c in correlations]
