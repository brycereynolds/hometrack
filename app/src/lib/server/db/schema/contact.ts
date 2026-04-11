import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { contactTypeEnum } from './enums.js';
import { teams } from './team.js';

export const contacts = pgTable(
  'contacts',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    type: contactTypeEnum('type').notNull(),
    company: text('company'),
    avatar: text('avatar'),
    initials: text('initials'),
    notes: text('notes'),
    buyerNeeds: text('buyer_needs'),
    marketFocus: text('market_focus'),
    relationshipStrength: integer('relationship_strength'),
    lastInteraction: text('last_interaction'),
    lastInteractionDate: timestamp('last_interaction_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('contacts_team_id_idx').on(table.teamId),
    index('contacts_team_type_idx').on(table.teamId, table.type),
    index('contacts_email_idx').on(table.email),
  ],
);

export const contactsRelations = relations(contacts, ({ one }) => ({
  team: one(teams, {
    fields: [contacts.teamId],
    references: [teams.id],
  }),
}));
