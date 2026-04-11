import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { interestedLevelEnum } from './enums.js';
import { teams } from './team.js';
import { listings } from './listing.js';

export const showings = pgTable(
  'showings',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(),
    time: text('time'),
    agentName: text('agent_name'),
    agentCompany: text('agent_company'),
    buyerType: text('buyer_type'),
    feedback: text('feedback'),
    rating: integer('rating'),
    interestedLevel: interestedLevelEnum('interested_level'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('showings_team_id_idx').on(table.teamId),
    index('showings_listing_id_idx').on(table.listingId),
    index('showings_date_idx').on(table.date),
  ],
);

export const showingsRelations = relations(showings, ({ one }) => ({
  team: one(teams, {
    fields: [showings.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [showings.listingId],
    references: [listings.id],
  }),
}));
