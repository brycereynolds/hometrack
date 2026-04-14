import { pgTable, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { taskStatusEnum, taskPriorityEnum, listingPhaseEnum, taskCategoryEnum } from './enums.js';
import { teams, teamMembers } from './team.js';
import { listings } from './listing.js';

export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: taskStatusEnum('status').notNull().default('todo'),
    priority: taskPriorityEnum('priority').notNull().default('medium'),
    assigneeId: text('assignee_id').references(() => teamMembers.id, { onDelete: 'set null' }),
    /** @deprecated Use taskCategory instead. Kept for migration compatibility. */
    phase: listingPhaseEnum('phase'),
    taskCategory: taskCategoryEnum('task_category'),
    dueDate: timestamp('due_date'),
    isOverdue: boolean('is_overdue').default(false),
    subtasks: jsonb('subtasks'),
    sourceFieldNoteActionId: text('source_field_note_action_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('tasks_team_id_idx').on(table.teamId),
    index('tasks_listing_id_idx').on(table.listingId),
    index('tasks_assignee_id_idx').on(table.assigneeId),
    index('tasks_team_status_idx').on(table.teamId, table.status),
    index('tasks_due_date_idx').on(table.dueDate),
  ],
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  team: one(teams, {
    fields: [tasks.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [tasks.listingId],
    references: [listings.id],
  }),
  assignee: one(teamMembers, {
    fields: [tasks.assigneeId],
    references: [teamMembers.id],
  }),
}));
