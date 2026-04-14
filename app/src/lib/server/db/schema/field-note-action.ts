import {
  pgTable,
  text,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { fieldNoteActionStatusEnum } from './enums.js';
import { fieldNotes } from './field-note.js';
import { fieldNoteMoments } from './field-note-moment.js';
import { quotes } from './vendor.js';
import { teamMembers } from './team.js';

export const fieldNoteActions = pgTable(
  'field_note_actions',
  {
    id: text('id').primaryKey(),
    fieldNoteId: text('field_note_id')
      .notNull()
      .references(() => fieldNotes.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category'),
    priority: text('priority'),
    status: fieldNoteActionStatusEnum('status').notNull().default('suggested'),
    quoteNeeded: boolean('quote_needed').default(false),
    estimatedVendorCategory: text('estimated_vendor_category'),
    sourceMomentId: text('source_moment_id').references(() => fieldNoteMoments.id, {
      onDelete: 'set null',
    }),
    sourceTimestamp: real('source_timestamp'),
    sourceQuote: text('source_quote'),
    extractionConfidence: real('extraction_confidence'),
    linkedTaskId: text('linked_task_id'),
    linkedQuoteId: text('linked_quote_id').references(() => quotes.id, {
      onDelete: 'set null',
    }),
    reviewedBy: text('reviewed_by').references(() => teamMembers.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('field_note_actions_field_note_id_idx').on(table.fieldNoteId),
    index('field_note_actions_status_idx').on(table.status),
    index('field_note_actions_linked_task_id_idx').on(table.linkedTaskId),
  ],
);

export const fieldNoteActionsRelations = relations(fieldNoteActions, ({ one }) => ({
  fieldNote: one(fieldNotes, {
    fields: [fieldNoteActions.fieldNoteId],
    references: [fieldNotes.id],
  }),
  sourceMoment: one(fieldNoteMoments, {
    fields: [fieldNoteActions.sourceMomentId],
    references: [fieldNoteMoments.id],
  }),
  linkedQuote: one(quotes, {
    fields: [fieldNoteActions.linkedQuoteId],
    references: [quotes.id],
  }),
  reviewer: one(teamMembers, {
    fields: [fieldNoteActions.reviewedBy],
    references: [teamMembers.id],
  }),
}));
