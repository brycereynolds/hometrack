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


def _parse_search_result(prop: dict, subject_lat: float, subject_lng: float) -> dict | None:
    """Parse a single search result from the Realty API.

    Field mapping matches the real search/bycoordinates response structure:
    - address: nested dict with streetAddress, city, state, zipcode
    - location: nested dict with latitude, longitude
    - price: nested dict with value, pricePerSquareFoot
    - lotSizeWithUnit: nested dict with lotSize, lotSizeUnit
    - listing: nested dict with listingStatus
    - media: nested dict with propertyPhotoLinks
    - estimates: nested dict with zestimate
    """
    # --- Address (nested) ---
    addr = prop.get("address", {})
    street = addr.get("streetAddress", "")
    city = addr.get("city", "")
    state = addr.get("state", "")
    zipcode = addr.get("zipcode", "")

    if not street:
        return None

    # --- Location (nested) ---
    location = prop.get("location", {})
    lat = location.get("latitude")
    lng = location.get("longitude")
    if lat is None or lng is None:
        return None

    lat = float(lat)
    lng = float(lng)

    # --- Price (nested dict with value) ---
    price_data = prop.get("price", {})
    price = price_data.get("value") if isinstance(price_data, dict) else price_data
    price_per_sqft = price_data.get("pricePerSquareFoot") if isinstance(price_data, dict) else None

    # --- Property details (flat fields) ---
    beds = prop.get("bedrooms")
    baths = prop.get("bathrooms")
    sqft = prop.get("livingArea")
    year_built = prop.get("yearBuilt")
    property_type = prop.get("propertyType") or prop.get("homeType")

    # --- Lot size (nested with unit) ---
    lot_data = prop.get("lotSizeWithUnit", {})
    lot_sqft = lot_data.get("lotSize")
    if lot_data.get("lotSizeUnit") == "acres" and lot_sqft:
        lot_sqft = int(lot_sqft * 43560)  # Convert acres to sqft
    elif lot_sqft:
        lot_sqft = int(lot_sqft)

    # --- Status (nested under listing) ---
    listing = prop.get("listing", {})
    status = listing.get("listingStatus", "unknown")

    # --- Days on market ---
    dom = prop.get("daysOnZillow")

    # --- Photos (nested under media) ---
    media = prop.get("media", {})
    photo_links = media.get("propertyPhotoLinks", {})
    photo_url = photo_links.get("mediumSizeLink") or photo_links.get("highResolutionLink")

    # --- Estimates (nested) ---
    estimates = prop.get("estimates", {})
    zestimate = estimates.get("zestimate") if isinstance(estimates.get("zestimate"), (int, float)) else None

    # --- External ID ---
    zpid = prop.get("zpid")

    # Compute price_per_sqft if not provided by API
    if not price_per_sqft and price and sqft:
        price_per_sqft = round(price / sqft)

    return {
        "external_id": str(zpid) if zpid else None,
        "source": "realty_api",
        "address": f"{street}, {city}, {state} {zipcode}".strip(),
        "city": city,
        "state": state,
        "zip": zipcode,
        "price": price,
        "price_per_sqft": price_per_sqft,
        "beds": beds,
        "baths": baths,
        "sqft": sqft,
        "lot_sqft": lot_sqft,
        "year_built": year_built,
        "property_type": property_type,
        "status": status,
        "days_on_market": dom,
        "distance_miles": round(_haversine_miles(subject_lat, subject_lng, lat, lng), 2),
        "lat": lat,
        "lng": lng,
        "photo_url": photo_url,
        "zestimate": zestimate,
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


def _build_search_params(
    lat: float,
    lng: float,
    radius: float,
    status: str,
    beds: int | None,
) -> dict:
    """Build query params for the Realty API search/bycoordinates endpoint."""
    params = {
        "latitude": str(lat),
        "longitude": str(lng),
        "radius": str(radius),
        "page": "1",
        "sortOrder": "Homes_for_you",
        "bed_min": str(beds - 1) if beds else "No_Min",
        "bed_max": str(beds + 1) if beds else "No_Max",
        "bathrooms": "Any",
        "homeType": "Houses, Townhomes, Multi-family, Condos/Co-ops",
        "maxHOA": "Any",
        "listingType": "By_Agent",
        "listingTypeOptions": "Agent listed,New Construction,Fore-closures,Auctions",
        "parkingSpots": "Any",
        "mustHaveBasement": "No",
        "daysOnZillow": "Any",
    }

    # Only For_Sale is supported on our API tier (Recently_Sold returns 0 results)
    params["listingStatus"] = "For_Sale"
    params["soldInLast"] = "Any"

    return params


@activity.defn
async def search_comps(params: dict) -> list[dict]:
    """Search for comparable properties via Realty API (zillow.realtyapi.io).

    Uses GET /search/bycoordinates with the exact Realty API spec.
    Persists all returned properties into the properties table.

    params:
        lat, lng: center point for coordinate search
        address: subject property address (for logging)
        radius_miles: search radius (miles)
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
    beds = params.get("beds")
    baths = params.get("baths")
    sqft = params.get("sqft")
    limit = params.get("limit", 50)

    search_params = _build_search_params(lat, lng, radius, status, beds)

    all_results: list[dict] = []

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Fetch page 1
            await asyncio.sleep(0.3)

            url = f"https://{REALTY_API_HOST}/search/bycoordinates"
            headers = {"x-realtyapi-key": REALTY_API_KEY}

            resp = await client.get(url, params=search_params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        activity.heartbeat("parsing comp results")

        # Log top-level keys on first call so we can see the response shape
        if isinstance(data, dict):
            logger.info(
                "search/bycoordinates response keys: %s",
                list(data.keys())[:20],
            )

        # --- Extract property list from response ---
        properties: list[dict] = []
        if isinstance(data, list):
            properties = data
        elif isinstance(data, dict):
            # Try known response wrapper keys
            for key in ("results", "properties", "searchResults", "props", "data", "listings"):
                candidate = data.get(key)
                if isinstance(candidate, list) and candidate:
                    properties = candidate
                    break
            # Maybe nested one more level: data -> searchResults -> listResults -> ...
            if not properties:
                sr = data.get("searchResults", data.get("cat1", {}))
                if isinstance(sr, dict):
                    lr = sr.get("listResults") or sr.get("searchResults")
                    if isinstance(lr, list):
                        properties = lr
            # Single property detail wrapped
            if not properties and data.get("propertyDetails"):
                properties = [data]

        logger.info(
            "Raw result count from search/bycoordinates: %d (status=%s)",
            len(properties), status,
        )

        # If we got results, log the keys of the first one for debugging
        if properties:
            first = properties[0]
            if isinstance(first, dict):
                logger.info(
                    "First search result keys: %s",
                    list(first.keys())[:25],
                )

        # --- Unwrap nested property data ---
        # The search/bycoordinates endpoint returns items like:
        #   {"property": {actual data...}, "resultType": "..."}
        # We need to unwrap that nesting before parsing.
        unwrapped = []
        for item in properties:
            if isinstance(item, dict) and "property" in item and isinstance(item["property"], dict):
                inner = item["property"]
                # Log keys of the first unwrapped property for debugging
                if not unwrapped:
                    logger.info(
                        "Unwrapped property keys: %s",
                        list(inner.keys())[:30],
                    )
                unwrapped.append(inner)
            else:
                unwrapped.append(item)

        # --- Parse and filter ---
        comps = []
        for prop in unwrapped:
            parsed = _parse_search_result(prop, lat, lng)
            if parsed:
                # Filter by radius (API may return wider results)
                if parsed["distance_miles"] > radius:
                    continue
                # Filter beds +/- 1
                if beds and parsed.get("beds") and abs(parsed["beds"] - beds) > 1:
                    continue
                # Filter baths +/- 1
                if baths and parsed.get("baths") and abs(parsed["baths"] - baths) > 1:
                    continue
                # Filter sqft +/- 30%
                if sqft and parsed.get("sqft") and (
                    parsed["sqft"] < sqft * 0.7 or parsed["sqft"] > sqft * 1.3
                ):
                    continue
                comps.append(parsed)

        # Limit results
        comps = comps[:limit]

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
