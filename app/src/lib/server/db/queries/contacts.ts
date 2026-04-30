import { eq, and, or, desc } from 'drizzle-orm';
import { adminDb, type AppDatabase } from '../index.js';
import { contacts, listings, activityItems, buyerPreferences } from '../schema/index.js';

export async function getContacts(teamId: string, db: AppDatabase = adminDb) {
  return db.query.contacts.findMany({
    where: eq(contacts.teamId, teamId),
  });
}

export async function getContactById(teamId: string, id: string, db: AppDatabase = adminDb) {
  return db.query.contacts.findFirst({
    where: and(eq(contacts.teamId, teamId), eq(contacts.id, id)),
  });
}

export async function getContactsByType(teamId: string, type: string, db: AppDatabase = adminDb) {
  return db.query.contacts.findMany({
    where: and(
      eq(contacts.teamId, teamId),
      eq(contacts.type, type as 'client' | 'agent' | 'vendor' | 'lender' | 'inspector' | 'title'),
    ),
  });
}

export async function getContactListings(teamId: string, contactId: string, db: AppDatabase = adminDb) {
  return db.query.listings.findMany({
    where: and(
      eq(listings.teamId, teamId),
      or(eq(listings.clientId, contactId), eq(listings.agentId, contactId)),
    ),
    with: { property: true, agent: true, client: true },
  });
}

export async function getContactActivity(teamId: string, db: AppDatabase = adminDb) {
  return db.query.activityItems.findMany({
    where: eq(activityItems.teamId, teamId),
    orderBy: desc(activityItems.timestamp),
    limit: 50,
  });
}

export async function getBuyerPreferences(contactId: string, db: AppDatabase = adminDb) {
  return db.query.buyerPreferences.findFirst({
    where: eq(buyerPreferences.contactId, contactId),
  });
}
