# Zillow API Response Field Analysis

**Date:** 2026-04-15
**Source:** `/Users/brycereynolds/code/hometrack/docs/zillow_example.json`
**Total Fields:** 181 properties in propertyDetails object

---

## 1. Field Inventory by Category

### Property Basics
| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `streetAddress` | string | "809 Midvale Ln" | Top-level in address object |
| `city` | string | "San Jose" | In address object |
| `state` | string | "CA" | In address object |
| `zipcode` | string | "95136" | In address object |
| `county` | string | "Santa Clara County" | Top-level |
| `countyFIPS` | string | "06085" | FIPS code for county |
| `bedrooms` | number | 5 | Integer count |
| `bathrooms` | number | 3 | Float + breakdown available (full, half, etc.) |
| `livingArea` | number | 2112 | In sqft |
| `livingAreaUnits` | string | "sqft" | Unit type |
| `lotSize` | string | e.g., "0.33 Acres" | Formatted string |
| `lotAreaValue` | number | e.g., 14375 | Raw numeric value |
| `yearBuilt` | number | 1965 | Year as integer |
| `homeType` | string | "SINGLE_FAMILY" | Enum: SINGLE_FAMILY, CONDO, etc. |
| `homeStatus` | string | "OTHER" | Enum: For Sale, Off Market, Other, etc. |

### Financial Data
| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `price` | number | 1701400 | Current list/sale price |
| `listPriceLow` | number | (if range exists) | Lower end of price range |
| `priceChange` | number | (incremental change) | Delta from previous price |
| `priceChangeDate` | string | ISO date | When price changed |
| `lastSoldPrice` | number | 840000 | Last sale price |
| `zestimate` | number | 1701400 | Zillow's estimate |
| `zestimateHighPercent` | string | e.g., "+5%" | Confidence range high |
| `restimateLowPercent` | string | e.g., "-5%" | Confidence range low |
| `rentZestimate` | number | (if rental) | Estimated rent value |
| `pricePerSquareFoot` | number | (from resoFacts) | Computed value |
| `monthlyHoaFee` | number | null in this example | HOA fee if applicable |
| `propertyTaxRate` | number | (if available) | Annual tax rate |

### Price & Tax History (Arrays)
| Field | Type | Count | Structure |
|-------|------|-------|-----------|
| `priceHistory` | array | 3 | [{date, event, price, pricePerSquareFoot, sellerAgent, buyerAgent, source, ...}] |
| `taxHistory` | array | 25 | [{year, taxAmount, value}] - many have null year/amount |

### Location & Geography
| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `latitude` | number | 37.273056 | Decimal degrees |
| `longitude` | number | -121.86593 | Decimal degrees |
| `hasBadGeocode` | boolean | false | Flag for geocoding issues |
| `isUndisclosedAddress` | boolean | false | Privacy flag |
| `neighborhood` | string | null in example | In address object |
| `neighborhoodId` | number | 276215 | Zillow neighborhood ID |
| `neighborhoodRegion` | object | {name: "Blossom Valley"} | Structured region data |
| `timeZone` | string | (if provided) | IANA timezone |
| `parcelId` | string | "45926006" | County parcel identifier |
| `countyId` | number | (ID reference) | For lookups |
| `cityId` | number | 33839 | For lookups |
| `stateId` | number | 9 | For lookups |
| `zipcodeId` | number | 98004 | For lookups |
| `nearbyHomes` | number | 8 | Count of nearby properties |
| `nearbyNeighborhoods` | array | 10 items | Similar neighborhoods |
| `nearbyZipcodes` | array | 10 items | Nearby zips |

### Schools
| Field | Type | Count | Structure |
|-------|------|-------|-----------|
| `schools` | array | 3 | [{name, type, level, distance, rating, grades, studentsPerTeacher, ...}] |
| `elementarySchool` | string | (in resoFacts) | Text field |
| `middleOrJuniorSchool` | string | (in resoFacts) | Text field |
| `highSchool` | string | (in resoFacts) | Text field |
| `elementarySchoolDistrict` | string | (in resoFacts) | District name |

### Photos & Media
| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `photoCount` | number | 1 | Total photos available |
| `originalPhotos` | array | 1 item | [{caption, url}] |
| `thumb` | string | URL | Thumbnail image |
| `hiResImageLink` | string | URL | High resolution image |
| `desktopWebHdpImageLink` | string | URL | Desktop view image |
| `streetViewImageUrl` | string | URL | Google Street View |
| `hasPublicVideo` | boolean | false | Flag for video content |
| `primaryPublicVideo` | object | null in example | Video metadata |
| `virtualTourUrl` | string | null | Tour URL if available |
| `thirdPartyVirtualTour` | object | (if available) | Alternative tour provider |
| `richMedia` | null | null | Rich media container |
| `richMediaVideos` | null | null | Video collection |

### Listing Details & Status
| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `zpid` | number | 19703350 | Zillow Property ID - **PRIMARY KEY** |
| `mlsid` | string/null | null in example | MLS identifier |
| `mlsName` | string | (in attribution) | MLS name/source |
| `listingProvider` | object | (complex) | Data source attribution |
| `listingDataSource` | string | "Legacy" | Where data originated |
| `listingTypeDimension` | string | "Unknown Listed By" | Listing category |
| `hdpTypeDimension` | string | "Zestimate" | Page type (Zestimate/MLS/etc) |
| `propertyTypeDimension` | string | (Zillow categorization) | Property classification |
| `postingUrl` | string | URL | Direct link to listing |
| `hdpUrl` | string | URL | Zillow HDP URL |
| `daysOnZillow` | number | 3567 | Days visible on platform |
| `timeOnZillow` | string | "10 years" | Formatted duration |
| `cumulativeDaysOnMarket` | number | (if available) | Total DOM |
| `homeStatus` | string | "OTHER" | Current status |
| `contingentListingType` | string/null | null | If contingent sale |
| `comingSoonOnMarketDate` | string/null | null | If coming soon |
| `newConstructionType` | string/null | null | If new construction |

### Listing Ownership & Management
| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `isZillowOwned` | boolean | false | Zillow-owned property |
| `isCurrentSignedInUserVerifiedOwner` | boolean | (context-dependent) | Current user is owner |
| `isListingClaimedByCurrentSignedInUser` | boolean | false | User claimed listing |
| `isFeatured` | boolean | (varies) | Featured listing |
| `isShowcaseListing` | boolean | (varies) | Showcase program |
| `listedBy` | string | (agent info) | Listing agent name |
| `brokerId` | number | (ID) | Broker identifier |
| `brokerageName` | string | (name) | Brokerage name |
| `listingAccountUserId` | string | (ID) | Account user ID |

### Buyer/Market Engagement
| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `pageViewCount` | number | (view stats) | Page views on Zillow |
| `favoriteCount` | number | (counts) | Users who favorited |
| `tourViewCount` | number | (counts) | Tour views |
| `tourEligibility` | object | {isPropertyTourEligible: false} | Virtual tour availability |
| `tourAppointmentsForCurrentLoggedInUser` | array | (if available) | Scheduled tours |
| `buyAbilityData` | object | {isEligibleProperty: true, hub: {ctaButton: {enrollmentStatus: "NOT_ENROLLED"}}} | Zillow financing eligibility |
| `affordabilityEstimate` | object/null | (if calculated) | Affordability metrics |
| `mortgageZHLRates` | object | {fifteenYearFixedBucket, thirtyYearFixedBucket, arm5Bucket} | Current mortgage rates |

### Property Features (from resoFacts - 200+ detailed fields)
| Category | Sample Fields | Type |
|----------|---------------|------|
| **Bathrooms** | bathrooms, bathroomsFull, bathroomsHalf, bathroomsThreeQuarter, bathroomsOneQuarter, mainLevelBathrooms | number |
| **Bedrooms** | bedrooms, mainLevelBedrooms | number |
| **Structure** | stories, storiesDecimal, storiesTotal, levels, foundationDetails, constructionMaterials, roofType | string/number |
| **Climate Control** | heating, cooling, hasCooling, hasHeating, electric, gas, utilities, sewer, waterSource | string/boolean |
| **Parking** | garageParkingCapacity, carportParkingCapacity, coveredParkingCapacity, openParkingCapacity, hasAttachedGarage, hasCarport | number/boolean |
| **Outdoor** | patio, porch, poolFeatures, spaFeatures, hasPrivatePool, hasSpa, waterView, waterViewYN, hasWaterfrontView, waterBodyName, fencing, lotFeatures | string/boolean |
| **Interior** | fireplaceFeatures, fireplaces, hasFireplace, flooring, laundryFeatures, appliances, doorFeatures, windowFeatures | string/boolean/number |
| **Other Amenities** | associationAmenities, communityFeatures, securityFeatures, buildingFeatures, exteriorFeatures, interiorFeatures | string |
| **Association/HOA** | hasAssociation, associationName, associationFee, hoaFee, hoaFeeTotal, associationPhone | string/number/boolean |
| **Zoning/Land Use** | zoning, zoningDescription, developmentStatus, topography, vegetation, canRaiseHorses, horseYN | string |
| **Green Features** | greenBuildingVerificationType, greenEnergyEfficient, greenEnergyGeneration, greenIndoorAirQuality, greenSustainability, greenWaterConservation | string/boolean |

### Content & Descriptions
| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `description` | string | (listing description) | Full property description |
| `whatILove` | string | (user-generated) | Owner's description |
| `exclusions` | string | (listing) | What's excluded from sale |
| `inclusions` | string | (listing) | What's included in sale |
| `attributionInfo` | object | (mostly null in example) | Agent/broker contact info |

### Zillow-Specific Data
| Field | Type | Notes |
|-------|------|-------|
| `pageUrlFragment` | string | Page identifier |
| `pals` | (varies) | Zillow Partner Association Listing Service data |
| `palsId` | string | PALS identifier |
| `ouid` | string | Zillow OUID |
| `ssid` | string | Zillow SSID |
| `formattedChip` | string | Display chip text |
| `editPropertyHistorylink` | string | Link to edit history |
| `propertyEventLogLink` | string | Event log link |
| `propertyUpdatePageLink` | string | Update log page |
| `communityUrl` | string | Community info URL |
| `marketTrendsURL` | string | Market trends URL |

### Additional Metadata
| Field | Type | Notes |
|-------|------|-------|
| `isRecentStatusChange` | boolean | Flag for recent changes |
| `isNonOwnerOccupied` | boolean | Investment property indicator |
| `isHousingConnector` | boolean | Special program flag |
| `isIncomeRestricted` | boolean | Affordable housing flag |
| `isPremierBuilder` | boolean | Builder classification |
| `isSeniorCommunity` | boolean | Senior living flag |
| `downPaymentAssistance` | object/null | Down payment programs |

---

## 2. Most Valuable Fields for HomeTrack Use Cases

### For Comp Analysis (Market Value Estimation)
**High Priority:**
- `zestimate` + `zestimateHighPercent`/`restimateLowPercent` — Zillow's valuation with confidence range
- `lastSoldPrice` + `priceHistory` — Historical pricing data
- `pricePerSquareFoot` — Normalized comparison metric
- `livingArea` — Size-normalized comparisons
- `bedrooms`, `bathrooms`, `yearBuilt` — Key property attributes
- `propertyTaxRate`, `taxHistory` — Tax burden indicator
- `zpid` — Unique identifier for lookups

**Supporting:**
- `nearbyHomes` — Comparable properties list
- `daysOnZillow` — Market velocity indicator
- `priceChange` — Recent market movement

### For Property Profile (Buyer Information Page)
**Essential:**
- Full address (street, city, state, zip, lat/lng)
- `bedrooms`, `bathrooms`, `livingArea`, `yearBuilt`
- `price`, `zestimate`, `lastSoldPrice`
- `homeType`, `homeStatus`
- Schools (entire `schools` array)
- Photos (all photo URLs)
- `description`, listing details

**Strong Value:**
- `resoFacts` subset: heating/cooling, parking, garage, pool, fireplace
- `zpid`, `mlsid`, `parcelId` for external links
- Mortgage rates (`mortgageZHLRates`)
- `affordabilityEstimate` for financing info
- Neighborhood name/rating

**Nice-to-Have:**
- `pageViewCount`, `favoriteCount` — social proof
- Tax/price history charts
- Virtual tour links
- School ratings/distances

### For Buyer Matching (Recommender/Filtering)
**Critical for Filters:**
- `bedrooms`, `bathrooms`, `livingArea` — User preferences
- `price` — Budget constraints
- `latitude`, `longitude` — Location radius
- `homeType` — Single family vs condo, etc.
- Schools data — School quality matching
- `propertyTaxRate` — Tax burden consideration

**Matching/Ranking Signals:**
- `zestimate` trend — Appreciation potential
- `daysOnZillow` — Availability signal
- `neighborhoodId`, neighborhood quality — Lifestyle fit
- `walkability` (if computed from coords)
- Distance to work/school

---

## 3. Data Type Reference

### Primitives
- **string**: address, city, state, zipcode, homeType, homeStatus, etc.
- **number**: price, bedrooms, bathrooms, yearBuilt, latitude, longitude, zestimate, etc.
- **boolean**: hasGarage, hasPool, hasCooling, etc.
- **null**: many optional fields (mlsid, monthlyHoaFee, etc.)

### Structured Objects
```javascript
address: {
  streetAddress: string,
  city: string,
  state: string,
  zipcode: string,
  neighborhood: string | null,
  community: string | null,
  subdivision: string | null
}

neighborhoodRegion: {
  name: string,
  // potentially more fields in full API
}

mortgageZHLRates: {
  fifteenYearFixedBucket: { rate: number, rateSource: string, lastUpdated: number },
  thirtyYearFixedBucket: { rate: number, rateSource: string, lastUpdated: number },
  arm5Bucket: { rate: number, rateSource: string, lastUpdated: number }
}

buyAbilityData: {
  isEligibleProperty: boolean,
  chipLabel: string | null,
  hub: { ctaButton: { enrollmentStatus: string } }
}

tourEligibility: {
  isPropertyTourEligible: boolean,
  propertyTourOptions: {
    isFinal: boolean,
    tourAvailability: array,
    tourType: string
  }
}

listingProvider: {
  logos: array,
  title: string,
  disclaimerText: string | null,
  agentName: string | null,
  postingWebsiteURL: string | null,
  // ... additional fields
}

attributionInfo: {
  // 20+ contact/agent info fields - mostly null in this example
  trueStatus: string | null,
  mlsId: string | null,
  agentName: string | null,
  brokerName: string | null,
  // ...
}

resoFacts: {
  // 200+ detailed property facts
  bathrooms: number,
  bedrooms: number,
  heating: string,
  cooling: string,
  garage: boolean | number,
  // ... extensive detail
}
```

### Arrays
```javascript
priceHistory: [
  {
    date: string (ISO),
    event: string,
    price: number,
    pricePerSquareFoot: number,
    sellerAgent: string | null,
    buyerAgent: string | null,
    source: string,
    // ... 7 more fields
  }
],

taxHistory: [
  {
    year: number | null,
    taxAmount: number | null,
    value: number
  }
],

schools: [
  {
    name: string,
    type: string ("Public" | "Private"),
    level: string ("Elementary" | "Middle" | "High"),
    distance: number (miles),
    rating: number (1-10),
    grades: string ("K-5", "6-8", etc.),
    studentsPerTeacher: number | null,
    size: number | null,
    link: string,
    isAssigned: boolean,
    // ... additional fields
  }
],

originalPhotos: [
  {
    caption: string,
    url: string
  }
]

nearbyHomes: [
  // array of nearby property objects (count = 8)
],

nearbyNeighborhoods: [
  // array of similar neighborhoods (count = 10)
],

nearbyZipcodes: [
  // array of nearby zip codes (count = 10)
]
```

---

## 4. Storage vs. Computed Fields

### Store Everything
These fields provide value as-is and rarely need computation:
- Basic property info: address, bedrooms, bathrooms, yearBuilt, homeType
- Identifiers: zpid, mlsid, parcelId, latitude/longitude
- Financial: price, zestimate, lastSoldPrice, taxes
- Status: homeStatus, daysOnZillow, listing dates
- User engagement: pageViewCount, favoriteCount
- Schools array
- Price & tax history arrays
- Photos & media URLs

### Compute / Derive
These can be calculated from stored data:
- **pricePerSquareFoot** = price / livingArea (or get from resoFacts)
- **pricePerBedroom** = price / bedrooms
- **pricePerBathroom** = price / bathrooms
- **Age** = currentYear - yearBuilt
- **Appreciation rate** = (currentPrice - lastSoldPrice) / timeSinceLastSale
- **DaysOnMarket** = compare listing date to sale date
- **Affordability metrics** = based on mortgage rates + down payment
- **Nearest school distance** = from schools array
- **Walkability score** = computed from location (not in API)

### Don't Store (Duplicate/Transient)
- `formattedChip` — UI formatting, recompute if needed
- `editPropertyHistorylink`, `propertyUpdatePageLink` — URLs, generate from zpid
- `pageUrlFragment` — Generate from zpid
- Many attribution/contact fields if MLS/source provides them separately
- Tour counts and engagement metrics that update frequently

---

## 5. Data Availability Patterns

### Always Present
- zpid, address (street/city/state/zip), latitude, longitude
- bedrooms, bathrooms, price
- yearBuilt, homeType, homeStatus
- zestimate

### Often Missing (Null)
- mlsid (only if from MLS)
- monthlyHoaFee (only if applicable)
- neighborhood (null if not defined)
- tours/videos (null if not available)
- attributionInfo fields (all null in this example)
- viewCount/pageViewCount (context-dependent)
- virtualTourUrl (only if property has tours)

### Only on Active Listings
- daysOnZillow (3567 = 10 years for off-market)
- priceHistory (populated for all status types)
- openHouseSchedule

---

## 6. Gaps vs. Redfin/MLS Data

### Missing from This Zillow Response
1. **Agent/Broker Info** — attributionInfo largely null here
   - Would need: agent license verification, brokerage details
   - MLS has this; Redfin provides agent performance ratings

2. **Contingencies & Terms** — Not detailed
   - contingentListingType is null
   - Would need: inspection contingencies, appraisal contingencies, closing timeline
   - Redfin/MLS would have these

3. **Showing Instructions** — Not in response
   - Who can show? When? Lockbox info?
   - Critical for RE agents; MLS has this

4. **Days on Market Breakdown** — Only aggregate
   - daysOnZillow ≠ days currently on market
   - cumulativeDaysOnMarket is sometimes available
   - MLS provides exact DOM

5. **Detailed Inspection Status** — Not present
   - Has inspection been done? Results?
   - Repairs needed? Known issues?
   - Not in API; critical for buyers

6. **HOA/Covenant Details** — Minimal
   - Association name/fee yes, but not:
    - Detailed covenants/restrictions
    - Reserve percentage
    - Litigation status
   - Redfin has more structured HOA data

7. **Lien/Judgment Info** — Not present
   - Would need county records integration
   - Critical for investment/financing

8. **Walkability/Transit Scores** — Not in Zillow response
   - Would need third-party API (Walk Score, Google Transit)

9. **Utility Estimates** — Not provided
   - Gas/electric usage and costs
   - Important for buyers

10. **Previous Occupancy/Rental History** — Not included
    - Was this ever a rental? For how long?
    - Important for SFR vs investment analysis

### Recommendations for Complete Data
1. **For comps**: Zillow sufficient (price history, zestimate, features)
2. **For buyer profile**: Zillow strong, supplement with:
   - MLS for contingency/terms (if listing is MLS)
   - County records for liens
   - Walk Score API for walkability
3. **For financing**: Use Zillow's `affordabilityEstimate` + `mortgageZHLRates` but validate with actual lenders
4. **For investment analysis**: Zillow alone insufficient; need:
   - Redfin's rental data (if applicable)
   - County tax/assessment history (Zillow has some, more in county records)
   - Detailed HOA financials (request from HOA directly)

---

## 7. Implementation Notes

### Primary Key Strategy
- Use **zpid** as primary identifier
- Store zpid, address, lat/lng for deduplication
- When pulling from MLS, use mlsid as secondary key (with zpid cross-reference)

### API Response Quirks
- Many fields are **null by design** (only populate if applicable)
- `attributionInfo` often entirely null (contact via listing provider instead)
- `richMedia`/`richMediaVideos` null even when photos exist (use originalPhotos)
- Some `resoFacts` fields overlap with top-level properties (trust top-level values)

### Field Selection for MVP
**Minimum viable property record:**
```
zpid, address, bedrooms, bathrooms, livingArea, price,
zestimate, lastSoldPrice, yearBuilt, latitude, longitude,
homeType, homeStatus, photoCount, originalPhotos (URLs only),
schools (array), county, state
```

**For comps view:**
- Add: priceHistory, propertyTaxRate, taxHistory, daysOnZillow, nearbyHomes

**For full property profile:**
- Add: description, resoFacts (selective), mortgageZHLRates, affordabilityEstimate,
  pageViewCount, favoriteCount, tourEligibility

---

## 8. Data Freshness & Update Patterns

### Real-Time / Hourly
- pageViewCount, favoriteCount, tourViewCount (engagement metrics)
- Price (if listing status changes)

### Daily
- priceHistory, daysOnZillow (if active)
- propertyTaxRate (tax assessments updated periodically)

### Less Frequent
- Schools data (annual updates)
- Neighborhood ratings
- resoFacts (when property is updated)

**Recommendation:** Cache Zillow data for 24 hours; refresh price/history on demand for active listings.

---

## Summary Table

| Use Case | Key Fields | Source Priority | Notes |
|----------|-----------|------------------|-------|
| **Comp Analysis** | zestimate, priceHistory, livingArea, beds/baths | Zillow primary | Sufficient for market value |
| **Property Profile** | All basics + photos + schools + description | Zillow sufficient | Good for consumer view |
| **Buyer Matching** | beds/baths, price, location, schools, tax rate | Zillow sufficient | Filter logic straightforward |
| **Investment Analysis** | lastSoldPrice, taxHistory, HOA fees, cap rate | Zillow + County records | Need tax/HOA detail |
| **Financing** | affordabilityEstimate, mortgageZHLRates | Zillow + Lender | Validate with actual lenders |
| **Agent/Terms** | Contingencies, showing instructions, DOM | Zillow insufficient | Need MLS or agent contact |

