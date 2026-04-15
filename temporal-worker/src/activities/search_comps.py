import asyncio
import math
from datetime import datetime, timedelta, timezone

import httpx
from temporalio import activity

from src.config import REALTY_API_HOST, REALTY_API_KEY, logger


def _haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in miles between two lat/lng points."""
    R = 3958.8  # Earth radius in miles
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _parse_property(prop: dict, subject_lat: float, subject_lng: float) -> dict | None:
    """Extract comp fields from a Realty API property result."""
    location = prop.get("location", {})
    coord = location.get("coordinate", {})
    address_info = location.get("address", {})
    description = prop.get("description", {})

    lat = coord.get("lat")
    lng = coord.get("lon") or coord.get("lng")
    if lat is None or lng is None:
        return None

    photos = prop.get("photos", [])
    photo_url = photos[0].get("href") if photos else None

    price = prop.get("last_sold_price") or prop.get("list_price")
    sqft = description.get("sqft")
    price_per_sqft = round(price / sqft) if price and sqft else None

    return {
        "external_id": prop.get("property_id", ""),
        "address": address_info.get("line", ""),
        "city": address_info.get("city", ""),
        "state": address_info.get("state_code", ""),
        "zip": address_info.get("postal_code", ""),
        "price": price,
        "price_per_sqft": price_per_sqft,
        "beds": description.get("beds"),
        "baths": description.get("baths"),
        "sqft": sqft,
        "lot_sqft": description.get("lot_sqft"),
        "year_built": description.get("year_built"),
        "sold_date": prop.get("last_sold_date") or prop.get("sold_date"),
        "days_on_market": prop.get("days_on_market"),
        "status": prop.get("status", ""),
        "distance_miles": round(_haversine_miles(subject_lat, subject_lng, lat, lng), 2),
        "lat": lat,
        "lng": lng,
        "photo_url": photo_url,
    }


@activity.defn
async def search_comps(params: dict) -> list[dict]:
    """Search for comparable properties via Realty API.

    params:
        lat, lng: center point
        radius_miles: search radius
        status: 'sold' or 'for_sale'
        property_type: e.g. 'single_family'
        beds, baths, sqft: subject property values for filtering
        limit: max results (default 50)
    """
    activity.heartbeat(f"searching {params.get('status', '')} comps")

    lat = params["lat"]
    lng = params["lng"]
    radius = params.get("radius_miles", 1.0)
    status = params.get("status", "sold")
    property_type = params.get("property_type", "single_family")
    beds = params.get("beds")
    baths = params.get("baths")
    sqft = params.get("sqft")
    limit = params.get("limit", 50)

    # Build query params
    query: dict = {
        "lat": lat,
        "lng": lng,
        "radius": radius,
        "status": status,
        "limit": limit,
        "sort": "sold_date" if status == "sold" else "relevant",
    }

    if property_type:
        query["type"] = property_type

    # Filter beds ±1
    if beds:
        query["beds_min"] = max(1, beds - 1)
        query["beds_max"] = beds + 1

    # Filter baths ±1
    if baths:
        query["baths_min"] = max(1, baths - 1)
        query["baths_max"] = baths + 1

    # Filter sqft ±30%
    if sqft:
        query["sqft_min"] = int(sqft * 0.7)
        query["sqft_max"] = int(sqft * 1.3)

    # Sold within last 6 months for sold comps
    if status == "sold":
        six_months_ago = (datetime.now(timezone.utc) - timedelta(days=180)).strftime("%Y-%m-%d")
        query["sold_date_min"] = six_months_ago

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Rate limit: 200ms delay
            await asyncio.sleep(0.2)

            resp = await client.get(
                "https://realty-in-us.p.rapidapi.com/properties/v3/list",
                params=query,
                headers={
                    "X-RapidAPI-Key": REALTY_API_KEY,
                    "X-RapidAPI-Host": REALTY_API_HOST,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        activity.heartbeat("parsing comp results")

        properties = data.get("data", {}).get("home_search", {}).get("results", [])
        if not properties:
            # Try alternate response structure
            properties = data.get("data", {}).get("results", [])

        comps = []
        for prop in properties:
            parsed = _parse_property(prop, lat, lng)
            if parsed:
                comps.append(parsed)

        # Sort by distance
        comps.sort(key=lambda c: c["distance_miles"])

        logger.info(
            "Found %d %s comps within %s miles of (%s, %s)",
            len(comps), status, radius, lat, lng,
        )
        return comps

    except httpx.HTTPStatusError as e:
        logger.error("Realty API error (%d): %s", e.response.status_code, e.response.text[:500])
        return []
    except Exception as e:
        logger.error("Comp search failed: %s", e)
        return []
