import base64
import glob
import os
import subprocess
import tempfile
from dataclasses import dataclass

from temporalio import activity

from src.config import logger

MAX_FRAMES = 50
MIN_INTERVAL_SECONDS = 3
SCENE_CHANGE_THRESHOLD = 0.3


@dataclass
class FrameData:
    index: int
    timestamp_seconds: float
    base64_jpeg: str


@activity.defn
async def extract_frames(video_path: str) -> list[FrameData]:
    """Extract key frames from video using ffmpeg scene-change detection."""
    activity.heartbeat("extracting frames")

    tmp_dir = tempfile.mkdtemp(prefix="frames_")

    # Use scene change detection filter
    cmd = [
        "ffmpeg", "-i", video_path,
        "-vf", f"select='gt(scene,{SCENE_CHANGE_THRESHOLD})',showinfo",
        "-vsync", "vfr",
        "-frame_pts", "1",
        "-q:v", "2",
        os.path.join(tmp_dir, "frame_%04d.jpg"),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.warning("Scene detection failed, falling back to interval extraction: %s", result.stderr[:300])
        # Fallback: extract one frame every 3 seconds
        cmd = [
            "ffmpeg", "-i", video_path,
            "-vf", f"fps=1/{MIN_INTERVAL_SECONDS}",
            "-q:v", "2",
            os.path.join(tmp_dir, "frame_%04d.jpg"),
        ]
        subprocess.run(cmd, capture_output=True, text=True, check=True)

    frame_files = sorted(glob.glob(os.path.join(tmp_dir, "frame_*.jpg")))

    # Enforce min interval and max frames
    frames: list[FrameData] = []
    last_ts = -MIN_INTERVAL_SECONDS
    for i, fpath in enumerate(frame_files):
        ts = i * MIN_INTERVAL_SECONDS  # approximate timestamp
        if ts - last_ts < MIN_INTERVAL_SECONDS:
            continue
        with open(fpath, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
        frames.append(FrameData(index=len(frames), timestamp_seconds=ts, base64_jpeg=b64))
        last_ts = ts
        if len(frames) >= MAX_FRAMES:
            break

    # Clean up frame files
    for fpath in frame_files:
        os.unlink(fpath)
    os.rmdir(tmp_dir)

    activity.heartbeat(f"extracted {len(frames)} frames")
    logger.info("Extracted %d key frames from video", len(frames))
    return frames
