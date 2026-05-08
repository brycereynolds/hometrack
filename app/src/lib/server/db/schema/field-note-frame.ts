import { pgTable, text, integer, real, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { fieldNotes } from './field-note.js';

export const fieldNoteFrames = pgTable(
  'field_note_frames',
  {
    id: text('id').primaryKey(),
    fieldNoteId: text('field_note_id')
      .notNull()
      .references(() => fieldNotes.id, { onDelete: 'cascade' }),
    frameIndex: integer('frame_index').notNull(),
    timestamp: real('timestamp').notNull(),
    storagePath: text('storage_path'),
    caption: text('caption'),
    visualDescription: text('visual_description'),
    publicUrl: text('public_url'),
  },
  (table) => [
    index('field_note_frames_field_note_id_idx').on(table.fieldNoteId),
    index('field_note_frames_field_note_id_frame_idx').on(table.fieldNoteId, table.frameIndex),
  ],
);

export const fieldNoteFramesRelations = relations(fieldNoteFrames, ({ one }) => ({
  fieldNote: one(fieldNotes, {
    fields: [fieldNoteFrames.fieldNoteId],
    references: [fieldNotes.id],
  }),
}));
