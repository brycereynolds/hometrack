import httpx

from src.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY


async def download_from_storage(bucket: str, path: str, dest: str) -> str:
    """Download a file from Supabase Storage to a local path."""
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        with open(dest, "wb") as f:
            f.write(resp.content)
    return dest


async def upload_to_storage(bucket: str, path: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload data to Supabase Storage. Returns the storage path."""
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": content_type,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        # Use upsert to handle re-processing
        resp = await client.put(url, headers={**headers, "x-upsert": "true"}, content=data)
        if resp.status_code == 404:
            # Bucket path doesn't exist yet, try POST
            resp = await client.post(url, headers=headers, content=data)
        resp.raise_for_status()
    return f"{bucket}/{path}"
