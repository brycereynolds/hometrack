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
