import { pgTable, text, timestamp, integer, real, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { quoteStatusEnum } from './enums.js';
import { teams } from './team.js';
import { listings } from './listing.js';

export const vendors = pgTable(
  'vendors',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    company: text('company'),
    category: text('category'),
    phone: text('phone'),
    email: text('email'),
    initials: text('initials'),
    rating: real('rating'),
    reliabilityScore: integer('reliability_score'),
    avgResponseTime: text('avg_response_time'),
    projectsCompleted: integer('projects_completed').default(0),
    avgCost: text('avg_cost'),
    serviceArea: text('service_area'),
    specialties: jsonb('specialties'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('vendors_team_id_idx').on(table.teamId),
    index('vendors_team_category_idx').on(table.teamId, table.category),
    index('vendors_email_idx').on(table.email),
  ],
);

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  team: one(teams, {
    fields: [vendors.teamId],
    references: [teams.id],
  }),
  quotes: many(quotes),
}));

export const quotes = pgTable(
  'quotes',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    scope: text('scope'),
    amount: real('amount'),
    status: quoteStatusEnum('status').notNull().default('requested'),
    requestedDate: timestamp('requested_date'),
    receivedDate: timestamp('received_date'),
    validUntil: timestamp('valid_until'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('quotes_team_id_idx').on(table.teamId),
    index('quotes_vendor_id_idx').on(table.vendorId),
    index('quotes_listing_id_idx').on(table.listingId),
    index('quotes_team_status_idx').on(table.teamId, table.status),
  ],
);

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  team: one(teams, {
    fields: [quotes.teamId],
    references: [teams.id],
  }),
  vendor: one(vendors, {
    fields: [quotes.vendorId],
    references: [vendors.id],
  }),
  listing: one(listings, {
    fields: [quotes.listingId],
    references: [listings.id],
  }),
  lineItems: many(quoteLineItems),
}));

export const quoteLineItems = pgTable(
  'quote_line_items',
  {
    id: text('id').primaryKey(),
    quoteId: text('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    description: text('description'),
    amount: real('amount'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('quote_line_items_quote_id_idx').on(table.quoteId),
  ],
);

export const quoteLineItemsRelations = relations(quoteLineItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteLineItems.quoteId],
    references: [quotes.id],
  }),
}));
