import { pgTable, text, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { fieldNotes } from './field-note.js';

export const fieldNoteTranscripts = pgTable(
  'field_note_transcripts',
  {
    id: text('id').primaryKey(),
    fieldNoteId: text('field_note_id')
      .notNull()
      .references(() => fieldNotes.id, { onDelete: 'cascade' }),
    rawTranscript: text('raw_transcript'),
    rawSegments: jsonb('raw_segments'),
    language: text('language'),
    enrichedTranscript: text('enriched_transcript'),
    rawStoragePath: text('raw_storage_path'),
    enrichedStoragePath: text('enriched_storage_path'),
  },
  (table) => [index('field_note_transcripts_field_note_id_idx').on(table.fieldNoteId)],
);

export const fieldNoteTranscriptsRelations = relations(fieldNoteTranscripts, ({ one }) => ({
  fieldNote: one(fieldNotes, {
    fields: [fieldNoteTranscripts.fieldNoteId],
    references: [fieldNotes.id],
  }),
}));
