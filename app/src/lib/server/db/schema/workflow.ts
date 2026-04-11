import { pgTable, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { listingPhaseEnum } from './enums.js';
import { teams } from './team.js';

export const workflowTemplates = pgTable(
  'workflow_templates',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phase: listingPhaseEnum('phase').notNull(),
    taskCount: integer('task_count').default(0),
    description: text('description'),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('workflow_templates_team_id_idx').on(table.teamId),
    index('workflow_templates_team_phase_idx').on(table.teamId, table.phase),
  ],
);

export const workflowTemplatesRelations = relations(workflowTemplates, ({ one }) => ({
  team: one(teams, {
    fields: [workflowTemplates.teamId],
    references: [teams.id],
  }),
}));
