import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { listings, activityItems, showings } from '$lib/server/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

// All queries are scoped to team.id from the parent layout, which resolves
// the team strictly by URL slug. No cross-team data is returned.

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  const [allListings, activity, recentShowings] = await Promise.all([
    adminDb.query.listings.findMany({
      where: eq(listings.teamId, team.id),
      with: { property: true, agent: true, client: true },
    }),
    adminDb.query.activityItems.findMany({
      where: eq(activityItems.teamId, team.id),
      orderBy: desc(activityItems.timestamp),
      limit: 10,
    }),
    adminDb.query.showings.findMany({
      where: eq(showings.teamId, team.id),
      orderBy: desc(showings.date),
      limit: 10,
    }),
  ]);

  // Use first listing as the client's property (portal shows a single listing context)
  const listing = allListings[0] ?? null;

  const portalSettings = (listing?.portalSettings as Record<string, any>) ?? null;

  return {
    listing,
    listings: allListings,
    recentActivity: activity,
    showings: recentShowings,
    portalSettings,
  };
};
