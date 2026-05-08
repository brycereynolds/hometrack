import { pgTable, text, timestamp, jsonb, uniqueIndex, index, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teamMemberRoleEnum } from './enums.js';

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
}));

export const teamMembers = pgTable(
  'team_members',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    userId: uuid('user_id'),
    role: teamMemberRoleEnum('role').notNull(),
    roleLabel: text('role_label'),
    avatar: text('avatar'),
    initials: text('initials'),
    isAgent: boolean('is_agent').default(false),
    agentType: text('agent_type'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('team_members_team_email_idx').on(table.teamId, table.email),
    uniqueIndex('team_members_team_user_idx').on(table.teamId, table.userId),
  ],
);

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));
