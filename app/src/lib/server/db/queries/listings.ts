import { eq, and } from 'drizzle-orm';
import { db } from '../index.js';
import { listings } from '../schema/index.js';

export async function getListings(teamId: string) {
  return db.query.listings.findMany({
    where: eq(listings.teamId, teamId),
    with: {
      agent: true,
      client: true,
    },
  });
}

export async function getListingById(teamId: string, id: string) {
  return db.query.listings.findFirst({
    where: and(eq(listings.teamId, teamId), eq(listings.id, id)),
    with: {
      agent: true,
      client: true,
    },
  });
}

export async function getListingsByPhase(teamId: string) {
  const all = await getListings(teamId);
  const grouped: Record<string, typeof all> = {};
  for (const listing of all) {
    const phase = listing.phase;
    if (!grouped[phase]) grouped[phase] = [];
    grouped[phase].push(listing);
  }
  return grouped;
}
