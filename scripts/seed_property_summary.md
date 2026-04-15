# Seed Property Data Summary

Generated: 2026-04-15

## Data Source
Properties fetched from **Realty API (Zillow)** using addresses from Roxy Realty listing URLs, roxyrealty.com, and Zillow search results for San Jose/Los Gatos area.

**API**: `https://zillow.realtyapi.io/pro/byaddress`
**Script**: `scripts/fetch_seed_properties.py`
**Cached responses**: `scripts/seed_property_data/*.json`

---

## Properties (11 total)

### Active Listings (4)

| Mock ID | Address | City | Beds | Baths | SqFt | Year Built | Zestimate | Price |
|---------|---------|------|------|-------|------|------------|-----------|-------|
| l-1 | 126 University Ave | Los Gatos 95030 | 3 | 3 | 1,582 | 1900 | $3,005,200 | $2,450,000 |
| l-2 | 1430 Callecita St | San Jose 95125 | 5 | 5 | 3,811 | 2026 | $4,298,100 | $3,950,000 |
| l-6 | 256 Los Gatos Blvd | Los Gatos 95030 | 5 | 6 | 2,511 | 1899 | $2,352,300 | $2,298,000 |
| l-7 | 377 Derby Ave | San Mateo 94403 | 2 | 3 | 1,390 | 2015 | $1,418,600 | $1,475,000 |

### Pre-Market Listings (5, prices withheld)

| Mock ID | Address | City | Beds | Baths | SqFt | Year Built | Zestimate | Target List Date |
|---------|---------|------|------|-------|------|------------|-----------|-----------------|
| l-3 | 40 Pleasant St | Los Gatos 95030 | 3 | 2 | 1,808 | 1939 | $3,098,700 | 2026-04-18 |
| l-4 | 841 Willis Ave | San Jose 95125 | 3 | 2 | 1,344 | 1910 | $1,192,100 | 2026-04-25 |
| l-5 | 809 Midvale Ln | San Jose 95136 | 5 | 3 | 2,112 | 1965 | $1,701,400 | 2026-05-10 |
| l-8 | 672 Willow St | San Jose 95125 | 2 | 3 | 1,367 | 2003 | $1,127,300 | 2026-05-01 |
| l-9 | 1597 Calle De Stuarda | San Jose 95118 | 3 | 2 | 1,614 | 1975 | $1,715,700 | 2026-05-15 |

### Sold/Closed Listings (2)

| Mock ID | Address | City | Beds | Baths | SqFt | Year Built | Sale Price |
|---------|---------|------|------|-------|------|------------|------------|
| l-10 | 1664 Andalusia Way | San Jose 95125 | 3 | 2 | 1,584 | 1961 | $2,290,000 |
| l-11 | 2330 Maximilian Dr | Campbell 95008 | 3 | 2 | 1,540 | 1962 | $2,169,375 |

---

## Mock ID Mapping

| New Mock ID | Source Data ID | Address | Seed Role |
|-------------|---------------|---------|-----------|
| l-1 | active-2 | 126 University Ave, Los Gatos | Active, recently listed |
| l-2 | active-3 | 1430 Callecita St, San Jose | Active, high-end |
| l-3 | active-4 | 40 Pleasant St, Los Gatos | Pre-market, mid-prep |
| l-4 | active-5 | 841 Willis Ave, San Jose | Pre-market, staging |
| l-5 | active-1 | 809 Midvale Ln, San Jose | Pre-market, early onboarding |
| l-6 | sold-4 | 256 Los Gatos Blvd, Los Gatos | Active, offer negotiation |
| l-7 | sold-2 | 377 Derby Ave, San Mateo | Active, under contract |
| l-8 | sold-1 | 672 Willow St, San Jose | Pre-market, improvements |
| l-9 | sold-3 | 1597 Calle De Stuarda, San Jose | Pre-market, new intake |
| l-10 | sold-5 | 1664 Andalusia Way, San Jose | Sold/closed |
| l-11 | sold-6 | 2330 Maximilian Dr, Campbell | Sold/closed |

---

## Data Quality Notes

All 11 properties returned full Zillow data including:
- Complete address with lat/lng coordinates
- Bedrooms, bathrooms, square footage, lot size
- Year built, property type, construction materials
- Tax assessment and annual tax amounts
- School assignments and nearby schools with ratings
- Price history and tax history
- Zestimate and rent Zestimate
- Property photos (up to 10 per listing)
- Features: heating, cooling, appliances, flooring, parking, etc.

### Geographic Coverage
- Los Gatos: 3 properties (95030)
- San Jose 95125: 4 properties (Willow Glen area)
- San Jose 95118: 1 property
- San Jose 95136: 1 property
- San Mateo 94403: 1 property
- Campbell 95008: 1 property

### Property Type Mix
- 9 single-family homes
- 2 townhouses (672 Willow St, 377 Derby Ave)
