import base64
import glob as globmod
import os
import subprocess
import tempfile

from temporalio import activity

from src.config import logger
from src.models import ExtractedFrame
from src.storage import upload_to_storage

DEFAULT_INTERVAL_SECONDS = 5
SCENE_CHANGE_THRESHOLD = 0.3

# Frames are uploaded to storage under this prefix inside the field-media bucket.
# The full path includes the video's storage path to keep frames grouped with their source.
FRAMES_BUCKET = "field-media"


@activity.defn
async def extract_frames(
    video_path: str,
    interval_seconds: float = DEFAULT_INTERVAL_SECONDS,
    use_scene_detection: bool = True,
) -> list[dict]:
    """Extract frames at fixed intervals, upload to storage, return metadata only."""
    activity.heartbeat("extracting frames")

    tmp_dir = tempfile.mkdtemp(prefix="frames_")

    # 1. Interval-based extraction
    interval_dir = os.path.join(tmp_dir, "interval")
    os.makedirs(interval_dir)
    cmd = [
        "ffmpeg", "-i", video_path,
        "-vf", f"fps=1/{interval_seconds}",
        "-q:v", "2",
        os.path.join(interval_dir, "frame_%06d.jpg"),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.error("Interval extraction failed: %s", result.stderr[:300])
        raise RuntimeError(f"ffmpeg frame extraction failed: {result.stderr[:500]}")

    interval_files = sorted(globmod.glob(os.path.join(interval_dir, "frame_*.jpg")))
    # Build timestamp map: frame N -> (N-1) * interval
    timestamps: dict[str, float] = {}
    for i, fpath in enumerate(interval_files):
        timestamps[fpath] = i * interval_seconds

    # 2. Optional scene detection merge
    if use_scene_detection:
        scene_dir = os.path.join(tmp_dir, "scene")
        os.makedirs(scene_dir)
        scene_cmd = [
            "ffmpeg", "-i", video_path,
            "-vf", f"select='gt(scene,{SCENE_CHANGE_THRESHOLD})',showinfo",
            "-vsync", "vfr",
            "-frame_pts", "1",
            "-q:v", "2",
            os.path.join(scene_dir, "scene_%06d.jpg"),
        ]
        scene_result = subprocess.run(scene_cmd, capture_output=True, text=True)
        if scene_result.returncode == 0:
            scene_files = sorted(globmod.glob(os.path.join(scene_dir, "scene_*.jpg")))
            # Parse timestamps from ffmpeg showinfo output
            scene_ts = _parse_showinfo_timestamps(scene_result.stderr)
            for i, fpath in enumerate(scene_files):
                ts = scene_ts[i] if i < len(scene_ts) else None
                if ts is not None:
                    # Only add scene frame if it's not too close to an interval frame
                    too_close = any(
                        abs(ts - existing_ts) < interval_seconds * 0.5
                        for existing_ts in timestamps.values()
                    )
                    if not too_close:
                        timestamps[fpath] = ts
        else:
            logger.warning("Scene detection failed, using interval frames only")

    # 3. Sort all frames by timestamp, upload to storage, build output
    sorted_items = sorted(timestamps.items(), key=lambda x: x[1])

    # Derive a storage prefix from the video path (e.g. teamId/listingId/timestamp)
    # video_path is a local temp file, but we use a hash-based prefix
    import hashlib
    video_hash = hashlib.md5(video_path.encode()).hexdigest()[:12]
    storage_prefix = f"_frames/{video_hash}"

    frames: list[ExtractedFrame] = []
    for idx, (fpath, ts) in enumerate(sorted_items):
        with open(fpath, "rb") as f:
            frame_bytes = f.read()

        # Upload frame to Supabase Storage
        frame_storage_path = f"{storage_prefix}/frame_{idx:04d}.jpg"
        await upload_to_storage(FRAMES_BUCKET, frame_storage_path, frame_bytes, "image/jpeg")

        frames.append(ExtractedFrame(
            index=idx,
            timestamp_seconds=ts,
            path=frame_storage_path,
            base64_jpeg="",  # Not included in Temporal payload
        ))
        if (idx + 1) % 10 == 0:
            activity.heartbeat(f"uploaded {idx + 1}/{len(sorted_items)} frames")

    # Clean up local files
    for fpath in timestamps:
        try:
            os.unlink(fpath)
        except OSError:
            pass
    for d in [os.path.join(tmp_dir, "interval"), os.path.join(tmp_dir, "scene"), tmp_dir]:
        try:
            os.rmdir(d)
        except OSError:
            pass

    activity.heartbeat(f"extracted {len(frames)} frames")
    logger.info("Extracted %d frames (interval=%.1fs)", len(frames), interval_seconds)
    return [f.model_dump() for f in frames]


def _parse_showinfo_timestamps(stderr: str) -> list[float]:
    """Parse pts_time values from ffmpeg showinfo filter output."""
    import re
    timestamps = []
    for match in re.finditer(r"pts_time:\s*([\d.]+)", stderr):
        timestamps.append(float(match.group(1)))
    return timestamps
