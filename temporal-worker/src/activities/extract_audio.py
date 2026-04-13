import os
import subprocess
import tempfile

from temporalio import activity

from src.config import logger


@activity.defn
async def extract_audio(video_path: str) -> str:
    """Extract audio from video as 16kHz mono MP3 using ffmpeg."""
    activity.heartbeat("extracting audio")

    output_path = tempfile.mktemp(suffix=".mp3")
    cmd = [
        "ffmpeg", "-i", video_path,
        "-vn", "-acodec", "libmp3lame",
        "-ar", "16000", "-ac", "1", "-q:a", "4",
        "-y", output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.error("ffmpeg audio extraction failed: %s", result.stderr)
        raise RuntimeError(f"ffmpeg failed: {result.stderr[:500]}")

    logger.info("Extracted audio: %s (%.1f MB)", output_path, os.path.getsize(output_path) / 1e6)
    return output_path
