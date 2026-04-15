import { pgTable, text, timestamp, real, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { properties } from './property.js';
import { teams } from './team.js';

export const externalListings = pgTable(
  'external_listings',
  {
    id: text('id').primaryKey(),

    // Link to property record
    propertyId: text('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'restrict' }),

    // Team context
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),

    // Source metadata
    source: text('source').notNull(), // 'agent_mention', 'market_scan', 'client_request'
    mentionedBy: text('mentioned_by'), // Agent name, contact name, or system identifier
    sourceUrl: text('source_url'), // Link to original listing

    // Market data snapshot
    listedPrice: real('listed_price'),
    listedDate: timestamp('listed_date'),
    status: text('status'), // 'active', 'pending', 'sold', 'expired', 'withdrawn'

    // Listing agent (external)
    listingAgentName: text('listing_agent_name'),
    listingAgentEmail: text('listing_agent_email'),
    listingAgentPhone: text('listing_agent_phone'),
    listingAgentCompany: text('listing_agent_company'),

    // Relevance & notes
    relevanceTo: text('relevance_to'), // Which of our clients/segments might be interested
    notes: text('notes'),
    isActive: boolean('is_active').default(true).notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('external_listings_property_id_idx').on(table.propertyId),
    index('external_listings_team_id_idx').on(table.teamId),
    index('external_listings_source_idx').on(table.source),
    index('external_listings_is_active_idx').on(table.isActive),
    index('external_listings_status_idx').on(table.status),
  ],
);

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
