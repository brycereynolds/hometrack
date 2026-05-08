import { pgTable, text, timestamp, real, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { listingCostStatusEnum } from './enums.js';
import { teams } from './team.js';
import { listings } from './listing.js';
import { tasks } from './task.js';
import { quotes, vendors } from './vendor.js';
import { fieldNoteActions } from './field-note-action.js';

export const listingCosts = pgTable(
  'listing_costs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    listingId: text('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    quoteId: text('quote_id').references(() => quotes.id, { onDelete: 'set null' }),
    actionId: text('action_id').references(() => fieldNoteActions.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category'),
    amount: real('amount'),
    status: listingCostStatusEnum('status').default('estimated').notNull(),
    receiptPath: text('receipt_path'),
    receiptData: jsonb('receipt_data'),
    vendorId: text('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
    paidDate: timestamp('paid_date', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('listing_costs_team_id_idx').on(table.teamId),
    index('listing_costs_listing_id_idx').on(table.listingId),
    index('listing_costs_status_idx').on(table.status),
    index('listing_costs_task_id_idx').on(table.taskId),
    index('listing_costs_quote_id_idx').on(table.quoteId),
  ],
);

export const listingCostsRelations = relations(listingCosts, ({ one }) => ({
  team: one(teams, {
    fields: [listingCosts.teamId],
    references: [teams.id],
  }),
  listing: one(listings, {
    fields: [listingCosts.listingId],
    references: [listings.id],
  }),
  task: one(tasks, {
    fields: [listingCosts.taskId],
    references: [tasks.id],
  }),
  quote: one(quotes, {
    fields: [listingCosts.quoteId],
    references: [quotes.id],
  }),
  vendor: one(vendors, {
    fields: [listingCosts.vendorId],
    references: [vendors.id],
  }),
  action: one(fieldNoteActions, {
    fields: [listingCosts.actionId],
    references: [fieldNoteActions.id],
  }),
}));
