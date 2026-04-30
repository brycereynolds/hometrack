import { pgTable, text, timestamp, integer, real, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams } from './team.js';
import { properties } from './property.js';

export const compSales = pgTable(
  'comp_sales',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    propertyId: text('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    price: real('price'),
    pricePerSqft: real('price_per_sqft'),
    saleDate: timestamp('sale_date'),
    daysOnMarket: integer('days_on_market'),
    distance: text('distance'),
    adjustedValue: real('adjusted_value'),
    adjustments: jsonb('adjustments'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('comp_sales_team_id_idx').on(table.teamId),
    index('comp_sales_property_id_idx').on(table.propertyId),
  ],
);

export const compSalesRelations = relations(compSales, ({ one }) => ({
  team: one(teams, {
    fields: [compSales.teamId],
    references: [teams.id],
  }),
  property: one(properties, {
    fields: [compSales.propertyId],
    references: [properties.id],
  }),
}));
