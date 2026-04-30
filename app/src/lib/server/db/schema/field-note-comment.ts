import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { fieldNotes } from './field-note.js';
import { fieldNoteActions } from './field-note-action.js';
import { teamMembers } from './team.js';

export const fieldNoteComments = pgTable(
  'field_note_comments',
  {
    id: text('id').primaryKey(),
    fieldNoteId: text('field_note_id')
      .notNull()
      .references(() => fieldNotes.id, { onDelete: 'cascade' }),
    actionId: text('action_id')
      .references(() => fieldNoteActions.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'), // self-reference for threading
    authorId: text('author_id')
      .notNull()
      .references(() => teamMembers.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    mentions: jsonb('mentions'), // array of { memberId, name } for @mentions
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('field_note_comments_field_note_id_idx').on(table.fieldNoteId),
    index('field_note_comments_action_id_idx').on(table.actionId),
    index('field_note_comments_parent_id_idx').on(table.parentId),
  ],
);

export const fieldNoteCommentsRelations = relations(fieldNoteComments, ({ one, many }) => ({
  fieldNote: one(fieldNotes, {
    fields: [fieldNoteComments.fieldNoteId],
    references: [fieldNotes.id],
  }),
  action: one(fieldNoteActions, {
    fields: [fieldNoteComments.actionId],
    references: [fieldNoteActions.id],
  }),
  author: one(teamMembers, {
    fields: [fieldNoteComments.authorId],
    references: [teamMembers.id],
  }),
  parent: one(fieldNoteComments, {
    fields: [fieldNoteComments.parentId],
    references: [fieldNoteComments.id],
    relationName: 'replies',
  }),
  replies: many(fieldNoteComments, { relationName: 'replies' }),
}));
