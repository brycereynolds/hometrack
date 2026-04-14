import { pgTable, text, integer, real, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { fieldNotes } from './field-note.js';
import { fieldNoteFrames } from './field-note-frame.js';

export const fieldNoteMoments = pgTable(
  'field_note_moments',
  {
    id: text('id').primaryKey(),
    fieldNoteId: text('field_note_id')
      .notNull()
      .references(() => fieldNotes.id, { onDelete: 'cascade' }),
    momentIndex: integer('moment_index').notNull(),
    timestamp: real('timestamp').notNull(),
    endTimestamp: real('end_timestamp'),
    category: text('category'),
    description: text('description'),
    transcriptContext: text('transcript_context'),
    bestFrameId: text('best_frame_id').references(() => fieldNoteFrames.id, {
      onDelete: 'set null',
    }),
    bestFrameTimestamp: real('best_frame_timestamp'),
    rankedFrames: jsonb('ranked_frames'),
    scrubStart: real('scrub_start'),
    scrubEnd: real('scrub_end'),
    enrichedCaption: text('enriched_caption'),
    speechVisualRelationship: text('speech_visual_relationship'),
  },
  (table) => [
    index('field_note_moments_field_note_id_idx').on(table.fieldNoteId),
    index('field_note_moments_field_note_id_moment_idx').on(
      table.fieldNoteId,
      table.momentIndex,
    ),
  ],
);

export const fieldNoteMomentsRelations = relations(fieldNoteMoments, ({ one }) => ({
  fieldNote: one(fieldNotes, {
    fields: [fieldNoteMoments.fieldNoteId],
    references: [fieldNotes.id],
  }),
  bestFrame: one(fieldNoteFrames, {
    fields: [fieldNoteMoments.bestFrameId],
    references: [fieldNoteFrames.id],
  }),
}));
