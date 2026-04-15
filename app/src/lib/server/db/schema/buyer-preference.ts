import { pgTable, text, timestamp, integer, real, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { contacts } from './contact.js';

export const buyerPreferences = pgTable(
  'buyer_preferences',
  {
    id: text('id').primaryKey(),

    // Link to contact (one preference set per contact)
    contactId: text('contact_id')
      .notNull()
      .unique()
      .references(() => contacts.id, { onDelete: 'cascade' }),

    // Buyer status
    lookingForType: text('looking_for_type').notNull(), // 'buy', 'sell', 'both'
    isActive: boolean('is_active').default(true).notNull(),

    // Bedroom criteria
    preferredBedsMin: integer('preferred_beds_min'),
    preferredBedsMax: integer('preferred_beds_max'),

    // Bathroom criteria
    preferredBathsMin: real('preferred_baths_min'),
    preferredBathsMax: real('preferred_baths_max'),

    // Size criteria
    preferredSqftMin: integer('preferred_sqft_min'),
    preferredSqftMax: integer('preferred_sqft_max'),
    preferredLotSqftMin: integer('preferred_lot_sqft_min'),
    preferredLotSqftMax: integer('preferred_lot_sqft_max'),

    // Price criteria
    preferredPriceMin: real('preferred_price_min'),
    preferredPriceMax: real('preferred_price_max'),

    // Location criteria — ['San Jose', 'Cupertino', 'Mountain View']
    preferredAreas: jsonb('preferred_areas'),

    // Property type preference — ['single_family', 'condo', 'townhome']
    preferredPropertyTypes: jsonb('preferred_property_types'),

    // Feature preferences — [{feature: 'pool', required: true}, ...]
    preferredFeatures: jsonb('preferred_features'),

    // Flexible criteria
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('buyer_preferences_contact_id_idx').on(table.contactId),
    index('buyer_preferences_looking_for_type_idx').on(table.lookingForType),
    index('buyer_preferences_is_active_idx').on(table.isActive),
  ],
);

export const buyerPreferencesRelations = relations(buyerPreferences, ({ one }) => ({
  contact: one(contacts, {
    fields: [buyerPreferences.contactId],
    references: [contacts.id],
  }),
}));
