import { pgTable, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { fieldNoteActions } from './field-note-action.js';
import { fieldNoteMoments } from './field-note-moment.js';

export const fieldNoteActionMoments = pgTable(
  'field_note_action_moments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actionId: text('action_id')
      .notNull()
      .references(() => fieldNoteActions.id, { onDelete: 'cascade' }),
    momentId: text('moment_id')
      .notNull()
      .references(() => fieldNoteMoments.id, { onDelete: 'cascade' }),
    relevance: text('relevance'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('field_note_action_moments_action_id_idx').on(table.actionId),
    index('field_note_action_moments_moment_id_idx').on(table.momentId),
    uniqueIndex('field_note_action_moments_action_moment_idx').on(table.actionId, table.momentId),
  ],
);

export const fieldNoteActionMomentsRelations = relations(fieldNoteActionMoments, ({ one }) => ({
  action: one(fieldNoteActions, {
    fields: [fieldNoteActionMoments.actionId],
    references: [fieldNoteActions.id],
  }),
  moment: one(fieldNoteMoments, {
    fields: [fieldNoteActionMoments.momentId],
    references: [fieldNoteMoments.id],
  }),
}));
