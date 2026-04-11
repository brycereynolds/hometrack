import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { documentCategoryEnum, documentStatusEnum } from './enums.js';
import { teams, teamMembers } from './team.js';
import { listings } from './listing.js';

export const documents = pgTable(
  'documents',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: documentCategoryEnum('category').notNull(),
    uploadedById: text('uploaded_by_id').references(() => teamMembers.id, { onDelete: 'set null' }),
    uploadedDate: timestamp('uploaded_date'),
    fileSize: text('file_size'),
    fileSizeBytes: integer('file_size_bytes'),
    fileType: text('file_type'),
    status: documentStatusEnum('status').notNull().default('draft'),
    version: integer('version').default(1),
    fileUrl: text('file_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('documents_team_id_idx').on(table.teamId),
    index('documents_listing_id_idx').on(table.listingId),
    index('documents_team_category_idx').on(table.teamId, table.category),
    index('documents_uploaded_by_id_idx').on(table.uploadedById),
  ],
);

export const documentsRelations = relations(documents, ({ one }) => ({
  team: one(teams, {
    fields: [documents.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [documents.listingId],
    references: [listings.id],
  }),
  uploadedBy: one(teamMembers, {
    fields: [documents.uploadedById],
    references: [teamMembers.id],
  }),
}));
