import { pgTable, text, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams, teamMembers } from './team.js';
import { listings } from './listing.js';
import { contacts } from './contact.js';

export const files = pgTable(
	'files',
	{
		id: text('id').primaryKey(),
		teamId: text('team_id')
			.notNull()
			.references(() => teams.id, { onDelete: 'cascade' }),
		listingId: text('listing_id').references(() => listings.id, { onDelete: 'set null' }),
		contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
		uploadedById: text('uploaded_by_id')
			.notNull()
			.references(() => teamMembers.id, { onDelete: 'set null' }),

		filename: text('filename').notNull(),
		originalFilename: text('original_filename').notNull(),
		mimeType: text('mime_type').notNull(),
		sizeBytes: integer('size_bytes').notNull(),
		s3Key: text('s3_key').notNull().unique(),

		category: text('category'), // 'disclosure', 'contract', 'photo', 'inspection', 'marketing', 'general'
		description: text('description'),

		accessLevel: text('access_level').notNull().default('team'), // 'team', 'listing_members', 'client_portal', 'public'

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('files_team_id_idx').on(table.teamId),
		index('files_listing_id_idx').on(table.listingId),
		index('files_contact_id_idx').on(table.contactId),
		index('files_team_category_idx').on(table.teamId, table.category),
		index('files_uploaded_by_id_idx').on(table.uploadedById),
	],
);

export const filesRelations = relations(files, ({ one }) => ({
	team: one(teams, {
		fields: [files.teamId],
		references: [teams.id],
	}),
	listing: one(listings, {
		fields: [files.listingId],
		references: [listings.id],
	}),
	contact: one(contacts, {
		fields: [files.contactId],
		references: [contacts.id],
	}),
	uploadedBy: one(teamMembers, {
		fields: [files.uploadedById],
		references: [teamMembers.id],
	}),
}));
