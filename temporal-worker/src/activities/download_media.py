import hashlib
import os
import subprocess
import tempfile

from temporalio import activity

from src.config import logger
from src.storage import download_from_storage

CACHE_DIR = os.path.join(tempfile.gettempdir(), "hometrack_media_cache")


@activity.defn
async def download_media(storage_path: str) -> dict:
    """Download media file from Supabase Storage, downscale if needed, and cache."""
    activity.heartbeat("starting download")

    # Parse bucket/path — storage_path format: "bucket-name/path/to/file.ext"
    parts = storage_path.split("/", 1)
    bucket = parts[0]
    path = parts[1] if len(parts) > 1 else ""

    ext = os.path.splitext(storage_path)[1]
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    tmp.close()

    await download_from_storage(bucket, path, tmp.name)
    activity.heartbeat("download complete")

    file_size = os.path.getsize(tmp.name)

    # Compute content hash for caching
    content_hash = _compute_hash(tmp.name)

    # Check cache
    os.makedirs(CACHE_DIR, exist_ok=True)
    cached_path = os.path.join(CACHE_DIR, f"{content_hash}{ext}")
    if os.path.exists(cached_path):
        os.unlink(tmp.name)
        logger.info("Cache hit for %s (hash: %s)", storage_path, content_hash[:12])
        return {
            "local_path": cached_path,
            "file_size": os.path.getsize(cached_path),
            "content_hash": content_hash,
            "was_cached": True,
        }

    # Downscale video to 1080p if resolution is higher
    if ext.lower() in (".mp4", ".mov", ".avi", ".mkv", ".webm"):
        downscaled = _downscale_to_1080p(tmp.name, cached_path)
        if downscaled:
            os.unlink(tmp.name)
            file_size = os.path.getsize(cached_path)
            logger.info("Downscaled video to 1080p: %s", cached_path)
        else:
            os.rename(tmp.name, cached_path)
    else:
        os.rename(tmp.name, cached_path)

    activity.heartbeat("processing complete")
    return {
        "local_path": cached_path,
        "file_size": file_size,
        "content_hash": content_hash,
        "was_cached": False,
    }


def _compute_hash(file_path: str) -> str:
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _downscale_to_1080p(input_path: str, output_path: str) -> bool:
    """Downscale video to 1080p if current resolution is higher. Returns True if downscaled."""
    # Probe resolution
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=height", "-of", "csv=p=0", input_path],
        capture_output=True, text=True,
    )
    try:
        height = int(probe.stdout.strip())
    except (ValueError, AttributeError):
        return False

    if height <= 1080:
        return False

    result = subprocess.run(
        ["ffmpeg", "-i", input_path,
         "-vf", "scale=-2:1080",
         "-c:v", "libx264", "-preset", "fast", "-crf", "23",
         "-c:a", "copy",
         "-y", output_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        logger.warning("Downscale failed: %s", result.stderr[:300])
        return False
    return True
