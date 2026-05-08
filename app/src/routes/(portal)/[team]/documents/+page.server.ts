import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { documents, listings } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

// All queries are scoped to team.id from the parent layout, which resolves
// the team strictly by URL slug. No cross-team data is returned.

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  // Get all listings for this team
  const allListings = await adminDb.query.listings.findMany({
    where: eq(listings.teamId, team.id),
  });

  if (allListings.length === 0) {
    return { documents: [] };
  }

  // Load documents across all listings
  const { inArray } = await import('drizzle-orm');
  const listingIds = allListings.map((l) => l.id);
  const docs = await adminDb.query.documents.findMany({
    where: inArray(documents.listingId, listingIds),
  });

  // Filter documents by portal sharing settings from first listing
  const sharing = (allListings[0].portalSettings as Record<string, any>)?.documentSharing;
  const filteredDocs = sharing
    ? docs.filter((doc) => {
        const category = (doc as any).category;
        return !category || sharing[category] !== false;
      })
    : docs;

  return { documents: filteredDocs };
};
