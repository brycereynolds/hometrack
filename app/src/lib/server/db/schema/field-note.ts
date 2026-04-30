import {
  pgTable,
  text,
  timestamp,
  real,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { noteTagEnum, fieldNoteMediaTypeEnum, fieldNoteStatusEnum } from './enums.js';
import { teams, teamMembers } from './team.js';
import { listings } from './listing.js';
import { fieldNoteTranscripts } from './field-note-transcript.js';
import { fieldNoteFrames } from './field-note-frame.js';
import { fieldNoteMoments } from './field-note-moment.js';
import { fieldNoteActions } from './field-note-action.js';
import { fieldNoteAttachments } from './field-note-attachment.js';
import { fieldNoteComments } from './field-note-comment.js';

export const fieldNotes = pgTable(
  'field_notes',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id').references(() => listings.id, {
      onDelete: 'cascade',
    }),
    authorId: text('author_id')
      .notNull()
      .references(() => teamMembers.id, { onDelete: 'set null' }),
    mediaType: fieldNoteMediaTypeEnum('media_type').notNull(),
    status: fieldNoteStatusEnum('status').notNull().default('pending'),
    contentHash: text('content_hash'),
    tag: noteTagEnum('tag').notNull().default('general'),
    textContent: text('text_content'),
    summary: text('summary'),
    mediaStoragePath: text('media_storage_path'),
    processedMediaPath: text('processed_media_path'),
    duration: real('duration'),
    frameCount: integer('frame_count'),
    workflowId: text('workflow_id'),
    processingStartedAt: timestamp('processing_started_at'),
    processingCompletedAt: timestamp('processing_completed_at'),
    processingError: text('processing_error'),
    processingStages: jsonb('processing_stages'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('field_notes_team_id_idx').on(table.teamId),
    index('field_notes_listing_id_idx').on(table.listingId),
    index('field_notes_author_id_idx').on(table.authorId),
    index('field_notes_status_idx').on(table.status),
    index('field_notes_content_hash_idx').on(table.contentHash),
  ],
);

export const fieldNotesRelations = relations(fieldNotes, ({ one, many }) => ({
  team: one(teams, {
    fields: [fieldNotes.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [fieldNotes.listingId],
    references: [listings.id],
  }),
  author: one(teamMembers, {
    fields: [fieldNotes.authorId],
    references: [teamMembers.id],
  }),
  transcripts: many(fieldNoteTranscripts),
  frames: many(fieldNoteFrames),
  moments: many(fieldNoteMoments),
  actions: many(fieldNoteActions),
  attachments: many(fieldNoteAttachments),
  comments: many(fieldNoteComments),
}));
