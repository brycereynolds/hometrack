import type { PageServerLoad, Actions } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { offers, quotes, listings } from '$lib/server/db/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  const firstListing = await adminDb.query.listings.findFirst({
    where: eq(listings.teamId, team.id),
  });

  if (!firstListing) {
    return { pendingOffers: [], pendingQuotes: [], decidedOffers: [], decidedQuotes: [] };
  }

  const [allOffers, allQuotes] = await Promise.all([
    adminDb.query.offers.findMany({
      where: eq(offers.listingId, firstListing.id),
    }),
    adminDb.query.quotes.findMany({
      where: eq(quotes.listingId, firstListing.id),
      with: { vendor: true },
    }),
  ]);

  const pendingOffers = allOffers.filter((o) => o.status === 'received' || o.status === 'reviewed');
  const decidedOffers = allOffers.filter((o) => o.status === 'accepted' || o.status === 'declined' || o.status === 'countered');

  const pendingQuotes = allQuotes.filter((q) => q.status === 'received' || q.status === 'requested');
  const decidedQuotes = allQuotes.filter((q) => q.status === 'approved' || q.status === 'declined');

  return { pendingOffers, pendingQuotes, decidedOffers, decidedQuotes };
};

export const actions: Actions = {
  approveOffer: async ({ request, params }) => {
    const form = await request.formData();
    const offerId = form.get('id') as string;
    if (!offerId) return fail(400, { error: 'Missing offer id' });

    // Verify offer belongs to this team
    const team = await adminDb.query.teams.findFirst({
      where: eq((await import('$lib/server/db/schema/index.js')).teams.slug, params.team),
    });
    if (!team) return fail(404, { error: 'Team not found' });

    const offer = await adminDb.query.offers.findFirst({
      where: and(eq(offers.id, offerId), eq(offers.teamId, team.id)),
    });
    if (!offer) return fail(404, { error: 'Offer not found' });

    await adminDb.update(offers).set({ status: 'accepted', updatedAt: new Date() }).where(eq(offers.id, offerId));
    return { success: true };
  },

  declineOffer: async ({ request, params }) => {
    const form = await request.formData();
    const offerId = form.get('id') as string;
    if (!offerId) return fail(400, { error: 'Missing offer id' });

    const team = await adminDb.query.teams.findFirst({
      where: eq((await import('$lib/server/db/schema/index.js')).teams.slug, params.team),
    });
    if (!team) return fail(404, { error: 'Team not found' });

    const offer = await adminDb.query.offers.findFirst({
      where: and(eq(offers.id, offerId), eq(offers.teamId, team.id)),
    });
    if (!offer) return fail(404, { error: 'Offer not found' });

    await adminDb.update(offers).set({ status: 'declined', updatedAt: new Date() }).where(eq(offers.id, offerId));
    return { success: true };
  },

  approveQuote: async ({ request, params }) => {
    const form = await request.formData();
    const quoteId = form.get('id') as string;
    if (!quoteId) return fail(400, { error: 'Missing quote id' });

    const team = await adminDb.query.teams.findFirst({
      where: eq((await import('$lib/server/db/schema/index.js')).teams.slug, params.team),
    });
    if (!team) return fail(404, { error: 'Team not found' });

    const quote = await adminDb.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.teamId, team.id)),
    });
    if (!quote) return fail(404, { error: 'Quote not found' });

    await adminDb.update(quotes).set({ status: 'approved', updatedAt: new Date() }).where(eq(quotes.id, quoteId));
    return { success: true };
  },

  declineQuote: async ({ request, params }) => {
    const form = await request.formData();
    const quoteId = form.get('id') as string;
    if (!quoteId) return fail(400, { error: 'Missing quote id' });

    const team = await adminDb.query.teams.findFirst({
      where: eq((await import('$lib/server/db/schema/index.js')).teams.slug, params.team),
    });
    if (!team) return fail(404, { error: 'Team not found' });

    const quote = await adminDb.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.teamId, team.id)),
    });
    if (!quote) return fail(404, { error: 'Quote not found' });

    await adminDb.update(quotes).set({ status: 'declined', updatedAt: new Date() }).where(eq(quotes.id, quoteId));
    return { success: true };
  },
};
