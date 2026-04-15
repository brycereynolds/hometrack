#!/usr/bin/env python3
"""
Fetch real property data from the Realty API for seed addresses,
then generate TypeScript seed data for the properties table.

Usage:
  python3 scripts/fetch_seed_properties.py

Reads REALTY_API_KEY from temporal-worker/.env or environment.
Caches responses in scripts/seed_property_data/ to avoid re-fetching.
"""

import json
import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "scripts" / "seed_property_data"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# ── Seed addresses (mockId → address) ──────────────────────────────────
ADDRESSES = [
    ("l-1", "123 Main Street, Los Gatos, CA"),
    ("l-2", "456 Oak Avenue, Palo Alto, CA"),
    ("l-3", "789 Elm Street, Cupertino, CA"),
    ("l-4", "2200 Willow Glen Way, San Jose, CA"),
    ("l-5", "1580 University Avenue, Mountain View, CA"),
    ("l-6", "945 Cherry Blossom Lane, Saratoga, CA"),
    ("l-7", "310 Waverly Street, Menlo Park, CA"),
    ("l-8", "88 Sunnyvale Avenue, Sunnyvale, CA"),
    ("l-9", "809 Midvale Lane, San Jose, CA"),
]

API_URL = "https://zillow.realtyapi.io/pro/byaddress"
DELAY_SECONDS = 0.3  # Rate limiting


def load_api_key() -> str:
    """Load API key from env or temporal-worker/.env."""
    key = os.environ.get("REALTY_API_KEY")
    if key:
        return key

    env_path = ROOT / "temporal-worker" / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line.startswith("REALTY_API_KEY="):
                return line.split("=", 1)[1].strip()

    print("ERROR: REALTY_API_KEY not found in environment or temporal-worker/.env")
    sys.exit(1)


def cache_path(mock_id: str) -> Path:
    return CACHE_DIR / f"{mock_id}.json"


def fetch_property(address: str, api_key: str) -> dict | None:
    """Fetch property data from Realty API."""
    headers = {"x-realtyapi-key": api_key}
    params = {"propertyaddress": address}
    try:
        resp = requests.get(API_URL, headers=headers, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        if data.get("message", "").startswith("200"):
            return data
        print(f"    API returned non-200 message: {data.get('message', 'unknown')}")
        return data  # Return anyway so we can inspect
    except requests.RequestException as e:
        print(f"    Request failed: {e}")
        return None


def fetch_all(api_key: str):
    """Fetch all seed properties, using cache where available."""
    results = {}
    for mock_id, address in ADDRESSES:
        cp = cache_path(mock_id)
        if cp.exists():
            print(f"  [{mock_id}] Cached: {address}")
            results[mock_id] = json.loads(cp.read_text())
            continue

        print(f"  [{mock_id}] Fetching: {address}")
        data = fetch_property(address, api_key)
        if data:
            cp.write_text(json.dumps(data, indent=2))
            results[mock_id] = data
            print(f"    -> Saved to {cp.name}")
        else:
            print(f"    -> FAILED, no data saved")

        time.sleep(DELAY_SECONDS)

    return results


# ── Data extraction helpers ─────────────────────────────────────────────

def safe_get(d: dict, *keys, default=None):
    """Nested dict access."""
    for k in keys:
        if isinstance(d, dict):
            d = d.get(k)
        else:
            return default
    return d if d is not None else default


def extract_property(mock_id: str, data: dict) -> dict:
    """Extract property fields from a Realty API response."""
    pd = data.get("propertyDetails", {})
    rf = pd.get("resoFacts", {})

    # Address
    addr = pd.get("address", {})
    street = addr.get("streetAddress", pd.get("streetAddress", ""))
    city = addr.get("city", pd.get("city", ""))
    state = addr.get("state", pd.get("state", ""))
    zipcode = addr.get("zipcode", pd.get("zipcode", ""))
    county = (pd.get("county") or "").replace(" County", "")

    # Core
    beds = pd.get("bedrooms")
    baths = pd.get("bathrooms")
    baths_full = rf.get("bathroomsFull")
    baths_half = rf.get("bathroomsHalf")
    sqft = pd.get("livingArea") or pd.get("livingAreaValue")
    lot_sqft = pd.get("lotAreaValue") or pd.get("lotSize")
    if isinstance(lot_sqft, str):
        lot_sqft = int(lot_sqft.replace(",", "").replace(" sqft", ""))
    lot_acres = round(lot_sqft / 43560, 2) if lot_sqft else None
    year_built = pd.get("yearBuilt") or rf.get("yearBuilt")

    home_type = pd.get("homeType", "SINGLE_FAMILY")
    property_type_map = {
        "SINGLE_FAMILY": "SINGLE_FAMILY",
        "SingleFamily": "SINGLE_FAMILY",
        "CONDO": "CONDO",
        "TOWNHOUSE": "TOWNHOME",
        "MULTI_FAMILY": "MULTI_FAMILY",
    }
    property_type = property_type_map.get(home_type, home_type)

    stories = rf.get("stories") or rf.get("storiesTotal")
    arch_style = rf.get("architecturalStyle") or safe_get(rf, "structureType")

    # Construction
    construction = rf.get("constructionMaterials") or []
    roof = rf.get("roofType")
    foundation = rf.get("foundationDetails") or []
    basement = rf.get("basement")

    # Features JSONB
    has_fireplace = rf.get("hasFireplace", False)
    has_spa = rf.get("hasSpa", False)
    has_pool = rf.get("hasPrivatePool") or bool(rf.get("poolFeatures"))
    has_garage = rf.get("hasGarage", False)

    features = {
        "pool": bool(has_pool),
        "garage": bool(has_garage),
        "fireplace": bool(has_fireplace),
        "spa": bool(has_spa),
    }

    heating = rf.get("heating") or []
    if heating:
        features["heating"] = heating
    cooling = rf.get("cooling") or []
    if cooling:
        features["cooling"] = cooling
    appliances = rf.get("appliances") or []
    if appliances:
        features["appliances"] = appliances
    flooring = rf.get("flooring") or []
    if flooring:
        features["flooring"] = flooring
    laundry = rf.get("laundryFeatures") or []
    if laundry:
        features["laundry"] = laundry
    interior = rf.get("interiorFeatures")
    if interior:
        features["interiorFeatures"] = interior if isinstance(interior, list) else [interior]
    exterior = rf.get("exteriorFeatures") or []
    if exterior:
        features["exteriorFeatures"] = exterior
    building_features = rf.get("buildingFeatures") or []
    if building_features:
        features["buildingFeatures"] = building_features
    community = rf.get("communityFeatures") or []
    if community:
        features["communityFeatures"] = community
    security = rf.get("securityFeatures")
    if security:
        features["securityFeatures"] = security if isinstance(security, list) else [security]
    fencing = rf.get("fencing")
    if fencing:
        features["fencing"] = fencing
    view = rf.get("view") or []
    if view:
        features["view"] = view if isinstance(view, list) else [view]
    features["waterfront"] = bool(rf.get("hasWaterfrontView", False))
    patio = rf.get("patioAndPorchFeatures") or []
    if patio:
        features["patioAndPorch"] = patio
    door_features = rf.get("doorFeatures")
    if door_features:
        features["doorFeatures"] = door_features if isinstance(door_features, list) else [door_features]
    window_features = rf.get("windowFeatures")
    if window_features:
        features["windowFeatures"] = window_features if isinstance(window_features, list) else [window_features]
    green_energy = rf.get("greenEnergyEfficient") or rf.get("greenEnergyGeneration")
    if green_energy:
        features["greenFeatures"] = {"energyEfficient": green_energy}

    # Parking
    parking_spaces = rf.get("parkingCapacity", 0)
    garage_spaces = rf.get("garageParkingCapacity")
    parking_features = rf.get("parkingFeatures") or []

    # Lot
    lot_features = rf.get("lotFeatures") or []

    # Rooms
    rooms_raw = rf.get("rooms") or []
    rooms = []
    for r in rooms_raw:
        room_type = r.get("roomType")
        if room_type:
            room = {"roomType": room_type}
            if r.get("roomDimensions"):
                room["dimensions"] = r["roomDimensions"]
            if r.get("roomLevel"):
                room["level"] = r["roomLevel"]
            rooms.append(room)

    # Tax
    tax_assessed = rf.get("taxAssessedValue")
    tax_annual = rf.get("taxAnnualAmount")
    parcel_number = rf.get("parcelNumber")

    # HOA
    hoa_fee = pd.get("monthlyHoaFee") or rf.get("hoaFee")
    hoa_freq = "monthly" if hoa_fee else None

    # Utilities
    sewer = rf.get("sewer")
    water = rf.get("waterSource")
    electric = rf.get("electric")
    gas = rf.get("gas")

    # Schools
    schools_raw = pd.get("schools") or []
    nearby_schools = []
    elem_school = rf.get("elementarySchool")
    elem_district = rf.get("elementarySchoolDistrict")
    middle_school = rf.get("middleOrJuniorSchool")
    middle_district = rf.get("middleOrJuniorSchoolDistrict")
    high_school = rf.get("highSchool")
    high_district = rf.get("highSchoolDistrict")

    for s in schools_raw:
        school = {
            "name": s.get("name"),
            "type": s.get("type", "public"),
            "level": s.get("level"),
            "distance": s.get("distance"),
            "rating": s.get("rating"),
            "grades": s.get("grades"),
        }
        if s.get("studentsPerTeacher"):
            school["studentsPerTeacher"] = s["studentsPerTeacher"]
        if s.get("link"):
            school["link"] = s["link"]
        if s.get("assigned") is not None:
            school["isAssigned"] = s["assigned"]
        nearby_schools.append(school)

    # Scores / neighborhood
    neighborhood = safe_get(pd, "parentRegion", "name")

    # Coords
    lat = pd.get("latitude")
    lng = pd.get("longitude")

    # Photos — use original photos if available
    photos_raw = pd.get("originalPhotos") or []
    photos = []
    for p in photos_raw[:10]:  # Limit to 10
        url = p.get("mixedSources", {}).get("jpeg", [{}])
        # Get the largest jpeg
        if url:
            largest = sorted(url, key=lambda x: x.get("width", 0), reverse=True)
            if largest:
                photos.append({"url": largest[0].get("url", ""), "source": "zillow"})

    # Financial
    last_sold_price = pd.get("lastSoldPrice")
    zestimate = pd.get("zestimate")
    rent_zestimate = pd.get("rentZestimate")

    price_history_raw = pd.get("priceHistory") or []
    price_history = []
    for ph in price_history_raw[:10]:
        entry = {
            "date": ph.get("date"),
            "event": ph.get("event"),
            "price": ph.get("price"),
        }
        if ph.get("pricePerSquareFoot"):
            entry["pricePerSqft"] = ph["pricePerSquareFoot"]
        if ph.get("source"):
            entry["source"] = ph["source"]
        price_history.append(entry)

    tax_history_raw = pd.get("taxHistory") or []
    tax_history = []
    for th in tax_history_raw[:5]:
        tax_history.append({
            "year": th.get("time"),  # We'll convert this
            "taxAmount": th.get("taxPaid"),
            "value": th.get("value"),
        })

    # IDs
    zpid = pd.get("zpid")
    zillow_url = f"https://www.zillow.com{pd.get('hdpUrl', '')}" if pd.get("hdpUrl") else None
    description = pd.get("description")

    return {
        "mockId": mock_id,
        "address": street,
        "city": city,
        "state": state,
        "zip": zipcode,
        "county": county,
        "lat": lat,
        "lng": lng,
        "beds": beds,
        "baths": baths,
        "bathsFull": baths_full,
        "bathsHalf": baths_half,
        "sqft": sqft,
        "lotSqft": lot_sqft,
        "lotSizeAcres": lot_acres,
        "yearBuilt": year_built,
        "propertyType": property_type,
        "stories": stories,
        "architecturalStyle": arch_style,
        "constructionMaterials": construction,
        "roof": roof,
        "foundation": foundation,
        "basement": basement,
        "features": features,
        "parkingSpaces": parking_spaces,
        "garageSpaces": garage_spaces,
        "parkingFeatures": parking_features,
        "lotFeatures": lot_features,
        "roomsCount": len(rooms) if rooms else None,
        "rooms": rooms if rooms else None,
        "taxAssessedValue": tax_assessed,
        "taxAnnualAmount": tax_annual,
        "taxYear": 2025,
        "parcelNumber": parcel_number,
        "hoaFee": hoa_fee,
        "hoaFeeFrequency": hoa_freq,
        "sewer": sewer,
        "waterSource": water,
        "electric": electric,
        "gas": gas,
        "nearbySchools": nearby_schools if nearby_schools else None,
        "elementarySchool": elem_school,
        "elementarySchoolDistrict": elem_district,
        "middleSchool": middle_school,
        "middleSchoolDistrict": middle_district,
        "highSchool": high_school,
        "highSchoolDistrict": high_district,
        "neighborhood": neighborhood,
        "photos": photos if photos else None,
        "lastSoldPrice": last_sold_price,
        "zillowId": zpid,
        "zillowUrl": zillow_url,
        "zestimate": zestimate,
        "rentZestimate": rent_zestimate,
        "priceHistory": price_history if price_history else None,
        "taxHistory": tax_history if tax_history else None,
        "description": description,
    }


# ── TypeScript generation ────────────────────────────────────────────────

def ts_value(v, indent=8) -> str:
    """Convert a Python value to TypeScript literal string."""
    if v is None:
        return "undefined"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        # Escape single quotes and backslashes
        escaped = v.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")
        return f"'{escaped}'"
    if isinstance(v, list):
        if not v:
            return "[]"
        if all(isinstance(x, str) for x in v):
            items = ", ".join(f"'{x}'" for x in v)
            return f"[{items}]"
        # Complex array
        pad = " " * indent
        items = []
        for item in v:
            items.append(f"{pad}  {ts_value(item, indent + 2)},")
        return "[\n" + "\n".join(items) + f"\n{pad}]"
    if isinstance(v, dict):
        pad = " " * indent
        items = []
        for k, val in v.items():
            key_str = k if k.isidentifier() else f"'{k}'"
            items.append(f"{pad}  {key_str}: {ts_value(val, indent + 2)},")
        return "{\n" + "\n".join(items) + f"\n{pad}}}"
    return str(v)


def generate_ts_property(prop: dict, indent: int = 6) -> str:
    """Generate a single property object for TypeScript."""
    pad = " " * indent
    lines = [f"{pad}{{"]

    # Group fields logically
    field_groups = [
        # Identity
        [("mockId", prop["mockId"])],
        # Address
        [
            ("address", prop["address"]),
            ("city", prop["city"]),
            ("state", prop["state"]),
            ("zip", prop["zip"]),
            ("county", prop.get("county")),
        ],
        # Coords
        [("lat", prop.get("lat")), ("lng", prop.get("lng"))],
        # Core structural
        [
            ("beds", prop.get("beds")),
            ("baths", prop.get("baths")),
            ("bathsFull", prop.get("bathsFull")),
            ("bathsHalf", prop.get("bathsHalf")),
            ("sqft", prop.get("sqft")),
            ("lotSqft", prop.get("lotSqft")),
            ("lotSizeAcres", prop.get("lotSizeAcres")),
            ("yearBuilt", prop.get("yearBuilt")),
        ],
        # Type
        [
            ("propertyType", prop.get("propertyType")),
            ("stories", prop.get("stories")),
            ("architecturalStyle", prop.get("architecturalStyle")),
        ],
        # Construction
        [
            ("constructionMaterials", prop.get("constructionMaterials")),
            ("roof", prop.get("roof")),
            ("foundation", prop.get("foundation")),
            ("basement", prop.get("basement")),
        ],
    ]

    for group in field_groups:
        group_lines = []
        for key, val in group:
            if val is not None:
                group_lines.append(f"{key}: {ts_value(val, indent + 2)}")
        if group_lines:
            if len(group_lines) <= 3 and all(len(l) < 40 for l in group_lines):
                lines.append(f"{pad}  {', '.join(group_lines)},")
            else:
                for gl in group_lines:
                    lines.append(f"{pad}  {gl},")

    # Features (always multi-line)
    features = prop.get("features")
    if features:
        lines.append(f"{pad}  features: {ts_value(features, indent + 2)},")

    # Parking
    parking_fields = []
    if prop.get("parkingSpaces") is not None:
        parking_fields.append(f"parkingSpaces: {prop['parkingSpaces']}")
    if prop.get("garageSpaces") is not None:
        parking_fields.append(f"garageSpaces: {prop['garageSpaces']}")
    if prop.get("parkingFeatures"):
        parking_fields.append(f"parkingFeatures: {ts_value(prop['parkingFeatures'], indent + 2)}")
    if parking_fields:
        lines.append(f"{pad}  {', '.join(parking_fields)},")

    # Lot features
    if prop.get("lotFeatures"):
        lines.append(f"{pad}  lotFeatures: {ts_value(prop['lotFeatures'], indent + 2)},")

    # Rooms
    if prop.get("roomsCount"):
        lines.append(f"{pad}  roomsCount: {prop['roomsCount']},")
    if prop.get("rooms"):
        lines.append(f"{pad}  rooms: {ts_value(prop['rooms'], indent + 2)},")

    # Tax
    tax_fields = []
    if prop.get("taxAssessedValue"):
        tax_fields.append(f"taxAssessedValue: {prop['taxAssessedValue']}")
    if prop.get("taxAnnualAmount"):
        tax_fields.append(f"taxAnnualAmount: {prop['taxAnnualAmount']}")
    tax_fields.append(f"taxYear: {prop.get('taxYear', 2025)}")
    if prop.get("parcelNumber"):
        tax_fields.append(f"parcelNumber: '{prop['parcelNumber']}'")
    if tax_fields:
        lines.append(f"{pad}  {', '.join(tax_fields)},")

    # HOA
    if prop.get("hoaFee"):
        lines.append(f"{pad}  hoaFee: {prop['hoaFee']}, hoaFeeFrequency: '{prop.get('hoaFeeFrequency', 'monthly')}',")

    # Utilities
    util_fields = []
    for k in ["sewer", "waterSource", "electric", "gas"]:
        if prop.get(k):
            util_fields.append(f"{k}: '{prop[k]}'")
    if util_fields:
        lines.append(f"{pad}  {', '.join(util_fields)},")

    # Schools
    if prop.get("elementarySchool"):
        lines.append(f"{pad}  elementarySchool: '{prop['elementarySchool']}', elementarySchoolDistrict: '{prop.get('elementarySchoolDistrict', '')}',")
    if prop.get("middleSchool"):
        lines.append(f"{pad}  middleSchool: '{prop['middleSchool']}', middleSchoolDistrict: '{prop.get('middleSchoolDistrict', '')}',")
    if prop.get("highSchool"):
        lines.append(f"{pad}  highSchool: '{prop['highSchool']}', highSchoolDistrict: '{prop.get('highSchoolDistrict', '')}',")

    if prop.get("nearbySchools"):
        lines.append(f"{pad}  nearbySchools: {ts_value(prop['nearbySchools'], indent + 2)},")

    # Neighborhood
    if prop.get("neighborhood"):
        lines.append(f"{pad}  neighborhood: '{prop['neighborhood']}',")

    # Photos
    if prop.get("photos"):
        lines.append(f"{pad}  photos: {ts_value(prop['photos'], indent + 2)},")

    # Financial
    if prop.get("lastSoldPrice"):
        lines.append(f"{pad}  lastSoldPrice: {prop['lastSoldPrice']},")
    if prop.get("zillowId"):
        lines.append(f"{pad}  zillowId: {prop['zillowId']},")
    if prop.get("zillowUrl"):
        lines.append(f"{pad}  zillowUrl: '{prop['zillowUrl']}',")
    if prop.get("zestimate"):
        lines.append(f"{pad}  zestimate: {prop['zestimate']},")
    if prop.get("rentZestimate"):
        lines.append(f"{pad}  rentZestimate: {prop['rentZestimate']},")

    if prop.get("priceHistory"):
        lines.append(f"{pad}  priceHistory: {ts_value(prop['priceHistory'], indent + 2)},")
    if prop.get("taxHistory"):
        lines.append(f"{pad}  taxHistory: {ts_value(prop['taxHistory'], indent + 2)},")

    lines.append(f"{pad}}},")
    return "\n".join(lines)


def generate_ts_output(properties: list[dict]) -> str:
    """Generate the full TypeScript propertyData array."""
    chunks = []
    for prop in properties:
        chunks.append(generate_ts_property(prop))

    return (
        "  const propertyData = [\n"
        + "\n".join(chunks)
        + "\n  ];\n"
    )


# ── Mapping from fictional listing IDs to best real API data source ──
# Some seed addresses are fictional. Map each to the best available cache file.
# The real API data provides realistic features, tax, schools, construction
# details. We keep our fictional listing addresses but use real data for details.
BEST_DATA_SOURCE = {
    "l-1": "l-1",          # 123 E Main St, Los Gatos (partial — commercial)
    "l-2": "l-2-alt",      # 636 Middlefield Rd, Palo Alto
    "l-3": "l-3-alt",      # 10066 Judy Ave, Cupertino
    "l-4": "l-4-alt2",     # 1190 Bird Ave, San Jose (Willow Glen area)
    "l-5": None,            # No Mountain View data — use defaults
    "l-6": None,            # No Saratoga data — use defaults
    "l-7": "l-7",          # 310 Waverly Ln, Los Altos (close to Menlo Park)
    "l-8": "l-8",          # 1180 Lochinvar Ave #88, Sunnyvale
    "l-9": "l-9",          # 809 Midvale Ln, San Jose (exact match)
}

# Our seed listing details (address, city, beds, etc.) that override the API data
LISTING_OVERRIDES = {
    "l-1": {"address": "123 Main Street", "city": "Los Gatos", "state": "CA", "zip": "95030",
            "lat": 37.2358, "lng": -121.9624, "beds": 4, "baths": 3, "sqft": 2850, "lotSqft": 8500, "yearBuilt": 1965,
            "propertyType": "SINGLE_FAMILY"},
    "l-2": {"address": "456 Oak Avenue", "city": "Palo Alto", "state": "CA", "zip": "94301",
            "lat": 37.4419, "lng": -122.1430, "beds": 5, "baths": 4, "sqft": 3600, "lotSqft": 12000, "yearBuilt": 1952,
            "propertyType": "SINGLE_FAMILY"},
    "l-3": {"address": "789 Elm Street", "city": "Cupertino", "state": "CA", "zip": "95014",
            "lat": 37.3230, "lng": -122.0322, "beds": 3, "baths": 2, "sqft": 1850, "lotSqft": 6200, "yearBuilt": 1978,
            "propertyType": "SINGLE_FAMILY"},
    "l-4": {"address": "2200 Willow Glen Way", "city": "San Jose", "state": "CA", "zip": "95125",
            "lat": 37.2969, "lng": -121.9008, "beds": 3, "baths": 2, "sqft": 1620, "lotSqft": 5800, "yearBuilt": 1940,
            "propertyType": "SINGLE_FAMILY"},
    "l-5": {"address": "1580 University Avenue", "city": "Mountain View", "state": "CA", "zip": "94040",
            "lat": 37.3861, "lng": -122.0839, "beds": 2, "baths": 2, "sqft": 1200, "lotSqft": 4500, "yearBuilt": 1955,
            "propertyType": "TOWNHOME"},
    "l-6": {"address": "945 Cherry Blossom Lane", "city": "Saratoga", "state": "CA", "zip": "95070",
            "lat": 37.2638, "lng": -122.0230, "beds": 5, "baths": 3.5, "sqft": 3200, "lotSqft": 15000, "yearBuilt": 1988,
            "propertyType": "SINGLE_FAMILY"},
    "l-7": {"address": "310 Waverly Street", "city": "Menlo Park", "state": "CA", "zip": "94025",
            "lat": 37.4530, "lng": -122.1817, "beds": 4, "baths": 3, "sqft": 2400, "lotSqft": 7200, "yearBuilt": 1948,
            "propertyType": "SINGLE_FAMILY"},
    "l-8": {"address": "88 Sunnyvale Avenue", "city": "Sunnyvale", "state": "CA", "zip": "94086",
            "lat": 37.3688, "lng": -122.0363, "beds": 2, "baths": 1, "sqft": 980, "lotSqft": 3500, "yearBuilt": 1960,
            "propertyType": "CONDO"},
    "l-9": {"address": "809 Midvale Lane", "city": "San Jose", "state": "CA", "zip": "95120",
            "lat": 37.2510, "lng": -121.8620, "beds": 4, "baths": 3, "sqft": 2200, "lotSqft": 7500, "yearBuilt": 1972,
            "propertyType": "SINGLE_FAMILY"},
}


def merge_with_overrides(mock_id: str, api_prop: dict | None) -> dict:
    """Merge API-sourced property data with our listing overrides."""
    overrides = LISTING_OVERRIDES[mock_id]
    if api_prop is None:
        # No API data — return overrides only
        return {"mockId": mock_id, **overrides}

    # Start with API data, then override address/structural fields
    merged = {**api_prop}
    merged["mockId"] = mock_id
    merged["address"] = overrides["address"]
    merged["city"] = overrides["city"]
    merged["state"] = overrides["state"]
    merged["zip"] = overrides["zip"]
    merged["lat"] = overrides["lat"]
    merged["lng"] = overrides["lng"]
    merged["beds"] = overrides["beds"]
    merged["baths"] = overrides["baths"]
    merged["sqft"] = overrides["sqft"]
    merged["lotSqft"] = overrides["lotSqft"]
    merged["yearBuilt"] = overrides["yearBuilt"]
    merged["propertyType"] = overrides["propertyType"]

    # Recalculate lot acres from our sqft
    merged["lotSizeAcres"] = round(overrides["lotSqft"] / 43560, 2)

    # Don't carry over the real property's Zillow IDs (unless it's l-9 which matches)
    if mock_id != "l-9":
        merged.pop("zillowId", None)
        merged.pop("zillowUrl", None)
        merged.pop("zestimate", None)
        merged.pop("rentZestimate", None)
        merged.pop("priceHistory", None)
        merged.pop("taxHistory", None)
        merged.pop("lastSoldPrice", None)
        merged.pop("description", None)

    return merged


def main():
    api_key = load_api_key()
    print(f"Using API key: {api_key[:8]}...")
    print()

    print("Fetching property data...")
    results = fetch_all(api_key)
    print(f"\nFetched {len(results)} properties")
    print()

    # Also load alternate cache files
    for alt_file in CACHE_DIR.glob("*-alt*.json"):
        alt_id = alt_file.stem
        if alt_id not in results:
            data = json.loads(alt_file.read_text())
            results[alt_id] = data

    # Extract and merge
    properties = []
    for mock_id, _ in ADDRESSES:
        source_id = BEST_DATA_SOURCE.get(mock_id)
        api_prop = None

        if source_id and source_id in results:
            data = results[source_id]
            msg = data.get("message", "")
            pd = data.get("propertyDetails", {})
            # Only use if we got meaningful data (has bedrooms)
            if msg.startswith("200") and pd.get("bedrooms"):
                api_prop = extract_property(mock_id, data)

        merged = merge_with_overrides(mock_id, api_prop)
        properties.append(merged)
        source_label = f"API ({source_id})" if api_prop else "defaults"
        addr = f"{merged['address']}, {merged['city']}"
        print(f"  [{mock_id}] {addr} — {merged.get('beds', '?')}BR/{merged.get('baths', '?')}BA, {merged.get('sqft', '?')} sqft [{source_label}]")

    # Generate TypeScript
    print("\nGenerating TypeScript...")
    ts = generate_ts_output(properties)

    output_path = CACHE_DIR / "property_seed_data.ts"
    output_path.write_text(ts)
    print(f"Saved TypeScript to {output_path}")

    # Also save extracted JSON for reference
    json_path = CACHE_DIR / "extracted_properties.json"
    json_path.write_text(json.dumps(properties, indent=2, default=str))
    print(f"Saved extracted JSON to {json_path}")

    print("\nDone! Review the output, then update seed.ts with real data.")


if __name__ == "__main__":
    main()
