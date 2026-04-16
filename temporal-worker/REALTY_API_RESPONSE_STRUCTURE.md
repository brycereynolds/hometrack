# Realty API (zillow.realtyapi.io) - Actual Response Structure

Tested 2026-04-16 against live API with key `rt_8bkVZUy6RJVGiN089S1QK4IO`.

## Endpoint: `GET /search/bycoordinates`

### Top-Level Response

```json
{
  "message": "200",
  "source": "9vrc_ws",
  "resultsCount": {
    "totalMatchingCount": 139,
    "ungroupedResultCount": 0,
    "scrapeable_count": 139
  },
  "pagesInfo": {
    "totalPages": 1,
    "currentPage": 1,
    "resultsPerPage": 200
  },
  "searchResults": [ ... ]
}
```

### Each searchResult item

```json
{
  "property": { ... },       // <-- ALL data lives here
  "resultType": "property"
}
```

**CRITICAL**: Every result is wrapped in `{"property": {...}, "resultType": "..."}`.
The parser MUST unwrap `item["property"]` before accessing any fields.

---

## Property Object Field Map (For_Sale)

All fields below are on the **unwrapped `property` object**, NOT on the outer search result.

### Identification

| Field | Type | Example |
|-------|------|---------|
| `zpid` | `int` | `19676899` |

### Address — NESTED OBJECT, not a string

| Field | Type | Example |
|-------|------|---------|
| `address` | `dict` | `{"streetAddress": "4842 Winton Way", "zipcode": "95124", "city": "San Jose", "state": "CA"}` |
| `address.streetAddress` | `str` | `"4842 Winton Way"` |
| `address.city` | `str` | `"San Jose"` |
| `address.state` | `str` | `"CA"` |
| `address.zipcode` | `str` | `"95124"` |

**There is NO flat `streetAddress`, `city`, `state`, `zipcode` on the property object.**

### Location — NESTED OBJECT

| Field | Type | Example |
|-------|------|---------|
| `location` | `dict` | `{"latitude": 37.249596, "longitude": -121.941284}` |
| `location.latitude` | `float` | `37.249596` |
| `location.longitude` | `float` | `-121.941284` |

**There is NO flat `latitude` or `longitude` on the property object.**

### Price — NESTED OBJECT, not a number

| Field | Type | Example |
|-------|------|---------|
| `price` | `dict` | `{"value": 1898000, "pricePerSquareFoot": 1339}` |
| `price.value` | `int` | `1898000` |
| `price.pricePerSquareFoot` | `int` | `1339` |

**`price` is NOT a bare number. You must access `price["value"]`.**

### Property Details (flat fields)

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `bedrooms` | `int` | `3` | |
| `bathrooms` | `float` | `2.0` | Can be float (e.g. 2.5) |
| `livingArea` | `int` | `1417` | Square feet |
| `yearBuilt` | `int` | `1956` | |
| `propertyType` | `str` | `"singleFamily"` | camelCase |
| `daysOnZillow` | `int` | `1` | |
| `currency` | `str` | `"usd"` | |
| `country` | `str` | `"usa"` | |

### Lot Size — NESTED OBJECT

| Field | Type | Example |
|-------|------|---------|
| `lotSizeWithUnit` | `dict` | `{"lotSize": 7800.0, "lotSizeUnit": "squareFeet"}` |
| `lotSizeWithUnit.lotSize` | `float` | `7800.0` |
| `lotSizeWithUnit.lotSizeUnit` | `str` | `"squareFeet"` or `"acres"` |

**There is NO flat `lotAreaValue` or `lotSize` field.**
**Unit varies!** Can be `"squareFeet"` or `"acres"` — normalize before use.

### Listing Status — NESTED OBJECT

| Field | Type | Example |
|-------|------|---------|
| `listing` | `dict` | `{"listingStatus": "forSale", "marketingStatus": "active", "palsId": "...", "listingSubType": {...}}` |
| `listing.listingStatus` | `str` | `"forSale"` |
| `listing.marketingStatus` | `str` | `"active"` |

**There is NO flat `homeStatus`, `status`, or `statusType` field.**

### Estimates — NESTED OBJECT (sometimes empty `{}`)

| Field | Type | Example |
|-------|------|---------|
| `estimates` | `dict` | `{"zestimate": 1920100, "rentZestimate": 5476}` |
| `estimates.zestimate` | `int` | `1920100` |
| `estimates.rentZestimate` | `int` | `5476` |

**Can be empty `{}` for some properties.**

### Photos — NESTED under `media`

| Field | Type |
|-------|------|
| `media.propertyPhotoLinks.mediumSizeLink` | `str` (URL) |
| `media.propertyPhotoLinks.highResolutionLink` | `str` (URL) |
| `media.allPropertyPhotos.medium` | `list[str]` (URLs) |
| `media.allPropertyPhotos.highResolution` | `list[str]` (URLs) |

**There is NO flat `imgSrc` field.**
**There is NO `originalPhotos` or `photos` list at the property level.**

### Tax Assessment

| Field | Type | Example |
|-------|------|---------|
| `taxAssessment` | `dict` | `{"taxAssessedValue": 4464947, "taxAssessmentYear": "2025"}` |

### Other fields present but less important

- `bestGuessTimeZone` (str)
- `isFeatured` (bool)
- `isShowcaseListing` (bool)
- `isUnmappable` (bool)
- `isPreforeclosureAuction` (bool)
- `listingDateTimeOnZillow` (int, epoch ms)
- `rental` (dict)
- `listCardRecommendation` (dict)
- `openHouseShowingList` (list)
- `hdpView` (dict with `hdpUrl`, `price`, `listingStatus`)
- `region` (dict, usually empty)
- `personalizedResult` (dict)
- `propertyDisplayRules` (dict)
- `ssid` (int)
- `hasFloorPlan` (bool)
- `zillowOwnedProperty` (dict)

---

## Fields NOT present in search results (vs. what the parser expects)

The current `_parse_search_result()` looks for many fields that DO NOT EXIST in this API response:

| Expected Field | Actual Location | Fix |
|----------------|-----------------|-----|
| `prop["latitude"]` | `prop["location"]["latitude"]` | Unwrap from `location` |
| `prop["longitude"]` | `prop["location"]["longitude"]` | Unwrap from `location` |
| `prop["price"]` (as int) | `prop["price"]["value"]` (as int inside dict) | Access `.get("price", {}).get("value")` |
| `prop["lastSoldPrice"]` | NOT PRESENT in search results | Use price history or detail endpoint |
| `prop["imgSrc"]` | `prop["media"]["propertyPhotoLinks"]["mediumSizeLink"]` | Deep unwrap |
| `prop["homeStatus"]` | `prop["listing"]["listingStatus"]` | Unwrap from `listing` |
| `prop["lotAreaValue"]` | `prop["lotSizeWithUnit"]["lotSize"]` | Unwrap + unit conversion |
| `prop["livingAreaValue"]` | `prop["livingArea"]` (this one IS flat) | Already works |
| `prop["streetAddress"]` (flat) | `prop["address"]["streetAddress"]` | Already handled |
| `prop["originalPhotos"]` | NOT PRESENT | Use `media.allPropertyPhotos.medium` |
| `prop["photos"]` | NOT PRESENT | Use `media.allPropertyPhotos.medium` |
| `prop["priceHistory"]` | NOT PRESENT in search results | Only in detail endpoint |
| `prop["dateSold"]` | NOT PRESENT in search results | Only in detail endpoint |
| `prop["zestimate"]` (flat) | `prop["estimates"]["zestimate"]` | Unwrap from `estimates` |

---

## Recently_Sold Status: RETURNS ZERO RESULTS

Tested with `listingStatus=Recently_Sold` across multiple locations (San Jose, SF, Los Gatos) and radius values (1, 3, 5 miles). **Always returns 0 results.** This may be:
1. A plan/tier limitation of the API key
2. A bug in the API
3. The endpoint may require a different parameter combination

Only `For_Sale` and `For_Rent` return results.

### For_Rent structural differences

Rental results have a MUCH sparser property object:
- Missing: `bedrooms`, `bathrooms`, `livingArea`, `yearBuilt`, `lotSizeWithUnit`, `price`, `estimates`, `propertyType`, `listing`, `daysOnZillow`, `taxAssessment`
- Has instead: `listingStatus` (flat string), `title`, `matchingHomeCount`, `groupType`, `providerListingID`
- Rental listings appear to be building-level (multi-unit) entries, not individual units

---

## Summary: What the parser MUST do differently

1. **Unwrap `item["property"]`** — already done in search_comps.py (lines 339-349)
2. **Get lat/lng from `location` dict** — `prop["location"]["latitude"]` not `prop["latitude"]`
3. **Get price as int from `price` dict** — `prop["price"]["value"]` not `prop["price"]`
4. **Get photo URL from `media`** — `prop["media"]["propertyPhotoLinks"]["mediumSizeLink"]`
5. **Get status from `listing`** — `prop["listing"]["listingStatus"]`
6. **Get lot size from `lotSizeWithUnit`** — and normalize acres to sqft (1 acre = 43560 sqft)
7. **No sold data available** from search endpoint — `priceHistory`, `dateSold`, `lastSoldPrice` are all absent
8. **No `homeStatus`/`statusType`** flat fields exist
