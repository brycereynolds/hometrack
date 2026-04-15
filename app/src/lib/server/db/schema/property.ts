import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  bigint,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const properties = pgTable(
  'properties',
  {
    id: text('id').primaryKey(),

    // Address (composite unique constraint)
    address: text('address').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    zip: text('zip').notNull(),
    county: text('county'),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),

    // Core structural data
    beds: integer('beds'),
    baths: real('baths'),
    bathsFull: integer('baths_full'),
    bathsHalf: integer('baths_half'),
    sqft: integer('sqft'),
    lotSqft: integer('lot_sqft'),
    lotSizeAcres: real('lot_size_acres'),
    yearBuilt: integer('year_built'),
    propertyType: text('property_type'), // SINGLE_FAMILY, CONDO, TOWNHOME, etc.
    stories: integer('stories'),
    architecturalStyle: text('architectural_style'),

    // Construction & structure
    constructionMaterials: jsonb('construction_materials'), // ["wood frame", "stucco"]
    roof: text('roof'),
    foundation: jsonb('foundation'), // ["slab", "concrete"]
    basement: text('basement'), // "None", "Finished", "Unfinished"
    attic: text('attic'),

    // Features — single JSONB with GIN index for fast filtering
    // { pool: true, garage: true, fireplace: true, spa: false,
    //   heating: ["Forced air", "Gas"], cooling: ["Central"],
    //   appliances: ["Dishwasher", "Microwave", ...],
    //   flooring: ["Hardwood", "Slate"], laundry: [...],
    //   interiorFeatures: [...], exteriorFeatures: ["Stucco", "Composition"],
    //   buildingFeatures: ["L-Shaped"], communityFeatures: [...],
    //   securityFeatures: [...], greenFeatures: {...},
    //   fencing: "...", view: "...", waterfront: false,
    //   patioAndPorch: [...], doorFeatures: [...], windowFeatures: [...] }
    features: jsonb('features'),

    // Parking
    parkingSpaces: integer('parking_spaces'),
    garageSpaces: integer('garage_spaces'),
    parkingFeatures: jsonb('parking_features'), // ["Garage - Attached", "Off-street"]

    // Lot
    lotFeatures: jsonb('lot_features'), // ["Corner Lot", "Cul-De-Sac"]

    // Rooms
    roomsCount: integer('rooms_count'),
    rooms: jsonb('rooms'), // [{roomType: "Office", ...}, ...]

    // Tax data
    taxAssessedValue: real('tax_assessed_value'),
    taxAnnualAmount: real('tax_annual_amount'),
    taxYear: integer('tax_year'),
    parcelNumber: text('parcel_number').unique(),

    // HOA
    hoaFee: real('hoa_fee'),
    hoaFeeFrequency: text('hoa_fee_frequency'), // "monthly", "annual"

    // Utilities
    sewer: text('sewer'),
    waterSource: text('water_source'),
    electric: text('electric'),
    gas: text('gas'),

    // Schools (JSONB array from Zillow schools data)
    // [{name, type, level, distance, rating, grades, studentsPerTeacher, link, isAssigned}]
    nearbySchools: jsonb('nearby_schools'),
    elementarySchool: text('elementary_school'),
    elementarySchoolDistrict: text('elementary_school_district'),
    middleSchool: text('middle_school'),
    middleSchoolDistrict: text('middle_school_district'),
    highSchool: text('high_school'),
    highSchoolDistrict: text('high_school_district'),

    // Neighborhood / scores
    neighborhood: text('neighborhood'),
    walkabilityScore: integer('walkability_score'),
    transitScore: integer('transit_score'),
    bikeScore: integer('bike_score'),

    // Photos (array of {url, source, caption})
    photos: jsonb('photos').default('[]'),

    // Financial history
    lastSoldPrice: real('last_sold_price'),
    lastSoldDate: timestamp('last_sold_date'),
    zestimate: real('zestimate'),
    rentZestimate: real('rent_zestimate'),
    priceHistory: jsonb('price_history'), // [{date, event, price, pricePerSqft, source}]
    taxHistory: jsonb('tax_history'), // [{year, taxAmount, value}]

    // External service IDs
    zillowId: bigint('zillow_id', { mode: 'number' }).unique(),
    redfinId: text('redfin_id').unique(),
    mlsId: text('mls_id').unique(),

    // Source-specific raw data blobs
    zillowData: jsonb('zillow_data'), // trimmed raw Zillow API response
    zillowUrl: text('zillow_url'),
    redfinData: jsonb('redfin_data'), // raw Redfin data when added
    redfinUrl: text('redfin_url'),

    // Sync metadata
    lastSynced: timestamp('last_synced'),
    dataCompletenessScore: real('data_completeness_score').default(0),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('properties_address_unique_idx').on(
      table.address,
      table.city,
      table.state,
      table.zip,
    ),
    index('properties_zip_idx').on(table.zip),
    index('properties_coords_idx').on(table.lat, table.lng),
    index('properties_beds_baths_idx').on(table.beds, table.baths),
    index('properties_property_type_idx').on(table.propertyType),
    index('properties_year_built_idx').on(table.yearBuilt),
    index('properties_zillow_id_idx').on(table.zillowId),
    index('properties_redfin_id_idx').on(table.redfinId),
    index('properties_mls_id_idx').on(table.mlsId),
    index('properties_features_idx').using('gin', table.features),
  ],
);

export const propertiesRelations = relations(properties, () => ({}));
