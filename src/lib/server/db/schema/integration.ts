import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { integrationStatusEnum, integrationCategoryEnum } from './enums.js';
import { teams, teamMembers } from './team.js';

export const integrations = pgTable(
  'integrations',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    category: integrationCategoryEnum('category').notNull(),
    icon: text('icon'),
    status: integrationStatusEnum('status').notNull().default('disconnected'),
    lastSync: timestamp('last_sync'),
    connectedById: text('connected_by_id').references(() => teamMembers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('integrations_team_id_idx').on(table.teamId),
    index('integrations_team_category_idx').on(table.teamId, table.category),
  ],
);

export const integrationsRelations = relations(integrations, ({ one }) => ({
  team: one(teams, {
    fields: [integrations.teamId],
    references: [teams.id],
  }),
  connectedBy: one(teamMembers, {
    fields: [integrations.connectedById],
    references: [teamMembers.id],
  }),
}));
