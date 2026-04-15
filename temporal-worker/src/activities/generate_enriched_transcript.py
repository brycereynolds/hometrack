from temporalio import activity

from src.config import logger
from src.models import FrameCorrelation, KeyMoment, TranscriptSegment


@activity.defn
async def generate_enriched_transcript(
    transcript_data: dict,
    moments_data: list[dict],
    correlations_data: list[dict],
) -> str:
    """Merge transcript segments with visual insights into a chronological markdown document."""
    activity.heartbeat("generating enriched transcript")

    segments = [TranscriptSegment(**s) for s in transcript_data["segments"]]
    moments = [KeyMoment(**m) for m in moments_data]
    correlations = [FrameCorrelation(**c) for c in correlations_data]

    # Build a correlation lookup by moment index
    corr_by_moment: dict[int, FrameCorrelation] = {c.moment_index: c for c in correlations}

    # Create timeline events: speech segments + visual moments
    events: list[tuple[float, str, str]] = []  # (timestamp, type, content)

    for seg in segments:
        speaker = f"**{seg.speaker}**: " if seg.speaker else ""
        events.append((seg.start, "speech", f"{speaker}{seg.text}"))

    for i, moment in enumerate(moments):
        visual_content = f"**[{moment.category.upper()}]** {moment.description}"
        corr = corr_by_moment.get(i)
        if corr and corr.ranked_frames:
            best = corr.ranked_frames[0]
            visual_content += f"\n  - *Visual*: {best.caption}"
            if best.speech_visual_relationship:
                visual_content += f"\n  - *Context*: {best.speech_visual_relationship}"
        events.append((moment.timestamp, "visual", visual_content))

    # Sort by timestamp
    events.sort(key=lambda e: e[0])

    # Build markdown
    lines = ["# Enriched Transcript", ""]
    current_minute = -1

    for ts, event_type, content in events:
        minute = int(ts // 60)
        if minute != current_minute:
            current_minute = minute
            lines.append(f"\n## {minute}:{int(ts % 60):02d}")
            lines.append("")

        ts_str = f"`{int(ts // 60)}:{int(ts % 60):02d}`"

        if event_type == "speech":
            lines.append(f"{ts_str} {content}")
        elif event_type == "visual":
            lines.append(f"\n> {ts_str} {content}\n")

    enriched = "\n".join(lines)
    logger.info("Generated enriched transcript: %d chars", len(enriched))
    return enriched
