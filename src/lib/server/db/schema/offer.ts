import { pgTable, text, timestamp, real, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { offerStatusEnum } from './enums.js';
import { teams } from './team.js';
import { listings } from './listing.js';

export const offers = pgTable(
  'offers',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    buyerName: text('buyer_name'),
    buyerAgent: text('buyer_agent'),
    price: real('price'),
    earnestDeposit: real('earnest_deposit'),
    contingencies: jsonb('contingencies'),
    closeDate: timestamp('close_date'),
    financingType: text('financing_type'),
    status: offerStatusEnum('status').notNull().default('received'),
    submittedDate: timestamp('submitted_date'),
    expirationDate: timestamp('expiration_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('offers_team_id_idx').on(table.teamId),
    index('offers_listing_id_idx').on(table.listingId),
    index('offers_team_status_idx').on(table.teamId, table.status),
  ],
);

export const offersRelations = relations(offers, ({ one }) => ({
  team: one(teams, {
    fields: [offers.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [offers.listingId],
    references: [listings.id],
  }),
}));
