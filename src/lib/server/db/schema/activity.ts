import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { activityTypeEnum } from './enums.js';
import { teams, teamMembers } from './team.js';
import { listings } from './listing.js';

export const activityItems = pgTable(
  'activity_items',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id').references(() => listings.id, { onDelete: 'cascade' }),
    type: activityTypeEnum('type').notNull(),
    authorId: text('author_id').references(() => teamMembers.id, { onDelete: 'set null' }),
    authorName: text('author_name'),
    authorInitials: text('author_initials'),
    content: text('content'),
    metadata: jsonb('metadata'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('activity_items_team_id_idx').on(table.teamId),
    index('activity_items_listing_id_idx').on(table.listingId),
    index('activity_items_timestamp_idx').on(table.timestamp),
    index('activity_items_team_type_idx').on(table.teamId, table.type),
  ],
);

export const activityItemsRelations = relations(activityItems, ({ one }) => ({
  team: one(teams, {
    fields: [activityItems.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [activityItems.listingId],
    references: [listings.id],
  }),
  author: one(teamMembers, {
    fields: [activityItems.authorId],
    references: [teamMembers.id],
  }),
}));
