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

  // Load first listing to get portal settings (placeholder until client auth scopes it)
  const listing = await adminDb.query.listings.findFirst({
    where: eq(listings.teamId, team.id),
    with: { property: true },
  });

  const portalSettings = (listing?.portalSettings as Record<string, any>) ?? null;

  // Count pending quotes for badge
  let pendingQuoteCount = 0;
  if (listing) {
    const sharedQuotes = await adminDb.query.quotes.findMany({
      where: and(
        eq(quotes.listingId, listing.id),
        eq(quotes.sharedWithClient, true),
      ),
    });
    pendingQuoteCount = sharedQuotes.filter(
      (q) => !q.clientReviewStatus || q.clientReviewStatus === 'pending_review',
    ).length;
  }

  return { team, portalSettings, portalAuthenticated, pendingQuoteCount };
};
