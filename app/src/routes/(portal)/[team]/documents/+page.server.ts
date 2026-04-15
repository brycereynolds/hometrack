import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { documents, listings } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

// All queries are scoped to team.id from the parent layout, which resolves
// the team strictly by URL slug. No cross-team data is returned.

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  // Get the first listing for this team (portal context)
  const firstListing = await adminDb.query.listings.findFirst({
    where: eq(listings.teamId, team.id),
  });

  if (!firstListing) {
    return { documents: [] };
  }

  const docs = await adminDb.query.documents.findMany({
    where: eq(documents.listingId, firstListing.id),
  });

  // Filter documents by portal sharing settings
  const sharing = (firstListing.portalSettings as Record<string, any>)?.documentSharing;
  const filteredDocs = sharing
    ? docs.filter((doc) => {
        const category = (doc as any).category;
        return !category || sharing[category] !== false;
      })
    : docs;

  return { documents: filteredDocs };
};
