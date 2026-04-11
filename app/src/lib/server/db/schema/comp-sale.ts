import { pgTable, text, timestamp, integer, real, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams } from './team.js';

export const compSales = pgTable(
  'comp_sales',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    address: text('address').notNull(),
    city: text('city'),
    price: real('price'),
    sqft: integer('sqft'),
    pricePerSqft: real('price_per_sqft'),
    beds: integer('beds'),
    baths: real('baths'),
    saleDate: timestamp('sale_date'),
    daysOnMarket: integer('days_on_market'),
    distance: text('distance'),
    adjustedValue: real('adjusted_value'),
    adjustments: jsonb('adjustments'),
    photoUrl: text('photo_url'),
    lat: real('lat'),
    lng: real('lng'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('comp_sales_team_id_idx').on(table.teamId),
    index('comp_sales_city_idx').on(table.city),
  ],
);

export const compSalesRelations = relations(compSales, ({ one }) => ({
  team: one(teams, {
    fields: [compSales.teamId],
    references: [teams.id],
  }),
}));
