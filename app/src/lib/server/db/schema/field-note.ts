import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { noteTagEnum } from './enums.js';
import { teams } from './team.js';
import { listings } from './listing.js';

export const fieldNotes = pgTable(
  'field_notes',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    tag: noteTagEnum('tag').notNull(),
    content: text('content').notNull(),
    authorId: text('author_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('field_notes_team_id_idx').on(table.teamId),
    index('field_notes_listing_id_idx').on(table.listingId),
  ],
);

export const fieldNotesRelations = relations(fieldNotes, ({ one }) => ({
  team: one(teams, {
    fields: [fieldNotes.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [fieldNotes.listingId],
    references: [listings.id],
  }),
}));
