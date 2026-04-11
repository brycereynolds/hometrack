import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { aiInsightTypeEnum } from './enums.js';
import { teams } from './team.js';
import { listings } from './listing.js';

export const aiInsights = pgTable(
  'ai_insights',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id').references(() => listings.id, { onDelete: 'cascade' }),
    type: aiInsightTypeEnum('type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    actionLabel: text('action_label'),
    actionUrl: text('action_url'),
    dismissed: boolean('dismissed').default(false),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('ai_insights_team_id_idx').on(table.teamId),
    index('ai_insights_listing_id_idx').on(table.listingId),
    index('ai_insights_team_dismissed_idx').on(table.teamId, table.dismissed),
  ],
);

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  team: one(teams, {
    fields: [aiInsights.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [aiInsights.listingId],
    references: [listings.id],
  }),
}));
