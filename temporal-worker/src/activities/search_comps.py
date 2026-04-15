import asyncio
import json
import math
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from temporalio import activity

from src.config import REALTY_API_HOST, REALTY_API_KEY, logger
from src.db import get_pool


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


async def _upsert_property_from_comp(conn, comp: dict) -> str | None:
    """Insert or update a property record from comp data, returning property_id."""
    address = comp.get("address", "")
    city = comp.get("city", "")
    state = comp.get("state", "")
    zip_code = comp.get("zip", "")

    if not address or not city or not state or not zip_code:
        return None

    now = datetime.now(timezone.utc)

    # Check if property already exists by address
    row = await conn.fetchrow(
        "SELECT id FROM properties WHERE address = $1 AND city = $2 AND state = $3 AND zip = $4",
        address, city, state, zip_code,
    )

    if row:
        # Update last_synced
        await conn.execute(
            "UPDATE properties SET last_synced = $1, updated_at = $1 WHERE id = $2",
            now, row["id"],
        )
        return row["id"]

    # Insert new property with available comp data
    property_id = f"prop_{uuid.uuid4().hex[:12]}"
    photos_json = json.dumps([{"url": comp["photo_url"], "source": "realty_api"}]) if comp.get("photo_url") else "[]"

    await conn.execute(
        """INSERT INTO properties (
            id, address, city, state, zip,
            lat, lng, beds, baths, sqft, lot_sqft,
            year_built, last_sold_price,
            photos, last_synced, created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11,
            $12, $13,
            $14::jsonb, $15, $15, $15
        )""",
        property_id, address, city, state, zip_code,
        comp.get("lat"), comp.get("lng"),
        comp.get("beds"), comp.get("baths"), comp.get("sqft"), comp.get("lot_sqft"),
        comp.get("year_built"), comp.get("price"),
        photos_json, now,
    )

    return property_id


async def _find_cached_comps(params: dict) -> list[dict]:
    """Check properties table for recently synced data matching search criteria.

    Returns cached property data as comp dicts if last_synced within 7 days.
    """
    lat = params["lat"]
    lng = params["lng"]
    radius = params.get("radius_miles", 1.0)
    beds = params.get("beds")
    baths = params.get("baths")
    sqft = params.get("sqft")
    status = params.get("status", "sold")
    limit = params.get("limit", 50)

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    # Use a bounding box approximation for lat/lng (1 degree lat ~ 69 miles)
    lat_delta = radius / 69.0
    lng_delta = radius / (69.0 * math.cos(math.radians(lat)))

    conditions = [
        "last_synced > $1",
        "lat BETWEEN $2 AND $3",
        "lng BETWEEN $4 AND $5",
    ]
    values: list = [
        seven_days_ago,
        lat - lat_delta, lat + lat_delta,
        lng - lng_delta, lng + lng_delta,
    ]
    param_idx = 6

    if beds:
        conditions.append(f"beds BETWEEN ${param_idx} AND ${param_idx + 1}")
        values.extend([max(1, beds - 1), beds + 1])
        param_idx += 2

    if baths:
        conditions.append(f"baths BETWEEN ${param_idx} AND ${param_idx + 1}")
        values.extend([max(1, baths - 1), baths + 1])
        param_idx += 2

    if sqft:
        conditions.append(f"sqft BETWEEN ${param_idx} AND ${param_idx + 1}")
        values.extend([int(sqft * 0.7), int(sqft * 1.3)])
        param_idx += 2

    # For sold comps, filter by last_sold_price being set
    if status == "sold":
        conditions.append("last_sold_price IS NOT NULL")

    where_clause = " AND ".join(conditions)
    query = f"""
        SELECT id, address, city, state, zip, lat, lng,
               beds, baths, sqft, lot_sqft, year_built,
               last_sold_price, photos
        FROM properties
        WHERE {where_clause}
        LIMIT ${param_idx}
    """
    values.append(limit)

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *values)

    comps = []
    for row in rows:
        photos = json.loads(row["photos"]) if isinstance(row["photos"], str) else (row["photos"] or [])
        photo_url = photos[0].get("url") if photos else None

        price = row["last_sold_price"]
        sqft_val = row["sqft"]
        price_per_sqft = round(price / sqft_val) if price and sqft_val else None

        comps.append({
            "property_id": row["id"],
            "external_id": "",
            "address": row["address"],
            "city": row["city"],
            "state": row["state"],
            "zip": row["zip"],
            "price": price,
            "price_per_sqft": price_per_sqft,
            "beds": row["beds"],
            "baths": row["baths"],
            "sqft": sqft_val,
            "lot_sqft": row["lot_sqft"],
            "year_built": row["year_built"],
            "sold_date": None,
            "days_on_market": None,
            "status": status,
            "distance_miles": round(_haversine_miles(lat, lng, row["lat"], row["lng"]), 2),
            "lat": row["lat"],
            "lng": row["lng"],
            "photo_url": photo_url,
            "from_cache": True,
        })

    return comps


@activity.defn
async def search_comps(params: dict) -> list[dict]:
    """Search for comparable properties via Realty API.

    Checks the properties table cache first (7-day window) before calling the API.
    Persists all API results into the properties table.

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

    # Check cache first
    try:
        cached = await _find_cached_comps(params)
        if len(cached) >= limit:
            cached.sort(key=lambda c: c["distance_miles"])
            logger.info(
                "Cache hit: %d %s comps within %s miles of (%s, %s)",
                len(cached), status, radius, lat, lng,
            )
            return cached[:limit]
        logger.info("Cache: found %d/%d comps, will supplement from API", len(cached), limit)
    except Exception as e:
        logger.warning("Cache lookup failed, falling back to API: %s", e)
        cached = []

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

        # Persist all comps to properties table
        activity.heartbeat("persisting comps to properties table")
        pool = await get_pool()
        async with pool.acquire() as conn:
            for comp in comps:
                try:
                    property_id = await _upsert_property_from_comp(conn, comp)
                    if property_id:
                        comp["property_id"] = property_id
                except Exception as e:
                    logger.warning("Failed to persist property %s: %s", comp.get("address"), e)

        # Merge with cached results (deduplicate by address)
        if cached:
            cached_addresses = {(c["address"], c["city"], c["state"]) for c in cached}
            for comp in comps:
                key = (comp.get("address"), comp.get("city"), comp.get("state"))
                if key not in cached_addresses:
                    cached.append(comp)
            comps = cached

        # Sort by distance
        comps.sort(key=lambda c: c["distance_miles"])

        logger.info(
            "Found %d %s comps within %s miles of (%s, %s)",
            len(comps), status, radius, lat, lng,
        )
        return comps

    except httpx.HTTPStatusError as e:
        logger.error("Realty API error (%d): %s", e.response.status_code, e.response.text[:500])
        # Return cached results if API fails
        if cached:
            logger.info("Returning %d cached comps after API failure", len(cached))
            return cached
        return []
    except Exception as e:
        logger.error("Comp search failed: %s", e)
        if cached:
            logger.info("Returning %d cached comps after error", len(cached))
            return cached
        return []
