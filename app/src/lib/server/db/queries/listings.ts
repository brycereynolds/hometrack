import { eq, and } from 'drizzle-orm';
import { adminDb, type AppDatabase } from '../index.js';
import { listings } from '../schema/index.js';

export async function getListings(teamId: string, db: AppDatabase = adminDb) {
  return db.query.listings.findMany({
    where: eq(listings.teamId, teamId),
    with: {
      agent: true,
      client: true,
    },
  });
}

export async function getListingById(teamId: string, id: string, db: AppDatabase = adminDb) {
  return db.query.listings.findFirst({
    where: and(eq(listings.teamId, teamId), eq(listings.id, id)),
    with: {
      agent: true,
      client: true,
    },
  });
}

export async function getListingsByPhase(teamId: string, db: AppDatabase = adminDb) {
  const all = await getListings(teamId, db);
  const grouped: Record<string, typeof all> = {};
  for (const listing of all) {
    const phase = listing.phase;
    if (!grouped[phase]) grouped[phase] = [];
    grouped[phase].push(listing);
  }
  return grouped;
}
