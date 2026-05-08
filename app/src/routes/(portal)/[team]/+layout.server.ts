import type { LayoutServerLoad } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { teams, listings, contacts, quotes } from '$lib/server/db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ params, cookies }) => {
  const team = await adminDb.query.teams.findFirst({
    where: eq(teams.slug, params.team),
  });

  if (!team) {
    throw error(404, 'Team not found');
  }

  // Check portal_token cookie for access
  const portalToken = cookies.get('portal_token');
  const portalAuthenticated = !!portalToken;

  // Load all listings for this team
  const allListings = await adminDb.query.listings.findMany({
    where: eq(listings.teamId, team.id),
    with: { property: true },
  });

  const listing = allListings[0] ?? null;
  const portalSettings = (listing?.portalSettings as Record<string, any>) ?? null;

  // Count pending quotes across all listings for badge
  let pendingQuoteCount = 0;
  if (allListings.length > 0) {
    const listingIds = allListings.map((l) => l.id);
    const sharedQuotes = await adminDb.query.quotes.findMany({
      where: and(
        sql`${quotes.listingId} IN (${sql.join(listingIds.map(id => sql`${id}`), sql`, `)})`,
        eq(quotes.sharedWithClient, true),
      ),
    });
    pendingQuoteCount = sharedQuotes.filter(
      (q) => !q.clientReviewStatus || q.clientReviewStatus === 'pending_review',
    ).length;
  }

  return { team, portalSettings, portalAuthenticated, pendingQuoteCount };
};
