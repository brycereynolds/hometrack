import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { listings, listingCosts } from '$lib/server/db/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  const allListings = await adminDb.query.listings.findMany({
    where: eq(listings.teamId, team.id),
    with: { property: true },
  });

  if (allListings.length === 0) {
    return { listing: null, listings: [], costs: [] };
  }

  // Use first listing as default context
  const listing = allListings[0];

  // Only show committed/paid costs to clients (not estimated or quoted)
  const costs = await adminDb.query.listingCosts.findMany({
    where: and(
      eq(listingCosts.teamId, team.id),
      inArray(listingCosts.status, ['committed', 'paid']),
    ),
    with: { vendor: true },
    orderBy: [listingCosts.category, listingCosts.createdAt],
  });

  return { listing, listings: allListings, costs };
};
