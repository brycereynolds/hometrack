# Property Data Duplication Audit

## Status: COMPLETE

## Problem (Resolved)
Property data (address, beds, baths, sqft, photos, lat/lng) was duplicated across:
- `listings` table (15 columns)
- `comp_listings` table (10 columns)
- `comp_sales` table (no propertyId link at all)

The `properties` table is now the single source of truth.

## What was done

### Schema changes
- **listings**: Removed address, city, state, zip, beds, baths, sqft, lotSqft, yearBuilt, propertyType, photoUrl, photos, lat, lng, features. Made `propertyId` NOT NULL.
- **comp_listings**: Removed address, city, state, zip, beds, baths, sqft, lotSqft, yearBuilt, propertyType, photoUrl, photos, lat, lng. Made `propertyId` NOT NULL.
- **comp_sales**: Removed address, city, beds, baths, sqft, photoUrl, lat, lng, pricePerSqft (kept on table). Added `propertyId` NOT NULL FK.
- **properties**: Added inverse `relations()` for listings, compListings, compSales.

### Query changes
- All listing queries include `with: { property: true }`.
- All comp queries include `with: { property: true }`.
- Edit listing action now updates `properties` for property fields and `listings` for listing fields.
- Market analysis API reads property data from `listing.property.*`.

### UI changes
- All components access property data via `listing.property.address`, `listing.property.beds`, etc.
- Photos accessed via `(listing.property.photos as { url: string }[])?.[0]?.url`.
- Open house pages receive a flat object from server (transparent to UI).

### Seed changes
- Listings no longer populate property columns; only set `propertyId` directly.
- Comp sales create their own property records before inserting.
