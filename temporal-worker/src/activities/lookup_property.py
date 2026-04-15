"""
Property lookup activity: fetches property data from the Realty API (Zillow)
and creates/updates a properties record in the database.
"""

import uuid
from datetime import datetime, timezone

import httpx
import psycopg2
from temporalio import activity

from src.config import DATABASE_URL, REALTY_API_HOST, REALTY_API_KEY, logger


def _extract_features(reso: dict) -> dict:
    """Extract features into a single JSONB blob from resoFacts."""
    features = {}

    # Boolean features
    bool_map = {
        "pool": "hasPrivatePool",
        "garage": "hasGarage",
        "fireplace": "hasFireplace",
        "spa": "hasSpa",
        "cooling": "hasCooling",
        "heating": "hasHeating",
        "view": "hasView",
        "waterfront": "hasWaterfrontView",
        "homeWarranty": "hasHomeWarranty",
        "seniorCommunity": "isSeniorCommunity",
    }
    for key, field in bool_map.items():
        val = reso.get(field)
        if val is not None:
            features[key] = val

    # Array/string features
    array_fields = [
        "heating",
        "cooling",
        "appliances",
        "flooring",
        "laundryFeatures",
        "interiorFeatures",
        "exteriorFeatures",
        "buildingFeatures",
        "communityFeatures",
        "securityFeatures",
        "fireplaceFeatures",
        "poolFeatures",
        "spaFeatures",
        "patioAndPorchFeatures",
        "doorFeatures",
        "windowFeatures",
        "fencing",
        "associationAmenities",
    ]
    for field in array_fields:
        val = reso.get(field)
        if val:
            features[field] = val

    # Green features
    green_fields = [
        "greenBuildingVerificationType",
        "greenEnergyEfficient",
        "greenEnergyGeneration",
        "greenIndoorAirQuality",
        "greenSustainability",
        "greenWaterConservation",
    ]
    green = {}
    for field in green_fields:
        val = reso.get(field)
        if val:
            green[field] = val
    if green:
        features["greenFeatures"] = green

    return features


def _extract_property_data(api_response: dict) -> dict:
    """Extract property fields from a Realty API / Zillow response."""
    details = api_response.get("propertyDetails", api_response)
    reso = details.get("resoFacts", {})

    # Parse sqft from formatted string like "2,112 sqft"
    def parse_area(val):
        if isinstance(val, (int, float)):
            return int(val)
        if isinstance(val, str):
            cleaned = val.replace(",", "").split()[0]
            try:
                return int(float(cleaned))
            except (ValueError, IndexError):
                return None
        return None

    sqft = parse_area(reso.get("livingArea")) or parse_area(details.get("livingArea"))
    lot_sqft = parse_area(reso.get("lotSize")) or parse_area(details.get("lotAreaValue"))

    # Photos
    photos = []
    for p in details.get("originalPhotos", []) or []:
        if p.get("url"):
            photos.append({"url": p["url"], "caption": p.get("caption", ""), "source": "zillow"})

    # Schools
    schools = details.get("schools", [])

    # Price/tax history
    price_history = details.get("priceHistory", [])
    tax_history = details.get("taxHistory", [])

    # Parking features
    parking_features = reso.get("parkingFeatures")
    parking_capacity = reso.get("parkingCapacity")
    garage_capacity = reso.get("garageParkingCapacity")

    # Rooms
    rooms = reso.get("rooms", [])

    # Features blob
    features = _extract_features(reso)

    # Lot size in acres
    lot_size_acres = None
    lot_size_str = details.get("lotSize", "")
    if isinstance(lot_size_str, str) and "acre" in lot_size_str.lower():
        try:
            lot_size_acres = float(lot_size_str.split()[0].replace(",", ""))
        except (ValueError, IndexError):
            pass
    elif lot_sqft:
        lot_size_acres = round(lot_sqft / 43560, 4)

    # Build trimmed zillow_data blob (exclude large nested objects we already extracted)
    zillow_data = {}
    keep_keys = [
        "zestimate", "rentZestimate", "daysOnZillow", "timeOnZillow",
        "homeStatus", "pageViewCount", "favoriteCount",
        "mortgageZHLRates", "affordabilityEstimate",
        "description", "hdpUrl", "postingUrl",
        "neighborhoodRegion", "neighborhoodId",
    ]
    for key in keep_keys:
        val = details.get(key)
        if val is not None:
            zillow_data[key] = val

    return {
        "address": details.get("streetAddress", ""),
        "city": details.get("city", ""),
        "state": details.get("state", ""),
        "zip": details.get("zipcode", ""),
        "county": details.get("county"),
        "lat": details.get("latitude"),
        "lng": details.get("longitude"),
        "beds": reso.get("bedrooms") or details.get("bedrooms"),
        "baths": reso.get("bathrooms") or details.get("bathrooms"),
        "baths_full": reso.get("bathroomsFull"),
        "baths_half": reso.get("bathroomsHalf"),
        "sqft": sqft,
        "lot_sqft": lot_sqft,
        "lot_size_acres": lot_size_acres,
        "year_built": details.get("yearBuilt"),
        "property_type": reso.get("homeType") or details.get("homeType"),
        "stories": reso.get("stories"),
        "architectural_style": reso.get("architecturalStyle"),
        "construction_materials": reso.get("constructionMaterials"),
        "roof": reso.get("roofType"),
        "foundation": reso.get("foundationDetails") or None,
        "basement": reso.get("basement"),
        "attic": reso.get("attic"),
        "features": features or None,
        "parking_spaces": parking_capacity,
        "garage_spaces": garage_capacity,
        "parking_features": parking_features,
        "lot_features": reso.get("lotFeatures"),
        "rooms_count": len(rooms) if rooms else None,
        "rooms": rooms or None,
        "tax_assessed_value": None,  # from taxHistory if available
        "tax_annual_amount": None,
        "tax_year": None,
        "parcel_number": reso.get("parcelNumber"),
        "hoa_fee": reso.get("hoaFee") or details.get("monthlyHoaFee"),
        "hoa_fee_frequency": "monthly" if (reso.get("hoaFee") or details.get("monthlyHoaFee")) else None,
        "sewer": reso.get("sewer"),
        "water_source": reso.get("waterSource"),
        "electric": reso.get("electric"),
        "gas": reso.get("gas"),
        "nearby_schools": schools or None,
        "elementary_school": reso.get("elementarySchool"),
        "elementary_school_district": reso.get("elementarySchoolDistrict"),
        "middle_school": reso.get("middleOrJuniorSchool"),
        "middle_school_district": reso.get("middleOrJuniorSchoolDistrict"),
        "high_school": reso.get("highSchool"),
        "high_school_district": reso.get("highSchoolDistrict"),
        "neighborhood": details.get("neighborhoodRegion", {}).get("name") if details.get("neighborhoodRegion") else None,
        "photos": photos or [],
        "last_sold_price": details.get("lastSoldPrice"),
        "zestimate": details.get("zestimate"),
        "rent_zestimate": details.get("rentZestimate"),
        "price_history": price_history or None,
        "tax_history": tax_history or None,
        "zillow_id": details.get("zpid"),
        "zillow_data": zillow_data or None,
        "zillow_url": api_response.get("zillowURL"),
    }


def _fill_tax_from_history(data: dict) -> None:
    """Fill tax_assessed_value/tax_annual_amount from most recent taxHistory entry."""
    history = data.get("tax_history") or []
    for entry in history:
        year = entry.get("year")
        amount = entry.get("taxAmount")
        value = entry.get("value")
        if year and (amount is not None or value is not None):
            data["tax_year"] = year
            data["tax_annual_amount"] = amount
            data["tax_assessed_value"] = value
            break


def _upsert_property(data: dict) -> str:
    """Insert or update a property record, returning the property ID."""
    import json

    conn = psycopg2.connect(DATABASE_URL)
    try:
        cur = conn.cursor()

        # Check if property already exists by zillow_id or address
        property_id = None
        if data.get("zillow_id"):
            cur.execute("SELECT id FROM properties WHERE zillow_id = %s", (data["zillow_id"],))
            row = cur.fetchone()
            if row:
                property_id = row[0]

        if not property_id and data["address"] and data["city"] and data["state"] and data["zip"]:
            cur.execute(
                "SELECT id FROM properties WHERE address = %s AND city = %s AND state = %s AND zip = %s",
                (data["address"], data["city"], data["state"], data["zip"]),
            )
            row = cur.fetchone()
            if row:
                property_id = row[0]

        now = datetime.now(timezone.utc)

        def to_json(val):
            return json.dumps(val) if val is not None else None

        if property_id:
            # Update existing
            cur.execute(
                """UPDATE properties SET
                    county = COALESCE(%s, county),
                    lat = COALESCE(%s, lat), lng = COALESCE(%s, lng),
                    beds = COALESCE(%s, beds), baths = COALESCE(%s, baths),
                    baths_full = COALESCE(%s, baths_full), baths_half = COALESCE(%s, baths_half),
                    sqft = COALESCE(%s, sqft), lot_sqft = COALESCE(%s, lot_sqft),
                    lot_size_acres = COALESCE(%s, lot_size_acres),
                    year_built = COALESCE(%s, year_built),
                    property_type = COALESCE(%s, property_type),
                    stories = COALESCE(%s, stories),
                    architectural_style = COALESCE(%s, architectural_style),
                    construction_materials = COALESCE(%s::jsonb, construction_materials),
                    roof = COALESCE(%s, roof),
                    foundation = COALESCE(%s::jsonb, foundation),
                    basement = COALESCE(%s, basement),
                    attic = COALESCE(%s, attic),
                    features = COALESCE(%s::jsonb, features),
                    parking_spaces = COALESCE(%s, parking_spaces),
                    garage_spaces = COALESCE(%s, garage_spaces),
                    parking_features = COALESCE(%s::jsonb, parking_features),
                    lot_features = COALESCE(%s::jsonb, lot_features),
                    rooms_count = COALESCE(%s, rooms_count),
                    rooms = COALESCE(%s::jsonb, rooms),
                    tax_assessed_value = COALESCE(%s, tax_assessed_value),
                    tax_annual_amount = COALESCE(%s, tax_annual_amount),
                    tax_year = COALESCE(%s, tax_year),
                    parcel_number = COALESCE(%s, parcel_number),
                    hoa_fee = COALESCE(%s, hoa_fee),
                    hoa_fee_frequency = COALESCE(%s, hoa_fee_frequency),
                    sewer = COALESCE(%s, sewer),
                    water_source = COALESCE(%s, water_source),
                    electric = COALESCE(%s, electric),
                    gas = COALESCE(%s, gas),
                    nearby_schools = COALESCE(%s::jsonb, nearby_schools),
                    elementary_school = COALESCE(%s, elementary_school),
                    elementary_school_district = COALESCE(%s, elementary_school_district),
                    middle_school = COALESCE(%s, middle_school),
                    middle_school_district = COALESCE(%s, middle_school_district),
                    high_school = COALESCE(%s, high_school),
                    high_school_district = COALESCE(%s, high_school_district),
                    neighborhood = COALESCE(%s, neighborhood),
                    photos = COALESCE(%s::jsonb, photos),
                    last_sold_price = COALESCE(%s, last_sold_price),
                    zestimate = COALESCE(%s, zestimate),
                    rent_zestimate = COALESCE(%s, rent_zestimate),
                    price_history = COALESCE(%s::jsonb, price_history),
                    tax_history = COALESCE(%s::jsonb, tax_history),
                    zillow_id = COALESCE(%s, zillow_id),
                    zillow_data = COALESCE(%s::jsonb, zillow_data),
                    zillow_url = COALESCE(%s, zillow_url),
                    last_synced = %s,
                    updated_at = %s
                WHERE id = %s""",
                (
                    data["county"], data["lat"], data["lng"],
                    data["beds"], data["baths"],
                    data["baths_full"], data["baths_half"],
                    data["sqft"], data["lot_sqft"],
                    data["lot_size_acres"],
                    data["year_built"], data["property_type"],
                    data["stories"], data["architectural_style"],
                    to_json(data["construction_materials"]),
                    data["roof"], to_json(data["foundation"]),
                    data["basement"], data["attic"],
                    to_json(data["features"]),
                    data["parking_spaces"], data["garage_spaces"],
                    to_json(data["parking_features"]),
                    to_json(data["lot_features"]),
                    data["rooms_count"], to_json(data["rooms"]),
                    data["tax_assessed_value"], data["tax_annual_amount"],
                    data["tax_year"], data["parcel_number"],
                    data["hoa_fee"], data["hoa_fee_frequency"],
                    data["sewer"], data["water_source"],
                    data["electric"], data["gas"],
                    to_json(data["nearby_schools"]),
                    data["elementary_school"], data["elementary_school_district"],
                    data["middle_school"], data["middle_school_district"],
                    data["high_school"], data["high_school_district"],
                    data["neighborhood"],
                    to_json(data["photos"]),
                    data["last_sold_price"], data["zestimate"],
                    data["rent_zestimate"],
                    to_json(data["price_history"]),
                    to_json(data["tax_history"]),
                    data["zillow_id"],
                    to_json(data["zillow_data"]),
                    data["zillow_url"],
                    now, now, property_id,
                ),
            )
        else:
            # Insert new
            property_id = f"prop_{uuid.uuid4().hex[:12]}"
            cur.execute(
                """INSERT INTO properties (
                    id, address, city, state, zip, county, lat, lng,
                    beds, baths, baths_full, baths_half,
                    sqft, lot_sqft, lot_size_acres,
                    year_built, property_type, stories, architectural_style,
                    construction_materials, roof, foundation, basement, attic,
                    features, parking_spaces, garage_spaces, parking_features,
                    lot_features, rooms_count, rooms,
                    tax_assessed_value, tax_annual_amount, tax_year, parcel_number,
                    hoa_fee, hoa_fee_frequency,
                    sewer, water_source, electric, gas,
                    nearby_schools, elementary_school, elementary_school_district,
                    middle_school, middle_school_district,
                    high_school, high_school_district,
                    neighborhood, photos,
                    last_sold_price, zestimate, rent_zestimate,
                    price_history, tax_history,
                    zillow_id, zillow_data, zillow_url,
                    last_synced, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s,
                    %s::jsonb, %s, %s::jsonb, %s, %s,
                    %s::jsonb, %s, %s, %s::jsonb,
                    %s::jsonb, %s, %s::jsonb,
                    %s, %s, %s, %s,
                    %s, %s,
                    %s, %s, %s, %s,
                    %s::jsonb, %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s::jsonb,
                    %s, %s, %s,
                    %s::jsonb, %s::jsonb,
                    %s, %s::jsonb, %s,
                    %s, %s, %s
                )""",
                (
                    property_id, data["address"], data["city"], data["state"],
                    data["zip"], data["county"], data["lat"], data["lng"],
                    data["beds"], data["baths"], data["baths_full"], data["baths_half"],
                    data["sqft"], data["lot_sqft"], data["lot_size_acres"],
                    data["year_built"], data["property_type"], data["stories"],
                    data["architectural_style"],
                    to_json(data["construction_materials"]),
                    data["roof"], to_json(data["foundation"]),
                    data["basement"], data["attic"],
                    to_json(data["features"]),
                    data["parking_spaces"], data["garage_spaces"],
                    to_json(data["parking_features"]),
                    to_json(data["lot_features"]),
                    data["rooms_count"], to_json(data["rooms"]),
                    data["tax_assessed_value"], data["tax_annual_amount"],
                    data["tax_year"], data["parcel_number"],
                    data["hoa_fee"], data["hoa_fee_frequency"],
                    data["sewer"], data["water_source"],
                    data["electric"], data["gas"],
                    to_json(data["nearby_schools"]),
                    data["elementary_school"], data["elementary_school_district"],
                    data["middle_school"], data["middle_school_district"],
                    data["high_school"], data["high_school_district"],
                    data["neighborhood"], to_json(data["photos"]),
                    data["last_sold_price"], data["zestimate"],
                    data["rent_zestimate"],
                    to_json(data["price_history"]),
                    to_json(data["tax_history"]),
                    data["zillow_id"],
                    to_json(data["zillow_data"]),
                    data["zillow_url"],
                    now, now, now,
                ),
            )

        conn.commit()
        return property_id
    finally:
        conn.close()


@activity.defn
async def lookup_property(address: str) -> dict:
    """
    Look up a property by address using the Realty API.
    Creates or updates a properties record and returns the property_id
    along with key property data.
    """
    logger.info(f"Looking up property: {address}")

    if not REALTY_API_KEY:
        raise ValueError("REALTY_API_KEY is not configured")

    # Call Realty API to search for the property
    headers = {
        "x-rapidapi-key": REALTY_API_KEY,
        "x-rapidapi-host": REALTY_API_HOST,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        # First, search for the property by address
        search_resp = await client.get(
            f"https://{REALTY_API_HOST}/properties/v3/get-zillow-web-search-results",
            headers=headers,
            params={"q": address, "page": "1"},
        )
        search_resp.raise_for_status()
        search_data = search_resp.json()

        # Extract zpid from search results
        results = search_data.get("data", {}).get("results", [])
        if not results:
            raise ValueError(f"No property found for address: {address}")

        zpid = results[0].get("zpid")
        if not zpid:
            raise ValueError(f"No Zillow ID found for address: {address}")

        # Get detailed property info
        detail_resp = await client.get(
            f"https://{REALTY_API_HOST}/properties/v3/get-detail-by-zpid",
            headers=headers,
            params={"zpid": str(zpid)},
        )
        detail_resp.raise_for_status()
        api_response = detail_resp.json()

    # Extract and structure the property data
    data = _extract_property_data(api_response)
    _fill_tax_from_history(data)

    # Upsert into database
    property_id = _upsert_property(data)

    logger.info(f"Property upserted: {property_id} ({data['address']}, {data['city']})")

    return {
        "property_id": property_id,
        "address": data["address"],
        "city": data["city"],
        "state": data["state"],
        "zip": data["zip"],
        "beds": data["beds"],
        "baths": data["baths"],
        "sqft": data["sqft"],
        "year_built": data["year_built"],
        "property_type": data["property_type"],
        "zestimate": data["zestimate"],
        "zillow_id": data["zillow_id"],
    }
