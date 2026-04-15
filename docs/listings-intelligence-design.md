# Listings Intelligence Feature — Design Specification

**Date:** April 2026
**Status:** Design & Research
**Phase:** Feature specification for implementation

---

## Executive Summary

Listings Intelligence transforms HomeTrack's pricing and comp analysis capabilities by introducing a dedicated "Listing" tab in the listing detail view. This tab serves as the intelligence center for pricing decisions, market analysis, and ongoing price monitoring. The feature integrates comp data APIs to provide real-time market analysis, historical pricing suggestions, and automated refresh scheduling.

---

## Part 1: Comp Data APIs Research & Recommendations

### 1.1 Available APIs Overview

#### A. Zillow Group APIs (via RapidAPI)

**Status:** Officially available via RapidAPI
**Data Available:**
- Property details (address, beds, baths, sqft, lot size, year built)
- Sold price history
- Active listing prices
- Days on market
- Price per sqft
- Zestimate (Zillow valuation estimate)
- Property photos
- Nearby amenities

**Pricing:**
- RapidAPI pricing varies by endpoint and tier
- Typically $50–$500/month for standard access
- Enterprise pricing available

**Rate Limits:**
- Standard: 500–5,000 requests/month depending on plan
- Enterprise plans support higher volumes

**Authentication:**
- RapidAPI key (X-RapidAPI-Key header)
- Simple REST API calls

**Data Freshness:**
- Updated daily to weekly depending on MLS data feeds
- Varies by region

**Coverage:**
- Nationwide USA coverage
- Strong in major metros (Bay Area, LA, NYC, etc.)

**Endpoints:**
- `property` — Get property details by ZPID
- `search` — Search properties by location, criteria
- `agent_search` — Find agents in area
- `similar_properties` — Find comparable properties

**Pros:**
- Easiest to integrate (no licensing required)
- Nationwide coverage
- Rich data including Zestimate
- Good documentation

**Cons:**
- No official API; relies on third-party RapidAPI
- Rate limits for free/low tiers
- Pricing adds up quickly at scale

---

#### B. Bridge Interactive / RESO Web API (Official MLS)

**Status:** Official MLS standard, MLS-specific access required
**Data Available:**
- Official MLS listing data (active, pending, sold)
- Price history
- Days on market
- Property details (full IDX data)
- Photos
- Lot information
- Building/subdivision info

**Pricing:**
- No single price: varies by MLS
- Typical regional MLS: $0–$500/month
- Example: Miami Realtors MLS = $30–$100/month depending on tier

**Rate Limits:**
- MLS-specific, typically very generous for authorized users
- No per-call costs

**Authentication:**
- OAuth 2.0
- Credential required from MLS
- Must have active MLS membership or broker affiliation

**Data Freshness:**
- Real-time to daily (varies by MLS)
- Most accurate data available

**Coverage:**
- USA-wide but MLS-by-MLS
- Regional availability depends on MLS adoption

**Key Advantage:**
- Official data source, best for legal/compliance use cases
- No rate limiting concerns
- Most current and accurate

**Cons:**
- Requires MLS membership (not accessible to all users)
- Requires licensing agreement
- Setup time and compliance requirements
- Regional fragmentation (different APIs per MLS)

**Application Process:**
1. Contact your local MLS
2. Request API access / RESO Web API credentials
3. MLS approves (typically within days)
4. Receive OAuth endpoints and credentials
5. Start querying your MLS data

---

#### C. ATTOM Data API

**Status:** Enterprise property data provider
**Data Available:**
- 158M+ US property records
- Tax/assessment data
- Deed records
- Valuations (ATTOM AVM)
- Transaction history
- Mortgage data
- Foreclosure data

**Pricing:**
- Starts at $95/month
- Custom pricing for higher volumes
- Per-call pricing available
- 30-day free trial

**Rate Limits:**
- Depends on plan (typically 1–10K calls/month on starter)
- Enterprise plans unlimited

**Authentication:**
- API key (simple REST)

**Data Freshness:**
- Updated monthly to quarterly
- Not real-time

**Coverage:**
- All 158M US properties
- Nationwide

**Pros:**
- Comprehensive historical and tax data
- AVMs for valuation estimates
- Predictable pricing

**Cons:**
- Not MLS data (public records based)
- Monthly/quarterly updates only
- No photos
- More expensive than Zillow for basic use

---

#### D. RealtyAPI (Aggregated Data)

**Status:** Aggregator combining Zillow, Redfin, Realtor, Apartments.com
**Data Available:**
- Property details from multiple sources
- Sales history
- Rental comps
- Photos
- Neighborhood data

**Pricing:**
- Typically $100–$500/month depending on plan

**Rate Limits:**
- Varies by plan

**Authentication:**
- API key (REST)

**Data Freshness:**
- Aggregated, so varies by source

**Pros:**
- Single API for multiple data sources
- Good for comparison shopping

**Cons:**
- Middleman (higher latency)
- Not as accurate as direct source

---

#### E. Redfin Data

**Status:** No official API available
**Access:**
- No public API
- Third-party scraper APIs available (legal gray area)
- Redfin Scraper API available on RapidAPI (real-time scraping)

**Recommendation:** Skip Redfin direct; use Zillow or RealtyAPI instead.

---

#### F. Realtor.com API

**Status:** Limited access, tightly controlled
**Data Available:**
- Official Realtor.com listings (Move Inc.)
- MLS-sourced data
- Rich property details

**Access:**
- Requires partnership/membership
- No public API tier

**Recommendation:** Use Bridge Interactive RESO API instead for direct MLS access (better legal standing).

---

#### G. homes.com API

**Status:** No dedicated data API found (2026 research)
**Note:** homes.com does not appear to offer a public data API.

---

### 1.2 Recommended API Strategy for HomeTrack

**Tiered Approach (Best for User Flexibility):**

1. **Tier 1 (Primary): Bridge Interactive / RESO Web API**
   - **When:** User has MLS access (any licensed agent/broker)
   - **Why:** Official, most accurate, best for legal compliance
   - **Usage:** Default for professionals with MLS credentials
   - **Cost:** $0–$100/month per region (user's responsibility)

2. **Tier 2 (Fallback): Zillow API via RapidAPI**
   - **When:** No MLS access, or supplemental comp searching
   - **Why:** Nationwide, no licensing required, easy to integrate
   - **Usage:** Secondary for non-agents; supplemental for all users
   - **Cost:** $50–$200/month (shared across team)

3. **Tier 3 (Optional): ATTOM Data**
   - **When:** Need historical transaction data, tax records, AVMs
   - **Why:** Comprehensive public records data
   - **Usage:** Valuation estimates, historical comps
   - **Cost:** $95+/month (optional premium tier)

**Implementation Approach:**
- Start with Zillow API (easiest, no licensing)
- Add RESO Web API support when users authenticate their MLS
- Offer ATTOM as opt-in premium feature

---

### 1.3 API Integration Architecture

**Database Storage for Comp Data:**

```sql
-- Store external API source info
comp_listings (
  id (UUID)
  market_analysis_id (FK)
  source ('zillow' | 'mls' | 'attom' | 'redfin_scraper')
  external_id (string) -- ZPID, MLS#, etc.
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
  api_source ('zillow' | 'mls' | 'attom')
  calls_made
  timestamp
)

-- Store user's API credentials
integrations (
  id (UUID)
  team_id (FK)
  type ('reso_web_api' | 'zillow_rapidapi' | 'attom')
  credentials (encrypted JSONB)
  status ('connected' | 'disconnected' | 'error')
  last_sync
  created_at, updated_at
)
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
│  ☑ Zillow  ☑ MLS (if connected)  ☐ ATTOM   │
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
│ Analysis Failed: API Error (Zillow timeout)   │
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
   - If lat/lng missing, use Nominatim or Google Geocoding
   - Store coordinates in listings table

3. Search for Comps
   - Query selected APIs (Zillow, MLS, ATTOM)
   - Params: lat, lng, radius, date_range, property_type, beds, baths, status
   - Collect: address, price, beds, baths, sqft, sold_date, days_on_market, lat, lng, photos

4. Filter & Rank Comps
   - Remove outliers (price, sqft)
   - Score comps by relevance (similarity to subject)
   - Keep top 8–15 comps

5. Calculate Metrics
   - price_per_sqft for each comp
   - distance from subject property
   - days on market average
   - price trend (rising/falling)

6. AI Analysis (Claude)
   - Prompt: Subject property details + comp list + adjustments
   - Generate: suggested price range, confidence score, reasoning, market narrative
   - Use chain-of-thought reasoning

7. Store Results
   - Create market_analyses record with status 'completed'
   - Insert comp_listings rows (one per comp)
   - Store ai_narrative and suggested_price_range

8. Notify User
   - Update UI with results
   - Fire activity_item for audit trail
   - Optional: Send email notification

9. Handle Errors
   - API quota exceeded → status 'partial' (use cached comps)
   - API failure → status 'failed' with error message
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
      api_sources?: string[]      // 'zillow', 'mls', 'attom'
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
  source TEXT NOT NULL CHECK (source IN ('zillow', 'mls', 'attom', 'redfin_scraper')),
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
- ATTOM data source: ✓ (Starter limited to Zillow/MLS)

**Implementation:**
```typescript
// In +page.server.ts load function
const userPlan = await getUserPlan(locals.user.id);
const canAutoRefresh = userPlan === 'professional';
const canCustomRadius = userPlan === 'professional';
const allowedSources = userPlan === 'professional'
  ? ['zillow', 'mls', 'attom']
  : ['zillow', 'mls'];
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
- [ ] Integrate Zillow API (RapidAPI)
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
8. **MLS Integration:** When user connects MLS, use official RESO Web API
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

### B. Zillow API Example Request

```bash
curl -X GET "https://zillow56.p.rapidapi.com/search?location=San%20Francisco%2C%20CA&home_type=Houses&beds_min=2&beds_max=4&baths_min=1.5&status=all&sort=recent" \
  -H "x-rapidapi-key: YOUR_KEY" \
  -H "x-rapidapi-host: zillow56.p.rapidapi.com"
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

---

**Next Steps:**
1. Review design spec with product team
2. Prioritize API integrations (Zillow first, MLS later)
3. Begin schema implementation and seed data updates
4. Start UI component development in parallel
5. Wire Temporal workflow activities
