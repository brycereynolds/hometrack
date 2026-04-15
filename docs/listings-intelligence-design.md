# Listings Intelligence Feature — Design Specification

**Date:** April 2026
**Status:** Design & Research
**Phase:** Feature specification for implementation

---

## Executive Summary

Listings Intelligence transforms HomeTrack's pricing and comp analysis capabilities by introducing a dedicated "Listing" tab in the listing detail view. This tab serves as the intelligence center for pricing decisions, market analysis, and ongoing price monitoring. The feature integrates comp data APIs to provide real-time market analysis, historical pricing suggestions, and automated refresh scheduling.

---

## Part 1: Comp Data API — Realty API (RapidAPI)

### 1.1 API Overview

**API:** Realty in US (by APIDoJo on RapidAPI)
**Host:** `realty-in-us.p.rapidapi.com`
**Status:** Active, well-maintained aggregator pulling from Realtor.com / Move Inc. data
**Coverage:** Nationwide USA — active, pending, sold, and off-market properties

**Authentication:**
```
X-RapidAPI-Key: <your-rapidapi-key>
X-RapidAPI-Host: realty-in-us.p.rapidapi.com
```

**Pricing Tiers:**

| Tier | Price | Requests/month | Rate Limit |
|------|-------|----------------|------------|
| Basic (Free) | $0 | 250 | 5 req/sec |
| Pro | $10/mo | 5,000 | 10 req/sec |
| Ultra | $30/mo | 20,000 | 10 req/sec |
| Mega | $100/mo | 100,000 | 30 req/sec |

For our use case, the Pro tier ($10/mo, 5,000 requests) is sufficient for initial launch. A typical market analysis uses ~5–15 API calls (1 list search + detail calls per comp).

---

### 1.2 Key Endpoints

#### A. Property Search — `GET /properties/v3/list`

Primary endpoint for finding comps. Supports searching by coordinates + radius, city, state, zip, or address.

**Key Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `lat` | float | Latitude of center point |
| `lng` | float | Longitude of center point |
| `radius` | float | Search radius in miles (e.g., 0.5, 1, 2, 5) |
| `status` | string | `for_sale`, `sold`, `ready_to_build`, `for_rent` |
| `type` | string | `single_family`, `condo`, `townhome`, `multi_family`, `land`, `mobile`, `farm` |
| `beds_min` / `beds_max` | int | Bedroom filter |
| `baths_min` / `baths_max` | int | Bathroom filter |
| `price_min` / `price_max` | int | Price range filter |
| `sqft_min` / `sqft_max` | int | Square footage filter |
| `lot_sqft_min` / `lot_sqft_max` | int | Lot size filter |
| `sold_date_min` / `sold_date_max` | string | Sold date range (YYYY-MM-DD) — critical for comp dating |
| `sort` | string | `sold_date`, `price_low`, `price_high`, `newest`, `relevant` |
| `limit` | int | Results per page (max 200) |
| `offset` | int | Pagination offset |

**Example — Search for sold comps within 0.5mi:**

```bash
curl -X GET "https://realty-in-us.p.rapidapi.com/properties/v3/list?\
lat=37.7609&lng=-122.4240&radius=0.5&\
status=sold&type=single_family&\
beds_min=2&beds_max=4&\
sold_date_min=2026-01-14&sold_date_max=2026-04-14&\
sort=sold_date&limit=20" \
  -H "X-RapidAPI-Key: YOUR_KEY" \
  -H "X-RapidAPI-Host: realty-in-us.p.rapidapi.com"
```

**Response Fields (per property):**

```json
{
  "property_id": "R1234567890",
  "listing_id": "2960012345",
  "status": "sold",
  "list_price": 1250000,
  "sold_price": 1225000,
  "price_per_sqft": 512,
  "description": {
    "beds": 3,
    "baths": 2,
    "baths_full": 2,
    "sqft": 1200,
    "lot_sqft": 2500,
    "year_built": 1960,
    "type": "single_family",
    "stories": 2,
    "garage": 1
  },
  "location": {
    "address": {
      "line": "789 Valencia Street",
      "city": "San Francisco",
      "state_code": "CA",
      "postal_code": "94110"
    },
    "coordinate": {
      "lat": 37.7609,
      "lon": -122.4240
    }
  },
  "photos": [
    { "href": "https://photos.example.com/photo1.jpg" }
  ],
  "sold_date": "2026-03-15",
  "list_date": "2026-02-01",
  "days_on_market": 42,
  "last_sold_price": 1225000,
  "last_sold_date": "2026-03-15",
  "tags": ["central_air", "garage_1_or_more", "fireplace"]
}
```

---

#### B. Property Detail — `GET /properties/v3/detail`

Fetches full detail for a single property by `property_id`.

**Parameters:**
- `property_id` (string, required) — The property ID from search results

**Example:**

```bash
curl -X GET "https://realty-in-us.p.rapidapi.com/properties/v3/detail?\
property_id=R1234567890" \
  -H "X-RapidAPI-Key: YOUR_KEY" \
  -H "X-RapidAPI-Host: realty-in-us.p.rapidapi.com"
```

**Additional Fields (beyond list response):**
- Full photo gallery (all photos with captions)
- Tax history (annual assessments)
- Price history (all price changes and sales)
- Property history (sales, listings, delisted events)
- Schools nearby
- Neighborhood data
- Estimated mortgage
- Open house schedule (if active)

---

#### C. Property by Coordinates — `GET /properties/v3/list` (same endpoint)

For searching comps around a subject property, we use the list endpoint with `lat`, `lng`, and `radius` parameters. This is the primary method for our market analysis workflow.

---

#### D. Auto-Complete / Location Search — `GET /locations/v2/auto-complete`

Useful for geocoding when we only have an address string.

**Parameters:**
- `input` (string) — Address or location text

**Returns:** Matched locations with coordinates, used as fallback geocoding.

---

### 1.3 Rate Limiting Strategy

**Request Budget Per Analysis:**
- 1 call: Search sold comps (`/properties/v3/list?status=sold`)
- 1 call: Search active listings (`/properties/v3/list?status=for_sale`)
- 5–15 calls: Property detail for top comps (`/properties/v3/detail`)
- **Total: ~7–17 calls per analysis**

**Monthly Budget (Pro tier, 5,000 requests):**
- ~290–700 analyses per month — sufficient for initial user base
- Scale to Ultra ($30/mo, 20K requests) when needed

**Caching Strategy:**
- Cache property detail responses for 24 hours (property details don't change frequently)
- Cache search results for 1 hour (new listings appear regularly)
- Store all fetched comp data in `comp_listings` table for historical reference
- Re-use cached comp data when user re-runs analysis with same parameters within cache window

**Rate Limit Handling:**
- Implement exponential backoff on 429 responses
- Queue detail requests with 200ms delay between calls (stay under 5 req/sec on Basic)
- Temporal activity retry policy: 3 retries with exponential backoff

---

### 1.4 API Strategy

**Primary (Now): Realty API via RapidAPI**
- Immediate integration, no licensing required
- Nationwide coverage with rich property data
- Affordable for startup phase ($10/mo Pro tier)
- Sufficient data fields for comp analysis: price, beds, baths, sqft, lot, year_built, sold_date, DOM, photos, coordinates

**Future: Official MLS Access (Bridge Interactive / RESO Web API)**
- Being pursued in parallel for better data quality and compliance
- Official MLS data is more accurate and timely than aggregated sources
- Required for IDX compliance if displaying listing data to end users
- Will be added as a secondary data source when MLS credentials are obtained
- See Appendix C for RESO Web API example requests

---

### 1.5 API Integration Architecture

**Database Storage for Comp Data:**

```sql
-- Store external API source info
comp_listings (
  id (UUID)
  market_analysis_id (FK)
  source ('realty_api' | 'mls')
  external_id (string) -- property_id from Realty API, MLS# from RESO
  address, city, state, zip
  price, price_per_sqft
  beds, baths, sqft, lot_sqft
  year_built
  sold_date, days_on_market, status
  distance_miles
  lat, lng
  photos (jsonb array)
  adjustments (jsonb)
  confidence_score
  created_at, updated_at
)

-- Track API usage
api_usage_log (
  id (UUID)
  team_id (FK)
  api_source ('realty_api' | 'mls')
  endpoint (string) -- '/properties/v3/list', '/properties/v3/detail'
  calls_made
  timestamp
)

-- Store user's API credentials (for future MLS integration)
integrations (
  id (UUID)
  team_id (FK)
  type ('reso_web_api')
  credentials (encrypted JSONB)
  status ('connected' | 'disconnected' | 'error')
  last_sync
  created_at, updated_at
)
```

**Environment Variables:**

```bash
# Realty API (RapidAPI) — comp data
REALTY_API_KEY=<rapidapi-key>
REALTY_API_HOST=realty-in-us.p.rapidapi.com
```

---

## Part 2: Feature Design Specification

### 2.1 New "Listing" Tab UI

**Location:** `/listings/[id]/listing` — new route between Overview and Activity tabs

**Tab Navigation:**
Current order: Overview → Activity → Tasks → ...
New order: Overview → **Listing** → Activity → Tasks → ...

---

### 2.2 State: No Listing Price Set

**When:** User opens listing for first time, or listing.price is NULL

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ Listing Price & Market Analysis                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⚡ Set Your Listing Price                     │
│                                                 │
│  Get data-driven pricing recommendations       │
│  based on recent comps in your market.         │
│                                                 │
│  [ Quick Set: $___,___  ] [Run Analysis →]    │
│                          OR                    │
│                   [Run Full Analysis →]        │
│                                                 │
│  Why Market Analysis Matters:                  │
│  • Price your listing competitively            │
│  • Show confidence to clients (backed by data) │
│  • Adjust strategy as market shifts            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Quick Set Option:**
- Text input field for manual price entry
- User types desired price and clicks "Set"
- Updates listing.price and closes CTA
- No comp analysis required

**Run Analysis Button:**
- Opens market analysis section (below)
- Runs API queries to find comps
- Displays results and suggests price range

---

### 2.3 State: Listing Price Set

**When:** listing.price is set and user views Listing tab

**Top Card:**

```
┌──────────────────────────────────────────────────┐
│ LISTING PRICE: $1,250,000                        │
├──────────────────────────────────────────────────┤
│                                                  │
│ Price Set: Apr 10, 2026 by You                  │
│ Last Analysis: Apr 11, 2026                     │
│ Market Confidence: ★★★★☆ (Strong)              │
│                                                  │
│ [View Price History] [Run New Analysis]         │
│                                                  │
│ Market Context:                                 │
│ 87 active comps in 0.5mi radius                │
│ Avg $/sqft: $512 (yours: $509)                 │
│ Market Trend: ↗ +2.3% YoY                      │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Price History Section:**
- Timeline of price changes
- Each entry: date, old price → new price, reason (manual / analysis recommendation)
- Expandable: shows what changed

```
Apr 11, 2026 — $1,250,000 (Manual adjustment from $1,275,000)
Apr 10, 2026 — $1,275,000 (Initial price set)
```

---

### 2.4 Market Analysis Section

**Location:** Below price card in Listing tab

**Map View:**

```
┌────────────────────────────────────────────────┐
│                                                │
│    🔴 Subject Property                        │
│         ⚪ Comp 1 ($425K)                    │
│         ⚪ Comp 2 ($465K)                    │
│         ⚪ Comp 3 ($440K)                    │
│                                                │
│    (Leaflet map with 0.5mi radius overlay)  │
│    Adjust Radius: [0.25mi] ←→ [5mi]         │
│                                                │
└────────────────────────────────────────────────┘
```

**Search Parameters Card:**

```
┌────────────────────────────────────────────────┐
│ Analysis Settings                              │
├────────────────────────────────────────────────┤
│ Radius: 0.5 miles          [Adjust ↔]         │
│ Date Range: Last 90 days                      │
│   [Last 30] [Last 90] [Last 180] [Custom]     │
│                                                │
│ Property Type: [All ▼]                        │
│ Beds/Baths: [2+ beds] [1+ baths]              │
│ Status: [Sold ✓] [Active ✓] [Pending]        │
│                                                │
│ Data Source:                                   │
│  ☑ Realty API  ☑ MLS (if connected)          │
│                                                │
│                         [Run Analysis]        │
│                                                │
└────────────────────────────────────────────────┘
```

**Comps Table:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 8 Recent Comps                                                       │
├──────┬──────────────┬───────┬──────┬──────┬──────┬─────────┬────────┤
│ Addr │ Price        │ $/sqft│ Beds │Bath │ Sqft │ Sold    │ Distance│
├──────┼──────────────┼───────┼──────┼──────┼──────┼─────────┼────────┤
│ 123  │ $445,000     │ $512  │  3   │ 2.5  │ 868  │ Feb 2026│ 0.3mi  │
│ Oak  │              │       │      │      │      │         │        │
│      │              │       │      │      │      │         │        │
│  ... (more rows)                                                     │
├──────┴──────────────┴───────┴──────┴──────┴──────┴─────────┴────────┤
│                                                                      │
│ [Adjust Selected Comps] [Add Manual Comp]                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Comp Adjustments (Per Comp):**

Clicking a comp row expands:

```
┌─────────────────────────────────────────────────┐
│ 123 Oak Ave — $445,000                          │
├─────────────────────────────────────────────────┤
│ Sold: Feb 2026  Days on Market: 18  Distance: 0.3mi
│                                                 │
│ Property Details:                               │
│ • 3 bed, 2.5 bath, 868 sqft (similar to yours) │
│ • Year Built: 1985 (same)                       │
│ • Lot: 6,500 sqft (yours: 6,200)               │
│ • Condition: Good                               │
│                                                 │
│ Adjustments (% or $):                           │
│ • Pool: +$25,000 (you don't have)               │
│ • Updates: -$15,000 (newer kitchen)             │
│ • Lot size: +$8,000 (larger)                    │
│ ├─────────────────────────────────────        │
│ Adjusted Value: $463,000                        │
│                                                 │
│ [Save] [Edit] [Remove from Analysis]            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 2.5 AI Analysis Results Card

**After Running Analysis:**

```
┌────────────────────────────────────────────────┐
│ AI Market Analysis Results                      │
├────────────────────────────────────────────────┤
│                                                │
│ Suggested Price Range:                         │
│ ┌──────────────────────────────────────────┐  │
│ │  $445,000 ————————●————— $495,000        │  │
│ │          ↑ Your Current: $1,250,000 ✓   │  │
│ │                                            │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Confidence Score: ★★★★☆ (85%)                │
│ • 8 strong comps found                        │
│ • Market stable (low variance)                │
│ • Similar property types                      │
│                                                │
│ Market Narrative (AI-Generated):               │
│ "This 3-bed home in Mission Dolores is        │
│  priced competitively for the current        │
│  market. Recent comps avg $467K with         │
│  prices trending up 2% QoQ. Your price      │
│  of $1.25M seems elevated; consider          │
│  $1.48M–$1.52M range for faster sale."      │
│                                                │
│ Key Insights:                                  │
│ • Similar homes selling 3–4 weeks faster     │
│ • Market trending up; good time to list      │
│ • Inventory: 1.2 months (balanced)           │
│                                                │
│ [Accept Suggestion] [Adjust Price] [Dismiss] │
│                                                │
└────────────────────────────────────────────────┘
```

---

### 2.6 Analysis History Section

**Location:** Below current analysis

```
┌────────────────────────────────────────────────┐
│ Analysis History (Last 6 Months)               │
├────────────────────────────────────────────────┤
│                                                │
│ Apr 11, 2026 10:30am                          │
│ Suggested Range: $445K–$495K ✓ Completed      │
│ [View Results]                                 │
│                                                │
│ Apr 10, 2026 2:15pm                           │
│ Manual: Set to $1,250,000 (no comps)         │
│                                                │
│ Mar 25, 2026 9:00am                           │
│ Suggested Range: $412K–$450K ✓ Completed      │
│ [View Results]                                 │
│                                                │
│ Mar 10, 2026 3:45pm                           │
│ Analysis Failed: API Error (Realty API timeout) │
│ [Retry]                                        │
│                                                │
└────────────────────────────────────────────────┘
```

---

### 2.7 Scheduling & Automation Section

**Location:** Bottom of Listing tab

```
┌────────────────────────────────────────────────┐
│ Auto-Refresh Market Data                       │
├────────────────────────────────────────────────┤
│                                                │
│ [ Toggle: OFF / ON ]                           │
│                                                │
│ When enabled:                                  │
│ Frequency: [Weekly ▼]                         │
│            (options: Weekly / Bi-weekly / Monthly)
│                                                │
│ Last Run: Apr 11, 2026 10:30am                │
│ Next Run: Apr 18, 2026 10:30am                │
│                                                │
│ ⓘ Plan Feature: Auto-refresh available in    │
│   Professional plan. Upgrade to enable.       │
│                                                │
│ [Manage Plan]                                  │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Part 3: Backend Architecture & Temporal Workflow

### 3.1 Workflow: `market_analysis`

**Trigger:**
- User clicks "Run Analysis" button
- Scheduled run fires (if enabled)
- API call: `POST /api/listings/[id]/run-market-analysis`

**Workflow Steps:**

```
1. Validate Input
   - listing exists
   - team_id matches user
   - address/lat/lng available

2. Geocode Address (if needed)
   - If lat/lng missing, use Realty API auto-complete:
     GET /locations/v2/auto-complete?input={address}
   - Extract coordinates from response
   - Fallback: Nominatim (free, no API key)
   - Store coordinates in listings table

3. Search for Sold Comps (Realty API)
   GET /properties/v3/list
   - lat, lng from step 2
   - radius: user-selected (default 0.5 miles)
   - status: "sold"
   - sold_date_min: NOW - date_range_days (default 90 days)
   - sold_date_max: NOW
   - type: property_type filter (default: same as subject)
   - beds_min/beds_max: subject beds ±1
   - sort: "sold_date"
   - limit: 20
   → Collect property_ids for detail fetching

4. Search for Active Listings (Realty API)
   GET /properties/v3/list
   - Same lat/lng/radius as step 3
   - status: "for_sale"
   - Same property type and bed/bath filters
   - sort: "relevant"
   - limit: 10
   → Provides market context (current competition)

5. Get Property Details for Top Comps (Realty API)
   GET /properties/v3/detail?property_id={id}
   - Fetch full details for top 8–15 comps from steps 3 & 4
   - Queue with 200ms delay between calls (rate limit safety)
   - Extract: full photo gallery, price history, tax history
   - Store external property_id for linking back to source

6. Filter & Rank Comps
   - Remove outliers (price, sqft >2x subject or <0.5x)
   - Score comps by relevance (similarity to subject property)
   - Weight factors: distance, sqft similarity, bed/bath match, recency
   - Keep top 8–15 comps

7. Calculate Metrics
   - price_per_sqft for each comp
   - distance from subject property (haversine)
   - days on market average
   - price trend (rising/falling based on sold_date vs price)

8. AI Analysis (Claude)
   - Prompt: Subject property details + comp list + adjustments
   - Generate: suggested price range, confidence score, reasoning, market narrative
   - Use chain-of-thought reasoning

9. Store Results
   - Create market_analyses record with status 'completed'
   - Insert comp_listings rows (one per comp)
   - Store external_id (Realty API property_id) per comp for source linking
   - Store ai_narrative and suggested_price_range

10. Notify User
    - Update UI with results
    - Fire activity_item for audit trail
    - Optional: Send email notification

11. Handle Errors
    - API quota exceeded (429) → retry with exponential backoff, then status 'partial'
    - API failure → status 'failed' with error message
    - No comps found → auto-expand radius (0.5 → 1 → 2 miles) and retry step 3
    - User can retry or use cached results
```

---

### 3.2 Temporal Workflow JSON

**File:** `src/lib/server/workflows/market-analysis-workflow.ts`

```typescript
export const marketAnalysisWorkflow = defineWorkflow({
  id: 'market_analysis',
  displayName: 'Market Analysis for Listing',
  description: 'Runs comp search and price analysis',

  input: {
    listing_id: string,
    team_id: string,
    user_id: string,
    search_params?: {
      radius_miles?: number,      // 0.25–5, default 0.5
      date_range_days?: number,   // 30, 90, 180, default 90
      property_type?: string,     // 'all', 'single_family', 'condo', etc.
      min_beds?: number,
      min_baths?: number,
      status?: string[],          // 'sold', 'active', 'pending'
      api_sources?: string[]      // 'realty_api', 'mls'
    }
  },

  activities: {
    validateListing: validateListingActivity,
    geocodeAddress: geocodeAddressActivity,
    searchComps: searchCompsActivity,
    filterComps: filterCompsActivity,
    runAIAnalysis: runAIAnalysisActivity,
    storeResults: storeResultsActivity,
    notifyUser: notifyUserActivity
  },

  execute: async function* (input) {
    // 1. Validate
    const listing = yield validateListing(input.listing_id, input.team_id);

    // 2. Geocode
    const coords = yield geocodeAddress(listing.address, listing.city, listing.state);

    // 3. Search comps (parallel APIs)
    const comps = yield searchComps({
      lat: coords.lat,
      lng: coords.lng,
      ...input.search_params
    });

    // 4. Filter
    const filtered = yield filterComps(comps, {
      subject_price: listing.price,
      subject_sqft: listing.sqft,
      subject_beds: listing.beds
    });

    // 5. AI analysis
    const analysis = yield runAIAnalysis({
      listing,
      comps: filtered,
      search_params: input.search_params
    });

    // 6. Store
    yield storeResults({
      listing_id: input.listing_id,
      team_id: input.team_id,
      comps: filtered,
      analysis
    });

    // 7. Notify
    yield notifyUser({
      user_id: input.user_id,
      listing_id: input.listing_id,
      analysis_results: analysis
    });

    return {
      status: 'completed',
      suggested_price_low: analysis.price_range.low,
      suggested_price_high: analysis.price_range.high,
      confidence: analysis.confidence,
      comps_found: filtered.length
    };
  }
});
```

---

## Part 4: Database Schema Additions

### 4.1 New Tables

**1. market_analyses**

```sql
CREATE TABLE market_analyses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  error_message TEXT,

  -- Analysis parameters
  search_params JSONB, -- { radius_miles, date_range_days, property_type, filters }

  -- Results
  suggested_price_low REAL,
  suggested_price_high REAL,
  confidence_score REAL, -- 0–1 scale
  ai_narrative TEXT,
  market_insights JSONB, -- { trend, dom_avg, market_context }

  -- Metadata
  comps_found INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  INDEX market_analyses_listing_id_idx (listing_id),
  INDEX market_analyses_team_id_idx (team_id),
  INDEX market_analyses_status_idx (status)
);
```

**2. comp_listings**

```sql
CREATE TABLE comp_listings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  market_analysis_id TEXT NOT NULL REFERENCES market_analyses(id) ON DELETE CASCADE,

  -- Source info
  source TEXT NOT NULL CHECK (source IN ('realty_api', 'mls')),
  external_id TEXT, -- ZPID, MLS#, etc.

  -- Property details
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat REAL,
  lng REAL,
  distance_miles REAL,

  -- Property characteristics
  beds INTEGER,
  baths REAL,
  sqft INTEGER,
  lot_sqft INTEGER,
  year_built INTEGER,
  property_type TEXT,

  -- Transaction info
  price REAL,
  price_per_sqft REAL,
  sold_date TIMESTAMP,
  status TEXT, -- 'sold', 'active', 'pending'
  days_on_market INTEGER,

  -- Photos
  photos JSONB, -- [ { url, caption }, ... ]

  -- User adjustments
  adjustments JSONB, -- [ { name, amount, type: 'dollar'|'percent', reason } ]
  adjusted_price REAL,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  INDEX comp_listings_market_analysis_idx (market_analysis_id),
  INDEX comp_listings_source_idx (source)
);
```

**3. analysis_schedules**

```sql
CREATE TABLE analysis_schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Schedule config
  enabled BOOLEAN DEFAULT FALSE,
  frequency TEXT NOT NULL DEFAULT 'weekly'
    CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly')),

  -- Run tracking
  last_run TIMESTAMP,
  next_run TIMESTAMP,

  -- Result of last run
  last_status TEXT, -- 'success', 'failed', 'partial'

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  INDEX analysis_schedules_listing_idx (listing_id),
  INDEX analysis_schedules_next_run_idx (next_run)
);
```

---

### 4.2 Schema Modifications to Existing Tables

**listings table — Add columns:**

```sql
ALTER TABLE listings ADD COLUMN market_analysis_id TEXT
  REFERENCES market_analyses(id) ON DELETE SET NULL;

ALTER TABLE listings ADD COLUMN price_set_date TIMESTAMP;
ALTER TABLE listings ADD COLUMN price_set_by_user_id TEXT
  REFERENCES team_members(id) ON DELETE SET NULL;
```

---

## Part 5: Data Migrations & Seed Data Updates

### 5.1 Seed Data Changes

**Current listings to adjust:**

```sql
-- Remove prices from pre-market listings
UPDATE listings
SET price = NULL, price_set_date = NULL
WHERE phase = 'pre_market' AND id IN ('l-3', 'l-4', 'l-5', 'l-8');

-- Remove unrealistic offers
DELETE FROM offers
WHERE listing_id IN ('l-3', 'l-4', 'l-5', 'l-8');

-- Create new pre-market listing (no price)
INSERT INTO listings (
  id, team_id, address, city, state, zip,
  beds, baths, sqft, lot_sqft, year_built, property_type,
  lat, lng, phase, client_id, agent_id, created_at
) VALUES (
  'l-9', 't-1', '789 Valencia Street', 'San Francisco', 'CA', '94110',
  3, 2, 1200, 2500, 1960, 'single_family',
  37.7609, -122.4240, 'pre_market', 'c-5', 'tm-2', NOW()
);
```

---

## Part 6: UI/UX Components & Routes

### 6.1 New Route Structure

```
/listings/[id]/
├── +page.svelte          (Overview tab — unchanged)
├── activity/             (Activity tab — unchanged)
├── listing/              (NEW)
│   ├── +page.server.ts
│   ├── +page.svelte
│   └── +layout.svelte
├── tasks/                (unchanged)
└── ...
```

**Route:** `/listings/[id]/listing`

---

### 6.2 Page Component (`listing/+page.svelte`)

**Structure:**

```svelte
<script>
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  export let data;

  let listing = data.listing;
  let analysis = data.currentAnalysis;
  let schedule = data.schedule;
  let showAnalysisForm = !listing.price;
  let isRunning = false;
</script>

<div class="listing-intelligence-page">

  <!-- Price Card (or CTA if no price) -->
  {#if listing.price}
    <PriceCard {listing} {analysis} />
  {:else}
    <PricePromptCard {listing} on:run-analysis={() => showAnalysisForm = true} />
  {/if}

  <!-- Analysis Controls & Map -->
  <AnalysisSection {listing} bind:showAnalysisForm bind:isRunning />

  <!-- Market Data Map -->
  <CompMapView {listing} {analysis} />

  <!-- Comps Table & Adjustments -->
  <CompsTable comps={analysis?.comps ?? []} />

  <!-- AI Results Card -->
  {#if analysis?.status === 'completed'}
    <AnalysisResults {analysis} {listing} />
  {/if}

  <!-- History -->
  <AnalysisHistory analyses={data.analysisHistory} />

  <!-- Schedule -->
  <ScheduleSection {schedule} listing_id={listing.id} />

</div>
```

---

### 6.3 Load Function (`listing/+page.server.ts`)

```typescript
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getListingWithAnalysis, getAnalysisHistory, getSchedule } from '$lib/server/db/queries';
import { withRLS } from '$lib/server/db/index';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { id } = params;
  const userId = locals.user.id;

  const db = withRLS(userId, locals.user.role, async (db) => {
    const listing = await getListingWithAnalysis(id, db);
    if (!listing) throw error(404, 'Listing not found');

    const analyses = await getAnalysisHistory(id, db);
    const schedule = await getSchedule(id, db);

    return {
      listing,
      currentAnalysis: analyses[0] ?? null,
      analysisHistory: analyses,
      schedule
    };
  });

  return db;
};

export const actions = {
  runAnalysis: async ({ request, params, locals }) => {
    const { id } = params;
    const formData = await request.formData();
    const searchParams = {
      radius_miles: parseFloat(formData.get('radius') as string) ?? 0.5,
      date_range_days: parseInt(formData.get('date_range') as string) ?? 90,
      property_type: formData.get('property_type') as string ?? 'all',
      // ... etc
    };

    // Trigger Temporal workflow
    const client = getTemporalClient();
    const result = await client.workflow.execute(marketAnalysisWorkflow, {
      input: {
        listing_id: id,
        team_id: locals.user.team_id,
        user_id: userId,
        search_params: searchParams
      },
      taskQueue: 'default'
    });

    return { success: true, analysis: result };
  },

  setPrice: async ({ request, params, locals }) => {
    const { id } = params;
    const formData = await request.formData();
    const price = parseFloat(formData.get('price') as string);

    const db = withRLS(locals.user.id, locals.user.role, async (db) => {
      await db.update(listings)
        .set({
          price,
          price_set_date: new Date(),
          price_set_by_user_id: locals.user.id
        })
        .where(eq(listings.id, id));
    });

    return { success: true };
  },

  toggleSchedule: async ({ request, params, locals }) => {
    // Enable/disable auto-refresh
  }
};
```

---

### 6.4 Supporting Components

**PriceCard.svelte**
```svelte
<!-- Shows current price, last set date, last analysis date, confidence -->
<script>
  import { formatPrice, formatDate } from '$lib/utils';
  export let listing;
  export let analysis;
</script>

<card>
  <div class="price-display">
    <div class="price-label">LISTING PRICE</div>
    <div class="price-value">{formatPrice(listing.price)}</div>
  </div>
  <!-- ... -->
</card>
```

**AnalysisSection.svelte**
```svelte
<!-- Map, search params form, Run Analysis button -->
```

**CompMapView.svelte**
```svelte
<!-- Leaflet map: subject property + comp markers + radius slider -->
```

**CompsTable.svelte**
```svelte
<!-- Data table: address, price, $/sqft, beds, baths, sold date, distance -->
<!-- Expandable rows for adjustments -->
```

**AnalysisResults.svelte**
```svelte
<!-- Suggested price range, confidence, narrative, insights -->
```

---

## Part 7: Overview Page Enhancement

### 7.1 Mini Map on Listing Overview

**Location:** Overview tab, right panel, above "Property Details"

```
┌──────────────────────────────┐
│ Property Location            │
├──────────────────────────────┤
│                              │
│   [Leaflet Map: 300px tall]  │
│   (just the property pin)    │
│                              │
│   [View on Larger Map →]     │
│                              │
└──────────────────────────────┘
```

**Click behavior:**
- "View on Larger Map" links to `/listings/[id]/listing` (Listing tab)
- OR clicks on map itself open fullscreen Listing tab

---

## Part 8: Plan-Gating & Feature Availability

### 8.1 Plan Tiers

**Starter Plan:**
- Manual "Run Analysis" button: ✓
- View past analyses: ✓
- Auto-refresh scheduling: ✗ (disabled, "upgrade to Professional")

**Professional Plan:**
- Everything in Starter
- Auto-refresh: ✓
- Custom search radius: ✓ (Starter limited to 0.5mi)
- Multiple data sources: ✓ (Starter limited to Realty API)

**Implementation:**
```typescript
// In +page.server.ts load function
const userPlan = await getUserPlan(locals.user.id);
const canAutoRefresh = userPlan === 'professional';
const canCustomRadius = userPlan === 'professional';
const allowedSources = userPlan === 'professional'
  ? ['realty_api', 'mls']
  : ['realty_api'];
```

---

## Part 9: API Endpoints

### 9.1 New Route Handlers

**POST `/api/listings/[id]/run-market-analysis`**
- Trigger market_analysis workflow
- Returns: analysis_id and status

**GET `/api/listings/[id]/analyses`**
- List past analyses
- Query params: limit, offset

**GET `/api/listings/[id]/analyses/[analysis_id]`**
- Get full analysis details including comps

**POST `/api/listings/[id]/set-price`**
- Manually set listing price

**POST `/api/listings/[id]/schedule`**
- Enable/disable auto-refresh
- Set frequency

**PUT `/api/listings/[id]/analyses/[analysis_id]/comps/[comp_id]`**
- Update comp adjustments

---

## Part 10: Timeline & Rollout

### Phase 1: Foundation (Week 1–2)
- [ ] Add database schema (market_analyses, comp_listings, analysis_schedules)
- [ ] Create Temporal workflow skeleton
- [ ] Build Load functions for Listing tab route

### Phase 2: UI (Week 2–3)
- [ ] Build PricePromptCard, PriceCard components
- [ ] Build AnalysisSection with form
- [ ] Build CompMapView with Leaflet integration
- [ ] Build CompsTable component

### Phase 3: Integrations (Week 3–4)
- [ ] Integrate Realty API (RapidAPI)
- [ ] Implement comp search activity
- [ ] Implement AI analysis activity (Claude prompt + chain-of-thought)

### Phase 4: Testing & Polish (Week 4–5)
- [ ] End-to-end testing
- [ ] Performance optimization (caching, query limits)
- [ ] Seed data updates
- [ ] Error handling & retry logic

### Phase 5: Launch (Week 5)
- [ ] Deploy to production
- [ ] Monitor API usage & costs
- [ ] Gather user feedback

---

## Part 11: Error Handling & Resilience

### Common Failure Modes

**API Quota Exceeded:**
- Status: `partial` (show cached/previous comps if available)
- Message: "Latest market data unavailable; showing data from [date]"
- CTA: "Retry" button

**Geocoding Fails:**
- Ask user to manually enter coordinates
- Or correct address in listing form

**No Comps Found:**
- Expand search radius automatically (0.5mi → 1mi → 2mi)
- Show warning: "Widened search to [X] miles"

**Analysis Workflow Timeout:**
- Return partial results (comps found so far)
- Allow user to retry

**AI Analysis Fails:**
- Show raw comp data without narrative
- User can manually create price suggestion

---

## Part 12: Future Enhancements

1. **Draw Mode:** User can draw custom comp search area on map
2. **Batch Analysis:** Run analysis for multiple listings at once
3. **Competitor Alerts:** Notify when nearby comps sell
4. **Photo Comparison:** Side-by-side comp photos
5. **Mortgage Pre-Qualification:** Link comps to financing options
6. **Market Trends:** Charts showing price/DOM trends over time
7. **Comparative Market Analysis (CMA) PDF:** Export analysis to PDF
8. **MLS Integration:** When MLS credentials obtained, add Bridge Interactive / RESO Web API as primary data source
9. **Appraisal Prep:** Generate appraisal support document with comps

---

## Appendices

### A. Claude Prompt for AI Analysis

```
You are a real estate market analyst. Given a subject property and comparable sales,
generate a professional market analysis.

SUBJECT PROPERTY:
Address: {address}
Beds: {beds}, Baths: {baths}, Sqft: {sqft}
Current Listing Price: ${price}
Year Built: {year_built}
Property Type: {property_type}

COMPARABLE PROPERTIES (with adjustments):
{comps_table}

MARKET CONTEXT:
- Market Trend: {trend} (↗ up, ↘ down, ↔ stable)
- Avg Days on Market: {avg_dom} days
- Inventory Level: {months_supply} months

Generate:
1. SUGGESTED PRICE RANGE: low and high prices with confidence (0-100%)
2. KEY ADJUSTMENTS: summarize major price drivers from comps
3. MARKET NARRATIVE: 2-3 sentences professional analysis
4. INSIGHTS: bullet points (3-5) about market conditions and strategy
5. REASONING: explain your price recommendation (chain of thought)
```

### B. Realty API Example Requests

**Search sold comps by coordinates:**
```bash
curl -X GET "https://realty-in-us.p.rapidapi.com/properties/v3/list?\
lat=37.7609&lng=-122.4240&radius=0.5&\
status=sold&type=single_family&\
beds_min=2&beds_max=4&baths_min=1&\
sold_date_min=2026-01-14&sold_date_max=2026-04-14&\
sort=sold_date&limit=20" \
  -H "X-RapidAPI-Key: YOUR_KEY" \
  -H "X-RapidAPI-Host: realty-in-us.p.rapidapi.com"
```

**Get property detail:**
```bash
curl -X GET "https://realty-in-us.p.rapidapi.com/properties/v3/detail?\
property_id=R1234567890" \
  -H "X-RapidAPI-Key: YOUR_KEY" \
  -H "X-RapidAPI-Host: realty-in-us.p.rapidapi.com"
```

**Search active listings (market competition):**
```bash
curl -X GET "https://realty-in-us.p.rapidapi.com/properties/v3/list?\
lat=37.7609&lng=-122.4240&radius=0.5&\
status=for_sale&type=single_family&\
beds_min=2&beds_max=4&\
sort=relevant&limit=10" \
  -H "X-RapidAPI-Key: YOUR_KEY" \
  -H "X-RapidAPI-Host: realty-in-us.p.rapidapi.com"
```

### C. RESO Web API Example (for MLS integration)

```bash
# OAuth token request
POST https://api.bridgeinteractive.com/oauth/token
{
  "grant_type": "client_credentials",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}

# Property search
GET https://api.bridgeinteractive.com/v1/Property
?$filter=ListPrice gt 400000 and ListPrice lt 500000 and BedroomsTotal eq 3
&$select=ListingKey,ListPrice,BedroomsTotal,BathroomsTotalInteger,LivingArea,ListDate
&$top=20

Authorization: Bearer {token}
```

---

## Document Version History

| Date | Version | Changes |
|------|---------|---------|
| Apr 14, 2026 | 1.0 | Initial design spec, API research, full feature outline |
| Apr 14, 2026 | 1.1 | Replace generic API research with Realty API (RapidAPI) specifics; update workflow, env vars, and data sources |

---

**Next Steps:**
1. Review design spec with product team
2. Prioritize API integrations (Realty API first, MLS later)
3. Begin schema implementation and seed data updates
4. Start UI component development in parallel
5. Wire Temporal workflow activities
