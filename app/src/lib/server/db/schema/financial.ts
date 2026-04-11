import { pgTable, text, timestamp, integer, real, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams } from './team.js';
import { listings } from './listing.js';

export const financialBudgets = pgTable(
  'financial_budgets',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    totalBudget: real('total_budget'),
    spent: real('spent'),
    remaining: real('remaining'),
    pendingQuotes: integer('pending_quotes').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('financial_budgets_team_id_idx').on(table.teamId),
    index('financial_budgets_listing_id_idx').on(table.listingId),
  ],
);

export const financialBudgetsRelations = relations(financialBudgets, ({ one, many }) => ({
  team: one(teams, {
    fields: [financialBudgets.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [financialBudgets.listingId],
    references: [listings.id],
  }),
  categories: many(financialCategories),
}));

export const financialCategories = pgTable(
  'financial_categories',
  {
    id: text('id').primaryKey(),
    budgetId: text('budget_id')
      .notNull()
      .references(() => financialBudgets.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    budgeted: real('budgeted'),
    actual: real('actual'),
    variance: real('variance'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('financial_categories_budget_id_idx').on(table.budgetId),
  ],
);

export const financialCategoriesRelations = relations(financialCategories, ({ one }) => ({
  budget: one(financialBudgets, {
    fields: [financialCategories.budgetId],
    references: [financialBudgets.id],
  }),
}));
