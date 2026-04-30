import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { fieldNotes } from './field-note.js';

export const fieldNoteAttachments = pgTable(
  'field_note_attachments',
  {
    id: text('id').primaryKey(),
    fieldNoteId: text('field_note_id')
      .notNull()
      .references(() => fieldNotes.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    storagePath: text('storage_path').notNull(),
    contentType: text('content_type').notNull(),
    fileSize: integer('file_size'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('field_note_attachments_field_note_id_idx').on(table.fieldNoteId),
  ],
);

export const fieldNoteAttachmentsRelations = relations(fieldNoteAttachments, ({ one }) => ({
  fieldNote: one(fieldNotes, {
    fields: [fieldNoteAttachments.fieldNoteId],
    references: [fieldNotes.id],
  }),
}));
