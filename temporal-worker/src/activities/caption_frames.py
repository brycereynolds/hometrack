from dataclasses import dataclass

import anthropic
from temporalio import activity

from src.activities.extract_frames import FrameData
from src.activities.transcribe import TranscriptSegment
from src.config import ANTHROPIC_API_KEY, logger


@dataclass
class FrameCaption:
    index: int
    timestamp_seconds: float
    caption: str


@activity.defn
async def caption_frames(
    frames: list[FrameData],
    segments: list[TranscriptSegment],
) -> list[FrameCaption]:
    """Caption each frame using Claude Haiku vision with transcript context."""
    activity.heartbeat(f"captioning {len(frames)} frames")

    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    captions: list[FrameCaption] = []

    for frame in frames:
        # Get transcript context: 60 seconds before and after the frame
        context_window = _get_context_window(segments, frame.timestamp_seconds, window=60)

        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": frame.base64_jpeg,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "You are analyzing a frame from a real estate property walkthrough video. "
                            "Describe what you see in this frame relevant to a listing agent: room type, "
                            "condition, notable features, issues, or staging details.\n\n"
                            f"Transcript context around this moment:\n{context_window}"
                        ),
                    },
                ],
            }],
        )

        caption = message.content[0].text
        captions.append(FrameCaption(
            index=frame.index,
            timestamp_seconds=frame.timestamp_seconds,
            caption=caption,
        ))

        if (frame.index + 1) % 5 == 0:
            activity.heartbeat(f"captioned {frame.index + 1}/{len(frames)} frames")

    logger.info("Captioned %d frames", len(captions))
    return captions


def _get_context_window(
    segments: list[TranscriptSegment],
    timestamp: float,
    window: float = 60,
) -> str:
    relevant = [
        seg for seg in segments
        if (timestamp - window) <= seg.start <= (timestamp + window)
    ]
    if not relevant:
        return "(no transcript available for this moment)"
    return " ".join(seg.text for seg in relevant)
