import { pgTable, text, timestamp, integer, real, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { listingPhaseEnum } from './enums.js';
import { teams, teamMembers } from './team.js';
import { contacts } from './contact.js';

export const listings = pgTable(
  'listings',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    address: text('address').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    zip: text('zip').notNull(),
    price: real('price'),
    beds: integer('beds'),
    baths: real('baths'),
    sqft: integer('sqft'),
    lotSqft: integer('lot_sqft'),
    yearBuilt: integer('year_built'),
    propertyType: text('property_type'),
    mlsNumber: text('mls_number'),
    description: text('description'),
    features: jsonb('features'),
    photoUrl: text('photo_url'),
    photos: jsonb('photos'),
    lat: real('lat'),
    lng: real('lng'),
    phase: listingPhaseEnum('phase').default('onboarding').notNull(),
    daysInPhase: integer('days_in_phase').default(0),
    daysOnMarket: integer('days_on_market').default(0),
    listDate: timestamp('list_date'),
    targetListDate: timestamp('target_list_date'),
    agentId: text('agent_id').references(() => teamMembers.id, { onDelete: 'set null' }),
    clientId: text('client_id').references(() => contacts.id, { onDelete: 'set null' }),
    tasksDone: integer('tasks_done').default(0),
    tasksTotal: integer('tasks_total').default(0),
    documentsCount: integer('documents_count').default(0),
    showingsCount: integer('showings_count').default(0),
    offersCount: integer('offers_count').default(0),
    zillowViews: integer('zillow_views').default(0),
    zillowSaves: integer('zillow_saves').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('listings_team_id_idx').on(table.teamId),
    index('listings_team_phase_idx').on(table.teamId, table.phase),
    index('listings_agent_id_idx').on(table.agentId),
    index('listings_client_id_idx').on(table.clientId),
    index('listings_mls_number_idx').on(table.mlsNumber),
  ],
);

export const listingsRelations = relations(listings, ({ one }) => ({
  team: one(teams, {
    fields: [listings.teamId],
    references: [teams.id],
  }),
  agent: one(teamMembers, {
    fields: [listings.agentId],
    references: [teamMembers.id],
  }),
  client: one(contacts, {
    fields: [listings.clientId],
    references: [contacts.id],
  }),
}));
