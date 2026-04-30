import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { taskPriorityEnum } from './enums.js';
import { workflowTemplates } from './workflow.js';
import { teams } from './team.js';

export const workflowTemplateTasks = pgTable(
  'workflow_template_tasks',
  {
    id: text('id').primaryKey(),
    templateId: text('template_id')
      .notNull()
      .references(() => workflowTemplates.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    priority: taskPriorityEnum('priority').default('medium'),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('workflow_template_tasks_template_id_idx').on(table.templateId),
  ],
);

// Both relations defined here to avoid circular imports between workflow.ts and this file
export const workflowTemplatesRelations = relations(workflowTemplates, ({ one, many }) => ({
  team: one(teams, {
    fields: [workflowTemplates.teamId],
    references: [teams.id],
  }),
  tasks: many(workflowTemplateTasks),
}));

export const workflowTemplateTasksRelations = relations(workflowTemplateTasks, ({ one }) => ({
  template: one(workflowTemplates, {
    fields: [workflowTemplateTasks.templateId],
    references: [workflowTemplates.id],
  }),
}));
