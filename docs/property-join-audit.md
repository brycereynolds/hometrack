# Property Data Duplication Audit

## Status: Identified, phased fix planned

## Problem
Property data (address, beds, baths, sqft, photos, lat/lng) is duplicated across:
- `listings` table (15 columns)
- `comp_listings` table (10 columns)  
- `comp_sales` table (no propertyId link at all)

The `properties` table should be the single source of truth.

## Phase 1 (Immediate)
- [x] Comp photos: join to properties instead of reading comp_listings.photoUrl
- [ ] Edit listing: update properties table, not just listings
- [ ] Add propertyId FK to comp_sales
- [ ] All server queries: prefer property data via join

## Phase 2 (Schema cleanup)
- [ ] Remove duplicated columns from listings (keep propertyId)
- [ ] Remove duplicated columns from comp_listings (keep propertyId)
- [ ] Update seed to not populate listing property columns
- [ ] Update all UI components to use property join data

## Phase 3 (Migration)
- [ ] Generate migration to drop columns
- [ ] Update all queries
- [ ] Full regression test
