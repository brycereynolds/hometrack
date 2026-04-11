import { eq, and } from 'drizzle-orm';
import { db } from '../index.js';
import { contacts } from '../schema/index.js';

export async function getContacts(teamId: string) {
  return db.query.contacts.findMany({
    where: eq(contacts.teamId, teamId),
  });
}

export async function getContactById(teamId: string, id: string) {
  return db.query.contacts.findFirst({
    where: and(eq(contacts.teamId, teamId), eq(contacts.id, id)),
  });
}

export async function getContactsByType(teamId: string, type: string) {
  return db.query.contacts.findMany({
    where: and(
      eq(contacts.teamId, teamId),
      eq(contacts.type, type as 'client' | 'agent' | 'vendor' | 'lender' | 'inspector' | 'title'),
    ),
  });
}
