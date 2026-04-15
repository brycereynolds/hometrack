# Seed Property Data Summary

Generated: 2026-04-15

## Data Source
Properties fetched from **Realty API (Zillow)** using addresses from Roxy Realty (roxylaufer.realscout.com) listing URLs and roxyrealty.com.

**API**: `https://zillow.realtyapi.io/pro/byaddress`
**Script**: `scripts/fetch_seed_properties.py`
**Cached responses**: `scripts/seed_property_data/*.json`

---

## Properties

### Sold Listings

| # | Address | City | Beds | Baths | SqFt | Year Built | Zestimate | Last Sold | Found on Zillow |
|---|---------|------|------|-------|------|------------|-----------|-----------|-----------------|
| 1 | 672 Willow St | San Jose, CA 95125 | 2 | 3 | 1,367 | 2003 | $1,127,300 | $1,200,000 | Yes |
| 2 | 377 Derby Ave | San Mateo, CA 94403 | 2 | 3 | 1,390 | 2015 | $1,418,600 | $1,475,000 | Yes |
| 3 | 1597 Calle De Stuarda | San Jose, CA 95118 | 3 | 2 | 1,614 | 1975 | $1,715,700 | $1,800,000 | Yes |
| 4 | 256 Los Gatos Blvd | Los Gatos, CA 95030 | 5 | 6 | 2,511 | 1899 | $2,352,300 | $2,360,000 | Yes |
| 5 | 1664 Andalusia Way | San Jose, CA 95125 | 3 | 2 | 1,584 | 1961 | $2,281,500 | $2,290,000 | Yes |
| 6 | 2330 Maximilian Dr | Campbell, CA 95008 | 3 | 2 | 1,540 | 1962 | $2,160,500 | $2,169,375 | Yes |

### Active Listings

| # | Address | City | Beds | Baths | SqFt | Year Built | Zestimate | Last Sold | Found on Zillow |
|---|---------|------|------|-------|------|------------|-----------|-----------|-----------------|
| 7 | 809 Midvale Ln | San Jose, CA 95120 | 5 | 3 | 2,112 | 1965 | $1,701,400 | $840,000 | Yes |

---

## Unresolved RealScout Listings

The following 7 active listing URLs used numeric RealScout IDs that could not be resolved to addresses. RealScout pages are fully client-side rendered (React SPA) and return no HTML content to server-side fetchers. These IDs are not indexed by search engines.

- `169904935`
- `168685202`
- `169650176`
- `169473008`
- `170851085`
- `170838259`
- `170825878`

**Recommendation**: Ask Roxy for the addresses directly, or use the browser DevTools Network tab to capture the RealScout API responses when viewing these pages.

---

## Pre-Market Simulation Candidates

For simulating pre-market/coming-soon listings (no public price), these properties should have their prices removed in seed data:

- **809 Midvale Ln** (active-1) -- already active, use as pre-market simulation
- **672 Willow St** (sold-1) -- smaller property, good for testing price withholding
- **1597 Calle De Stuarda** (sold-3) -- mid-range, good for CMA simulation

---

## Data Quality Notes

All 7 properties returned full Zillow data including:
- Complete address with lat/lng coordinates
- Bedrooms, bathrooms, square footage, lot size
- Year built, property type, construction materials
- Tax assessment and annual tax amounts
- School assignments and nearby schools with ratings
- Price history and tax history
- Zestimate and rent Zestimate
- Property photos (up to 10 per listing)
- Features: heating, cooling, appliances, flooring, parking, etc.
- HOA fees (where applicable)
- Utility information (sewer, water, electric, gas)

### Property Type Mix
- 5 single-family homes
- 1 duplex (256 Los Gatos Blvd)
- 1 townhouse/condo (672 Willow St, listed as TOWNHOUSE)

### Geographic Coverage
- San Jose: 4 properties (95118, 95120, 95125 x2)
- San Mateo: 1 property (94403)
- Los Gatos: 1 property (95030)
- Campbell: 1 property (95008)
