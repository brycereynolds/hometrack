# Properties Schema Design — HomeTrack

**Date:** April 15, 2026
**Status:** Design specification for implementation
**Scope:** Comprehensive property data model separating universal property records from listing engagements

---

## Executive Summary

Currently, the `listings` table conflates two distinct concepts:

1. **Properties** = physical real estate (immutable: address, beds, baths, sqft, year built, coordinates)
2. **Listings** = our team's engagement with a property (mutable: phase, price, agent, tasks)

This design separates these concerns into a unified property registry (`properties`) that multiple tables can reference (listings, comp_listings, external_listings, etc.). This enables:

- **Deduplication**: Same property referenced from multiple sources (our listing, comp, external intel) shares one record
- **Data richness**: Centralized Zillow/Redfin data, photos, tax records enriched once for all uses
- **Scalability**: Buyer matching, market tracking, and property discovery without duplicating core property data
- **Audit trail**: Property data sources and sync timestamps tracked separately from business logic

---

## Part 1: Core Schema Design

### 1.1 — `properties` Table

The universal property record. One row per physical property, keyed by location (address components) with external service IDs.

**Implementation:** `app/src/lib/server/db/schema/property.ts`
**Migration:** `app/drizzle/0005_green_lenny_balinger.sql`

```sql
CREATE TABLE properties (
  -- Primary key & identity
  id TEXT PRIMARY KEY,

  -- Address (uniqueness constraint via composite index)
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  county TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,

  -- Core structural data
  beds INTEGER,
  baths REAL,
  baths_full INTEGER,             -- Zillow: resoFacts.bathroomsFull
  baths_half INTEGER,             -- Zillow: resoFacts.bathroomsHalf
  sqft INTEGER,                   -- Zillow: livingArea
  lot_sqft INTEGER,               -- Zillow: lotAreaValue
  lot_size_acres REAL,            -- Computed from lot_sqft or parsed from lotSize string
  year_built INTEGER,
  property_type TEXT,             -- Zillow: homeType (SINGLE_FAMILY, CONDO, etc.)
  stories INTEGER,                -- Zillow: resoFacts.stories
  architectural_style TEXT,       -- Zillow: resoFacts.architecturalStyle

  -- Construction & structure
  construction_materials JSONB,   -- Zillow: resoFacts.constructionMaterials ["wood frame"]
  roof TEXT,                      -- Zillow: resoFacts.roofType
  foundation JSONB,               -- Zillow: resoFacts.foundationDetails
  basement TEXT,                  -- Zillow: resoFacts.basement ("None", "Finished")
  attic TEXT,                     -- Zillow: resoFacts.attic

  -- Features — SINGLE JSONB blob (NO separate boolean flags)
  -- Contains ALL property features for flexible filtering via GIN index:
  -- {
  --   pool: true, garage: true, fireplace: true, spa: false,
  --   heating: ["Forced air", "Gas"], cooling: ["Central"],
  --   appliances: ["Dishwasher", "Microwave", ...],
  --   flooring: ["Hardwood", "Slate"],
  --   interiorFeatures: [...], exteriorFeatures: [...],
  --   buildingFeatures: [...], communityFeatures: [...],
  --   securityFeatures: [...], fireplaceFeatures: [...],
  --   poolFeatures: [...], spaFeatures: [...],
  --   fencing: "...", greenFeatures: {...}
  -- }
  features JSONB,

  -- Parking
  parking_spaces INTEGER,         -- Zillow: resoFacts.parkingCapacity
  garage_spaces INTEGER,          -- Zillow: resoFacts.garageParkingCapacity
  parking_features JSONB,         -- Zillow: resoFacts.parkingFeatures

  -- Lot
  lot_features JSONB,             -- Zillow: resoFacts.lotFeatures

  -- Rooms
  rooms_count INTEGER,
  rooms JSONB,                    -- Zillow: resoFacts.rooms [{roomType, ...}]

  -- Tax data
  tax_assessed_value REAL,        -- From taxHistory most recent entry
  tax_annual_amount REAL,
  tax_year INTEGER,
  parcel_number TEXT UNIQUE,      -- Zillow: resoFacts.parcelNumber

  -- HOA
  hoa_fee REAL,                   -- Zillow: monthlyHoaFee or resoFacts.hoaFee
  hoa_fee_frequency TEXT,         -- "monthly", "annual"

  -- Utilities
  sewer TEXT,                     -- Zillow: resoFacts.sewer
  water_source TEXT,              -- Zillow: resoFacts.waterSource
  electric TEXT,
  gas TEXT,

  -- Schools
  nearby_schools JSONB,           -- Zillow: schools array [{name, type, level, distance, rating, grades}]
  elementary_school TEXT,         -- Zillow: resoFacts.elementarySchool
  elementary_school_district TEXT,
  middle_school TEXT,             -- Zillow: resoFacts.middleOrJuniorSchool
  middle_school_district TEXT,
  high_school TEXT,               -- Zillow: resoFacts.highSchool
  high_school_district TEXT,

  -- Neighborhood / scores
  neighborhood TEXT,              -- Zillow: neighborhoodRegion.name
  walkability_score INTEGER,      -- Third-party (Walk Score API)
  transit_score INTEGER,
  bike_score INTEGER,

  -- Photos (array of {url, source, caption} from Zillow/Redfin)
  photos JSONB DEFAULT '[]'::JSONB,

  -- Financial history
  last_sold_price REAL,           -- Zillow: lastSoldPrice
  last_sold_date TIMESTAMP,
  zestimate REAL,                 -- Zillow: zestimate
  rent_zestimate REAL,            -- Zillow: rentZestimate
  price_history JSONB,            -- Zillow: priceHistory [{date, event, price, source}]
  tax_history JSONB,              -- Zillow: taxHistory [{year, taxAmount, value}]

  -- External service IDs (unique for deduplication)
  zillow_id BIGINT UNIQUE,        -- Zillow: zpid
  redfin_id TEXT UNIQUE,
  mls_id TEXT UNIQUE,

  -- Source-specific raw data blobs (trimmed API responses for reference)
  zillow_data JSONB,              -- Trimmed Zillow response (zestimate, description, engagement, etc.)
  zillow_url TEXT,
  redfin_data JSONB,              -- Raw Redfin data when we add it
  redfin_url TEXT,

  -- Computed metadata
  last_synced_at TIMESTAMP,
  data_completeness_score REAL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_address UNIQUE (address, city, state, zip),
  CONSTRAINT valid_coords CHECK (lat IS NOT NULL AND lng IS NOT NULL),
  CONSTRAINT valid_year_built CHECK (year_built IS NULL OR year_built > 1800),
);

CREATE INDEX properties_address_idx ON properties(address, city, state);
CREATE INDEX properties_zip_idx ON properties(zip);
CREATE INDEX properties_coords_idx ON properties(lat, lng);
CREATE INDEX properties_beds_baths_idx ON properties(beds, baths);
CREATE INDEX properties_property_type_idx ON properties(property_type);
CREATE INDEX properties_year_built_idx ON properties(year_built);
CREATE INDEX properties_has_pool_idx ON properties(has_pool);
CREATE INDEX properties_has_garage_idx ON properties(has_garage);
CREATE INDEX properties_zillow_id_idx ON properties(zillow_id);
CREATE INDEX properties_redfin_id_idx ON properties(redfin_id);
CREATE INDEX properties_mls_id_idx ON properties(mls_id);
```

**Key Design Decisions:**

- **Deduplication**: `UNIQUE (address, city, state, zip)` prevents duplicate property records
- **External IDs**: `zillow_id`, `redfin_id`, `mls_id` are individually unique, enabling lookup by any source
- **Features as single JSONB**: All boolean features (pool, garage, fireplace, etc.) and array features (appliances, flooring, heating) are stored in ONE `features` JSONB column with a GIN index for fast filtering — NOT separate boolean flags. This is more flexible, avoids column sprawl, and supports arbitrary feature queries via `features @> '{"pool": true}'`
- **Source-specific data blobs**: `zillow_data` and `redfin_data` store trimmed raw API responses for reference, while structured fields are extracted into proper columns
- **Photos on BOTH property and listing**: `properties.photos` stores source photos from Zillow/Redfin; `listings.photos` stores agent-curated photos for the active listing
- **Zillow field mapping**: All relevant Zillow fields from `resoFacts` are mapped — see `docs/zillow-data-mapping.md` for the complete field inventory
- **Completeness score**: Tracks how much data has been backfilled (0–100)
- **Photos as JSONB**: Array of `{url, source, caption}` for gallery display

---

### 1.2 — `listings` Table (Modified)

Represents our team's engagement with a property. **Data move-out**: Property facts now live in `properties`.

```sql
CREATE TABLE listings (
  id TEXT PRIMARY KEY,

  -- Link to property record (NEW FK)
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,

  -- Team & assignment
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,

  -- Listing-specific data (STAYS HERE)
  price REAL,  -- OUR listing price, not market price
  phase listing_phase NOT NULL DEFAULT 'pre_market',
  mls_number TEXT,

  -- Agent-authored data
  description TEXT,  -- Agent's custom listing description
  features JSONB,    -- Agent's curated feature highlights (subset of property features)

  -- Status tracking
  under_contract BOOLEAN DEFAULT false,
  phase_entered_at TIMESTAMP,
  days_in_phase INTEGER DEFAULT 0,
  days_on_market INTEGER DEFAULT 0,

  -- Key dates
  list_date TIMESTAMP,
  target_list_date TIMESTAMP,
  listing_agreement_date TIMESTAMP,
  close_date TIMESTAMP,
  canceled_at TIMESTAMP,
  cancel_reason TEXT,

  -- Portal & performance
  portal_settings JSONB,
  zillow_views INTEGER DEFAULT 0,
  zillow_saves INTEGER DEFAULT 0,

  -- Activity counters
  tasks_done INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  documents_count INTEGER DEFAULT 0,
  showings_count INTEGER DEFAULT 0,
  offers_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_price CHECK (price IS NULL OR price > 0),
  CONSTRAINT valid_mls_unique UNIQUE (team_id, mls_number)
    WHERE mls_number IS NOT NULL,
);

CREATE INDEX listings_property_id_idx ON listings(property_id);
CREATE INDEX listings_team_id_idx ON listings(team_id);
CREATE INDEX listings_team_phase_idx ON listings(team_id, phase);
CREATE INDEX listings_agent_id_idx ON listings(agent_id);
CREATE INDEX listings_client_id_idx ON listings(client_id);
CREATE INDEX listings_mls_number_idx ON listings(mls_number);
CREATE INDEX listings_phase_entered_at_idx ON listings(phase_entered_at);
```

**What Moved Out:**
- ❌ `address`, `city`, `state`, `zip` → use `property_id` to join properties
- ❌ `beds`, `baths`, `sqft`, `lot_sqft`, `year_built` → now in properties
- ❌ `lat`, `lng` → now in properties
- ❌ `property_type` → now in properties
- ❌ `photos` → now in properties
- ❌ `photo_url` → now in properties

**What Stays:**
- ✅ `price` (OUR listing price), `phase`, `mls_number`, `agent_id`, `client_id`
- ✅ `description` (agent's listing description)
- ✅ `features` (agent-curated highlights)
- ✅ Task/showing/offer counters
- ✅ Portal settings

---

### 1.3 — `comp_listings` Table (Modified)

Links a comp property to a market analysis, with comp-specific metadata.

```sql
CREATE TABLE comp_listings (
  id TEXT PRIMARY KEY,

  -- Link to property record (NEW FK)
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,

  -- Which analysis this comp belongs to
  market_analysis_id TEXT NOT NULL
    REFERENCES market_analyses(id) ON DELETE CASCADE,

  -- Comp-specific data
  source TEXT NOT NULL,  -- 'realty_api', 'mls', 'manual'
  external_id TEXT,      -- property_id from Realty API, MLS# from RESO

  -- Sale/listing data (comp-specific, may differ from current market)
  price REAL,            -- Sale price or list price
  price_per_sqft REAL,
  sold_date TIMESTAMP,
  list_date TIMESTAMP,
  days_on_market INTEGER,
  status TEXT,           -- 'sold', 'active', 'pending'

  -- Relativity to subject property
  distance_miles REAL,
  lat REAL,              -- Coord snapshot at time of analysis
  lng REAL,

  -- Comp analysis data
  photo_url TEXT,        -- Primary photo snapshot
  adjustments JSONB,     -- [{factor: 'beds', value: 25000, reason: '+1 bed'}, ...]
  adjusted_price REAL,   -- Calculated: price +/- adjustments
  confidence_score REAL, -- 0–1, how comparable this is

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_distance CHECK (distance_miles >= 0),
);

CREATE INDEX comp_listings_property_id_idx ON comp_listings(property_id);
CREATE INDEX comp_listings_analysis_id_idx ON comp_listings(market_analysis_id);
CREATE INDEX comp_listings_source_idx ON comp_listings(source);
CREATE INDEX comp_listings_sold_date_idx ON comp_listings(sold_date);
```

**What Changed:**
- ✅ **NEW**: `property_id` FK → properties (deduplicates property data)
- ✅ Retains comp-specific fields: `price`, `sold_date`, `distance_miles`, `adjustments`
- ❌ Removes redundant fields: `address`, `city`, `state`, `zip`, `beds`, `baths`, `sqft`, `lot_sqft`, `year_built` → join to properties

---

### 1.4 — `external_listings` Table (New)

Tracks properties mentioned by other agents, market intel findings, or client requests. These are leads or references that may or may not become our listings.

```sql
CREATE TABLE external_listings (
  id TEXT PRIMARY KEY,

  -- Link to property record
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,

  -- Team context
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Source metadata
  source TEXT NOT NULL,  -- 'agent_mention', 'market_scan', 'client_request'
  mentioned_by TEXT,     -- Agent name, contact name, or system identifier
  source_url TEXT,       -- Link to original listing

  -- Market data snapshot
  listed_price REAL,
  listed_date TIMESTAMP,
  status TEXT,           -- 'active', 'pending', 'sold', 'expired', 'withdrawn'

  -- Listing agent (external)
  listing_agent_name TEXT,
  listing_agent_email TEXT,
  listing_agent_phone TEXT,
  listing_agent_company TEXT,

  -- Relevance & notes
  relevance_to TEXT,     -- Which of our clients/segments might be interested
  notes TEXT,            -- Why this property was flagged
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_external_id UNIQUE (team_id, property_id, source)
    WHERE is_active = true,
);

CREATE INDEX external_listings_property_id_idx ON external_listings(property_id);
CREATE INDEX external_listings_team_id_idx ON external_listings(team_id);
CREATE INDEX external_listings_source_idx ON external_listings(source);
CREATE INDEX external_listings_is_active_idx ON external_listings(is_active);
CREATE INDEX external_listings_status_idx ON external_listings(status);
```

**Purpose:**
- Market intelligence: "Competitor sold similar property for $X"
- Client opportunities: "Found a property matching your criteria"
- Referrals: "Other agent mentioned this property"

---

### 1.5 — `buyer_preferences` Table (New or Extend `contacts`)

Captures structured buyer criteria for matching to properties.

**Option A: New table (recommended for flexibility)**

```sql
CREATE TABLE buyer_preferences (
  id TEXT PRIMARY KEY,

  -- Link to contact
  contact_id TEXT NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,

  -- Buyer status
  looking_for_type TEXT NOT NULL,  -- 'buy', 'sell', 'both'
  is_active BOOLEAN DEFAULT true,

  -- Bedroom criteria
  preferred_beds_min INTEGER,
  preferred_beds_max INTEGER,

  -- Bathroom criteria
  preferred_baths_min REAL,
  preferred_baths_max REAL,

  -- Size criteria
  preferred_sqft_min INTEGER,
  preferred_sqft_max INTEGER,
  preferred_lot_sqft_min INTEGER,
  preferred_lot_sqft_max INTEGER,

  -- Price criteria
  preferred_price_min REAL,
  preferred_price_max REAL,

  -- Location criteria
  -- ['San Jose', 'Cupertino', 'Mountain View']
  preferred_areas JSONB,

  -- Property type preference
  -- ['single_family', 'condo', 'townhome']
  preferred_property_types JSONB,

  -- Feature preferences
  -- [{feature: 'pool', required: true}, {feature: 'garage', required: false}]
  preferred_features JSONB,

  -- Flexible criteria
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
);

CREATE INDEX buyer_preferences_contact_id_idx ON buyer_preferences(contact_id);
CREATE INDEX buyer_preferences_looking_for_type_idx ON buyer_preferences(looking_for_type);
CREATE INDEX buyer_preferences_is_active_idx ON buyer_preferences(is_active);
```

**Option B: Extend `contacts` (simpler, fewer joins)**

Add columns directly to the contacts table:

```sql
ALTER TABLE contacts ADD COLUMN (
  looking_for_type TEXT,  -- 'buy', 'sell', 'both'
  preferred_beds_min INTEGER,
  preferred_beds_max INTEGER,
  preferred_baths_min REAL,
  preferred_baths_max REAL,
  preferred_sqft_min INTEGER,
  preferred_sqft_max INTEGER,
  preferred_price_min REAL,
  preferred_price_max REAL,
  preferred_areas JSONB,       -- ['San Jose', 'Cupertino']
  preferred_property_types JSONB, -- ['single_family', 'condo']
  preferred_features JSONB,    -- [{feature: 'pool', required: true}]
);
```

**Recommendation**: Start with Option B (extend contacts) for simplicity. If buyer criteria becomes complex (multiple searches, saved filters, historical preferences), migrate to Option A later.

---

## Part 2: Relationships & Diagramming

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        PROPERTIES                            │
│  (Universal property registry)                               │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ address, city, state, zip, lat, lng                         │
│ beds, baths, sqft, lot_sqft, year_built, property_type     │
│ zillow_id, redfin_id, mls_id                               │
│ zillow_data, redfin_data, photos                           │
│ tax_assessed_value, parcel_number                           │
│ created_at, updated_at                                      │
└─────────────────────────────────────────────────────────────┘
          ▲                    ▲                     ▲
          │                    │                     │
          │                    │                     │
   (1:1)  │            (1:N)   │              (1:N)  │
          │                    │                     │
   ┌──────┴──────┐     ┌──────┴──────┐     ┌────────┴────────┐
   │             │     │             │     │                 │
┌──┴────────────┴─┐ ┌──┴────────────┴─┐ ┌──┴────────────────┴─┐
│    LISTINGS     │ │ COMP_LISTINGS   │ │ EXTERNAL_LISTINGS  │
│                 │ │                 │ │                    │
│ property_id FK  │ │ property_id FK  │ │ property_id FK     │
│ team_id FK      │ │ market_analysis │ │ team_id FK         │
│ agent_id FK     │ │   _id FK        │ │ source             │
│ client_id FK    │ │ source          │ │ listed_price       │
│ price (ours)    │ │ price (sale)    │ │ status             │
│ phase           │ │ sold_date       │ │ listed_agent       │
│ description     │ │ distance_miles  │ │ relevance_to       │
│ features        │ │ adjustments     │ │ notes              │
│ mls_number      │ │ confidence      │ │ is_active          │
│ tasks_*         │ │                 │ │                    │
│ showings_*      │ │                 │ │                    │
└─────────────────┘ └─────────────────┘ └────────────────────┘
          │
          │ (1:N)
          ▼
┌─────────────────────┐
│    MARKET_ANALYSES  │
│   (existing table)  │
└─────────────────────┘
```

### Drizzle Relations

```typescript
// properties.ts
export const propertiesRelations = relations(properties, ({ many }) => ({
  listings: many(listings),
  compListings: many(compListings),
  externalListings: many(externalListings),
}));

// listings.ts (modified)
export const listingsRelations = relations(listings, ({ one }) => ({
  property: one(properties, {
    fields: [listings.propertyId],
    references: [properties.id],
  }),
  team: one(teams, {
    fields: [listings.teamId],
    references: [teams.id],
  }),
  agent: one(teamMembers, {
    fields: [listings.agentId],
    references: [teamMembers.id],
  }),
  client: one(contacts, {
    fields: [listings.clientId],
    references: [contacts.id],
  }),
}));

// market-analysis.ts (comp_listings modified)
export const compListingsRelations = relations(compListings, ({ one }) => ({
  property: one(properties, {
    fields: [compListings.propertyId],
    references: [properties.id],
  }),
  marketAnalysis: one(marketAnalyses, {
    fields: [compListings.marketAnalysisId],
    references: [marketAnalyses.id],
  }),
}));

// external-listings.ts (new)
export const externalListingsRelations = relations(externalListings, ({ one }) => ({
  property: one(properties, {
    fields: [externalListings.propertyId],
    references: [properties.id],
  }),
  team: one(teams, {
    fields: [externalListings.teamId],
    references: [teams.id],
  }),
}));
```

---

## Part 3: Migration Strategy

### Phase 1: Setup (Week 1)

1. **Create `properties` table** (new)
2. **Backfill from `listings`** (data migration)
   - For each listing, extract: address, city, state, zip, beds, baths, sqft, lat, lng, etc.
   - Generate unique `id` for each property (based on address)
   - Insert into properties
   - Log mapping of listing.id → property.id
3. **Verify**: All listings map to properties

---

### Phase 2: Listings Table Evolution (Week 1–2)

1. **Add `property_id` FK column** to listings (nullable initially)
2. **Populate `property_id`** from mapping created in Phase 1
3. **Make `property_id` NOT NULL**
4. **Add `NOT NULL` constraints** to verify all listings have properties
5. **Create indexes** on new FK
6. **Backward compatibility**: Keep old columns temporarily (address, city, state, zip, beds, baths, sqft, etc.)
   - Mark as "deprecated" in code comments
   - Queries can still read, but writes should use property_id

---

### Phase 3: Comp Listings Evolution (Week 2)

1. **Add `property_id` FK column** to comp_listings (nullable initially)
2. **Backfill**: For each comp_listing, search properties by address/coords
   - If property exists: link property_id
   - If property doesn't exist: create it (from comp data)
3. **Make `property_id` NOT NULL**
4. **Keep old columns** temporarily for backward compat
5. **Create indexes**

---

### Phase 4: External Listings (Week 2–3)

1. **Create `external_listings` table**
2. **Create `buyer_preferences` table** or extend contacts

---

### Phase 5: Cleanup & Sunset Old Columns (Week 3–4)

1. **Update all queries** to join through property_id instead of reading old columns
2. **Deprecation period**: Log warnings when old columns are accessed
3. **After 2–4 weeks** of no reads: Drop old columns from listings/comp_listings
   - `address`, `city`, `state`, `zip`, `beds`, `baths`, `sqft`, `lot_sqft`, `year_built`, `property_type`, `lat`, `lng`, `photos`, `photo_url`

---

## Part 4: Data Mapping — Zillow Example

The Zillow API response for `809 Midvale Ln, San Jose, CA 95136` maps to the schema as follows:

### Properties Table

```json
{
  "id": "property-810-midvale-sj",
  "address": "809 Midvale Ln",
  "city": "San Jose",
  "state": "CA",
  "zip": "95136",
  "lat": 37.3046,
  "lng": -121.8347,

  "beds": 5,
  "baths": 3,
  "sqft": 2112,
  "lot_sqft": 6969,
  "year_built": 1965,
  "property_type": "SingleFamily",
  "stories": 1,
  "parking_spaces": 0,

  "has_pool": false,
  "has_garage": false,
  "has_fireplace": true,
  "has_spa": false,

  "features": {
    "appliances": ["Dishwasher", "Dryer", "Freezer", "Garbage disposal", "Microwave", "Range/Oven", "Refrigerator", "Trash compactor", "Washer"],
    "flooring": ["Hardwood", "Slate"],
    "exterior": ["Stucco", "Composition"],
    "heating": ["Forced air", "Gas"],
    "cooling": ["Central"],
    "parking": ["Garage - Attached", "Off-street", "On-street"],
    "construction_material": ["wood frame"],
    "structure_type": "Craftsman",
    "building_features": ["L-Shaped"],
    "rooms": ["BreakfastNook", "DiningRoom", "FamilyRoom", "LaundryRoom", "MasterBath", "MudRoom", "Office", "Pantry", "RecreationRoom", "Workshop"]
  },

  "tax_assessed_value": 974886,
  "tax_annual_amount": 13233,
  "tax_year": 2025,
  "parcel_number": "45926006",

  "zillow_id": 19703350,
  "zillow_data": {
    "zestimate": 1701400,
    "rent_zestimate": null,
    "price_per_sqft": 806,
    "description": "5 bed, 3 bath home in San Jose..."
  },
  "zillow_url": "https://www.zillow.com/homedetails/19703350_zpid/",
  "zillow_last_synced": "2026-04-15T14:30:00Z",

  "elementary_school": "Terrell Elementary",
  "elementary_school_district": "San Jose Unified",
  "middle_school": "John Muir Middle",
  "middle_school_district": "San Jose Unified",
  "high_school": "Gunderson High",
  "high_school_district": "San Jose Unified",

  "photos": [],  // Zillow media[] is empty in this example

  "created_at": "2026-04-15T14:30:00Z",
  "updated_at": "2026-04-15T14:30:00Z"
}
```

### Zillow Fields → Properties Mapping

| Zillow Field | Properties Column | Notes |
|--------------|-------------------|-------|
| `propertyDetails.streetAddress` | `address` | |
| `propertyDetails.city` | `city` | |
| `propertyDetails.state` | `state` | |
| `propertyDetails.zipcode` | `zip` | |
| `address.coordinate.lat/lon` | `lat`, `lng` | Zillow uses `lon`, map to `lng` |
| `propertyDetails.resoFacts.bedrooms` | `beds` | |
| `propertyDetails.resoFacts.bathrooms` | `baths` | (bathrooms: 3, bathroomsFloat: 3) |
| `propertyDetails.resoFacts.aboveGradeFinishedArea` or `livingAreaValue` | `sqft` | Use `livingAreaValue: 2112` |
| `propertyDetails.resoFacts.lotSize` | `lot_sqft` | Parse "6,969 sqft" → 6969 |
| `propertyDetails.resoFacts.yearBuilt` | `year_built` | |
| `propertyDetails.homeType` | `property_type` | Map "SingleFamily" |
| `propertyDetails.resoFacts.storiesTotal` | `stories` | |
| `propertyDetails.resoFacts.parkingCapacity` | `parking_spaces` | |
| `propertyDetails.resoFacts.hasPrivatePool` | `has_pool` | |
| `propertyDetails.resoFacts.hasGarage` | `has_garage` | |
| `propertyDetails.resoFacts.hasFireplace` | `has_fireplace` | |
| `propertyDetails.resoFacts.hasSpa` | `has_spa` | |
| `propertyDetails.resoFacts.appliances[]` | `features.appliances` | Array → JSON |
| `propertyDetails.resoFacts.flooring[]` | `features.flooring` | Array → JSON |
| `propertyDetails.resoFacts.exterior[]` | `features.exterior` | Array → JSON |
| `propertyDetails.resoFacts.heating[]` | `features.heating` | Array → JSON |
| `propertyDetails.resoFacts.cooling[]` | `features.cooling` | Array → JSON |
| `propertyDetails.resoFacts.parkingFeatures[]` | `features.parking` | Array → JSON |
| `propertyDetails.resoFacts.constructionMaterials[]` | `features.construction_material` | Array → JSON |
| `propertyDetails.resoFacts.structureType` | `features.structure_type` | |
| `propertyDetails.resoFacts.buildingFeatures[]` | `features.building_features` | Array → JSON |
| `propertyDetails.resoFacts.rooms[]` (roomType) | `features.rooms` | Array of room types → JSON |
| `propertyDetails.resoFacts.taxAssessedValue` | `tax_assessed_value` | |
| `propertyDetails.resoFacts.taxAnnualAmount` | `tax_annual_amount` | |
| `propertyDetails.zpid` | `zillow_id` | |
| `propertyDetails.price` | N/A | This is NOT stored (it's market price, not our listing price) |
| `propertyDetails.pricePerSquareFoot` | `zillow_data.price_per_sqft` | |
| `propertyDetails.resoFacts.elementarySchool` | `elementary_school` | |
| `propertyDetails.resoFacts.elementarySchoolDistrict` | `elementary_school_district` | |
| `propertyDetails.resoFacts.middleOrJuniorSchool` | `middle_school` | |
| `propertyDetails.resoFacts.middleOrJuniorSchoolDistrict` | `middle_school_district` | |
| `propertyDetails.resoFacts.highSchool` | `high_school` | |
| `propertyDetails.resoFacts.highSchoolDistrict` | `high_school_district` | |
| `propertyDetails.resoFacts.parcelNumber` | `parcel_number` | |
| `collections.modules[].propertyDetails[].miniCardPhotos[]` | `photos[].url` | Similar homes photos if available |

---

## Part 5: Property Lookup & Enrichment Workflow

### Scenario: New Listing Created

```
User creates listing: "809 Midvale Ln, San Jose, CA 95136"
        ↓
[Lookup] Search properties table for (address, city, state, zip)
        ↓
        ├─ FOUND: Property exists
        │  ├─ Link listing.property_id → property.id
        │  └─ Use existing property data (beds, baths, sqft, photos, etc.)
        │
        └─ NOT FOUND: Property doesn't exist
           ├─ Create new property record (minimal: address, city, state, zip, lat, lng)
           ├─ Queue background job: "Enrich property with Zillow data"
           │  ├─ Call Zillow API with address
           │  ├─ Extract: beds, baths, sqft, features, tax data, school info, etc.
           │  ├─ Update properties record
           │  └─ Set zillow_last_synced = NOW()
           └─ Link listing.property_id → new property.id
```

### Code Pattern (TypeScript)

```typescript
// services/propertyService.ts

async function ensureProperty(address: string, city: string, state: string, zip: string) {
  // Step 1: Try to find existing property
  const existing = await db.query.properties
    .findFirst({
      where: and(
        eq(properties.address, address),
        eq(properties.city, city),
        eq(properties.state, state),
        eq(properties.zip, zip)
      ),
    });

  if (existing) {
    return existing;
  }

  // Step 2: Create new property (minimal data)
  const { lat, lng } = await geocode(address, city, state, zip);
  const newProperty = await db.insert(properties).values({
    id: generateId('property'),
    address,
    city,
    state,
    zip,
    lat,
    lng,
  }).returning();

  // Step 3: Queue enrichment (Zillow, Redfin, etc.)
  await queueJob('enrich-property', {
    propertyId: newProperty.id,
    address,
    city,
    state,
    zip,
  });

  return newProperty[0];
}
```

---

## Part 6: Buyer Matching Concept

### High-Level Flow

```
BUYER: "Looking for 4-5 beds, $1.2M-$1.5M, Cupertino area"
   ↓
[Store in buyer_preferences or contacts]
   ├─ preferred_beds_min: 4
   ├─ preferred_beds_max: 5
   ├─ preferred_price_min: 1200000
   ├─ preferred_price_max: 1500000
   ├─ preferred_areas: ['Cupertino', 'Sunnyvale']
   ├─ preferred_property_types: ['single_family']
   └─ preferred_features: [{feature: 'pool'}, {feature: 'garage'}]

NEW PROPERTY ADDED: "809 Midvale Ln, San Jose"
   ↓
[Run matching query]
   ├─ property.beds (5) MATCHES buyer.beds (4-5) ✓
   ├─ property.price (1.7M) DOES NOT MATCH buyer.price (1.2M-1.5M) ✗
   ├─ property.city (San Jose) DOES NOT MATCH buyer.areas (Cupertino) ✗
   └─ property.has_pool (false) DOES NOT MATCH buyer feature ✗

RESULT: Not matched to this buyer
```

### Matching Query (Pseudo-SQL)

```sql
SELECT b.*, p.*
FROM buyer_preferences b
JOIN contacts c ON b.contact_id = c.id
CROSS JOIN properties p
WHERE
  -- Bedroom match
  p.beds >= b.preferred_beds_min
  AND (b.preferred_beds_max IS NULL OR p.beds <= b.preferred_beds_max)

  -- Price match
  AND p.NOT IN (SELECT id FROM listings) -- Not already listed
  AND p.city = ANY(b.preferred_areas::TEXT[])

  -- Feature match
  AND (
    b.preferred_features IS NULL
    OR (b.preferred_features @> '[{"feature": "pool"}]' AND p.has_pool)
    OR (b.preferred_features @> '[{"feature": "garage"}]' AND p.has_garage)
  )

ORDER BY distance_miles ASC;
```

---

## Part 7: Query Examples

### Find All Listings for a Team (Join Pattern)

```typescript
const listings = await db.query.listings.findMany({
  where: eq(listings.teamId, 'team-123'),
  with: {
    property: true,  // Include full property data
    agent: true,
    client: true,
  },
});

// Use data:
listings.forEach(l => {
  console.log(`${l.property.address} — ${l.property.beds}bd/${l.property.baths}ba — Price: $${l.price}`);
});
```

### Find Comps for a Listing

```typescript
const comps = await db.query.compListings.findMany({
  where: eq(compListings.marketAnalysisId, 'analysis-456'),
  with: {
    property: true,  // Get property details
  },
});

// Use data:
comps.forEach(c => {
  console.log(`${c.property.address} — Sold: $${c.price} (${c.distance_miles} mi away)`);
});
```

### Find Properties Matching Buyer Criteria

```typescript
const matches = await db.query.properties.findMany({
  where: and(
    gte(properties.beds, buyerMinBeds),
    lte(properties.beds, buyerMaxBeds),
    gte(properties.price_assessed_value, buyerMinPrice * 0.8), // Rough estimate
    inArray(properties.city, buyerCities),
    eq(properties.has_pool, true), // If buyer requires pool
  ),
});
```

### Backfill Zillow Data

```typescript
async function backfillZillowData(propertyId: string) {
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
  });

  const zillowData = await zillowAPI.getProperty(
    property.address,
    property.city,
    property.state,
    property.zip
  );

  await db.update(properties).set({
    zillow_id: zillowData.zpid,
    zillow_data: zillowData,
    zillow_url: zillowData.zillowURL,
    zillow_last_synced: new Date(),
  });
}
```

---

## Part 8: Index Strategy

### Indexes for Performance

| Table | Index | Purpose |
|-------|-------|---------|
| properties | `(address, city, state, zip)` | Dedup lookup, fast insert-or-find |
| properties | `(lat, lng)` | Geospatial search (radius) |
| properties | `(beds, baths)` | Buyer matching, comp search |
| properties | `(property_type, year_built)` | Comp filters |
| properties | `(zillow_id)`, `(redfin_id)`, `(mls_id)` | Lookup by external ID |
| listings | `(team_id, phase)` | List active/pending listings |
| listings | `(property_id)` | Join to property |
| listings | `(agent_id)`, `(client_id)` | Filter by agent/client |
| comp_listings | `(market_analysis_id)` | Fetch comps for analysis |
| comp_listings | `(property_id)` | Join to property |
| comp_listings | `(sold_date)` | Sort by recency |
| external_listings | `(team_id, is_active)` | Active market intel |
| external_listings | `(property_id)` | Avoid duplicate external tracking |
| buyer_preferences | `(contact_id)`, `(looking_for_type)` | Find active buyers |

---

## Part 9: Data Completeness Tracking

### Why Track Completeness?

Not all properties will have full enrichment data (Zillow, Redfin, school info). The `data_completeness_score` on properties helps prioritize backfill and understand data quality.

```
Score = (fields_present / total_fields) * 100

Example:
  Address ✓ City ✓ State ✓ Zip ✓ Lat ✓ Lng ✓
  Beds ✓ Baths ✓ Sqft ✓ Lot_sqft ✓ Year_built ✓
  Zillow_id ✓ Photos ✗ Schools ✗ Tax data ✗

  Score = 11/20 = 55%
```

### Backfill Priority Queue

```sql
SELECT id, address, city, data_completeness_score
FROM properties
WHERE data_completeness_score < 80
ORDER BY created_at DESC  -- Newest properties first
LIMIT 100;

-- Run enrichment job on these 100 properties
```

---

## Part 10: Backward Compatibility & Deprecation

### During Transition (Weeks 1–4)

- **Queries**: Can read from either properties (NEW) or listings (OLD)
- **Writes**: Only write to properties (NEW), update old columns on listings for compat
- **Deprecated columns on listings**: `address`, `city`, `state`, `zip`, `beds`, `baths`, `sqft`, `lat`, `lng`, `property_type`

### Migration Wrapper (TypeScript)

```typescript
// Deprecation helper
type ListingRow = typeof listings.$inferSelect;

function getPropertyAddress(listing: ListingRow & {property?: Property}): string {
  // Prefer new path
  if (listing.property) return listing.property.address;

  // Fallback to old columns (log warning)
  console.warn(`[DEPRECATED] Reading address from listings.address instead of properties`);
  return listing.address;
}
```

---

## Summary

This design achieves:

1. **Separation of concerns**: Properties (physical) vs. Listings (our engagement)
2. **Deduplication**: Same property referenced from multiple sources shares one record
3. **Data richness**: External data (Zillow, Redfin, schools) enriched once
4. **Scalability**: Foundation for buyer matching, market tracking, comp analysis
5. **Backward compatibility**: Gradual migration path, no data loss
6. **Audit trail**: Sync timestamps (`zillow_last_synced`, etc.) track data freshness

**Next Steps:**
1. Create schema migration files for Drizzle
2. Implement Phase 1–2 (properties table + listings FK)
3. Test with existing seed data
4. Implement Phase 3–5 (comp_listings, external_listings, cleanup)
5. Build buyer matching query and UI
