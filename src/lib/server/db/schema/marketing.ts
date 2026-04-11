import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { marketingAssetTypeEnum, marketingAssetStatusEnum } from './enums.js';
import { teams } from './team.js';
import { listings } from './listing.js';

export const marketingAssets = pgTable(
  'marketing_assets',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    type: marketingAssetTypeEnum('type').notNull(),
    name: text('name').notNull(),
    status: marketingAssetStatusEnum('status').notNull().default('scheduled'),
    url: text('url'),
    date: timestamp('date'),
    platform: text('platform'),
    metrics: jsonb('metrics'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('marketing_assets_team_id_idx').on(table.teamId),
    index('marketing_assets_listing_id_idx').on(table.listingId),
    index('marketing_assets_team_type_idx').on(table.teamId, table.type),
  ],
);

export const marketingAssetsRelations = relations(marketingAssets, ({ one }) => ({
  team: one(teams, {
    fields: [marketingAssets.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [marketingAssets.listingId],
    references: [listings.id],
  }),
}));
