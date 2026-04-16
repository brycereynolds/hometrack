import httpx
from temporalio import activity

from src.config import REALTY_API_HOST, REALTY_API_KEY, logger


@activity.defn
async def geocode_address(address: str) -> dict:
    """Geocode an address to lat/lng using Realty API auto-complete fallback to Nominatim."""
    activity.heartbeat("geocoding address")

    # Try Realty API address lookup first (returns coordinates)
    if REALTY_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"https://{REALTY_API_HOST}/pro/byaddress",
                    params={"propertyaddress": address},
                    headers={
                        "x-realtyapi-key": REALTY_API_KEY,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                pd = data.get("propertyDetails", {})
                lat = pd.get("latitude")
                lng = pd.get("longitude")
                if lat and lng:
                    logger.info("Geocoded via Realty API: %s -> (%s, %s)", address, lat, lng)
                    return {"lat": float(lat), "lng": float(lng)}
        except Exception as e:
            logger.warning("Realty API geocoding failed, falling back to Nominatim: %s", e)

    # Fallback: Nominatim (free, no API key needed)
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": address, "format": "json", "limit": 1},
                headers={"User-Agent": "HomeTrack/1.0"},
            )
            resp.raise_for_status()
            results = resp.json()
            if results:
                lat = float(results[0]["lat"])
                lng = float(results[0]["lon"])
                logger.info("Geocoded via Nominatim: %s -> (%s, %s)", address, lat, lng)
                return {"lat": lat, "lng": lng}
    except Exception as e:
        logger.error("Nominatim geocoding failed: %s", e)

    raise RuntimeError(f"Could not geocode address: {address}")
