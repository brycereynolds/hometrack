import os
import tempfile
from dataclasses import dataclass

from temporalio import activity

from src.storage import download_from_storage


@dataclass
class DownloadResult:
    local_path: str
    file_size: int


@activity.defn
async def download_media(storage_path: str) -> DownloadResult:
    """Download media file from Supabase Storage to a temp directory."""
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
    return DownloadResult(local_path=tmp.name, file_size=file_size)
