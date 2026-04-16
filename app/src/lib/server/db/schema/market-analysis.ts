import { pgTable, pgEnum, text, timestamp, integer, real, jsonb, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { listings } from './listing.js';
import { properties } from './property.js';

export const marketAnalysisStatusEnum = pgEnum('market_analysis_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const marketAnalyses = pgTable(
  'market_analyses',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    status: marketAnalysisStatusEnum('status').default('pending').notNull(),
    searchParams: jsonb('search_params'),
    suggestedPriceLow: real('suggested_price_low'),
    suggestedPriceHigh: real('suggested_price_high'),
    confidence: real('confidence'),
    aiNarrative: text('ai_narrative'),
    compCount: integer('comp_count'),
    workflowId: text('workflow_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('market_analyses_listing_id_idx').on(table.listingId),
    index('market_analyses_status_idx').on(table.status),
  ],
);

export const marketAnalysesRelations = relations(marketAnalyses, ({ one, many }) => ({
  listing: one(listings, {
    fields: [marketAnalyses.listingId],
    references: [listings.id],
  }),
  comps: many(compListings),
}));

export const compListings = pgTable(
  'comp_listings',
  {
    id: text('id').primaryKey(),
    marketAnalysisId: text('market_analysis_id')
      .notNull()
      .references(() => marketAnalyses.id, { onDelete: 'cascade' }),
    propertyId: text('property_id').references(() => properties.id, { onDelete: 'set null' }),
    source: text('source').notNull(),
    externalId: text('external_id'),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    zip: text('zip'),
    price: real('price'),
    pricePerSqft: real('price_per_sqft'),
    beds: integer('beds'),
    baths: real('baths'),
    sqft: integer('sqft'),
    lotSqft: integer('lot_sqft'),
    yearBuilt: integer('year_built'),
    soldDate: timestamp('sold_date'),
    daysOnMarket: integer('days_on_market'),
    status: text('status'),
    distanceMiles: real('distance_miles'),
    lat: real('lat'),
    lng: real('lng'),
    photoUrl: text('photo_url'),
    photos: jsonb('photos'),
    adjustments: jsonb('adjustments'),
    propertyType: text('property_type'),
    isConfirmedComp: boolean('is_confirmed_comp').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('comp_listings_analysis_id_idx').on(table.marketAnalysisId),
    index('comp_listings_property_id_idx').on(table.propertyId),
  ],
);

export const compListingsRelations = relations(compListings, ({ one }) => ({
  marketAnalysis: one(marketAnalyses, {
    fields: [compListings.marketAnalysisId],
    references: [marketAnalyses.id],
  }),
  property: one(properties, {
    fields: [compListings.propertyId],
    references: [properties.id],
  }),
}));

export const analysisSchedules = pgTable(
  'analysis_schedules',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .unique()
      .references(() => listings.id, { onDelete: 'cascade' }),
    frequency: text('frequency').notNull().default('monthly'),
    lastRun: timestamp('last_run'),
    nextRun: timestamp('next_run'),
    enabled: boolean('enabled').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('analysis_schedules_listing_id_idx').on(table.listingId),
  ],
);

export const analysisSchedulesRelations = relations(analysisSchedules, ({ one }) => ({
  listing: one(listings, {
    fields: [analysisSchedules.listingId],
    references: [listings.id],
  }),
}));
