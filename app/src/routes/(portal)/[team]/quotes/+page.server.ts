import type { PageServerLoad, Actions } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { listings, quotes } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  const firstListing = await adminDb.query.listings.findFirst({
    where: eq(listings.teamId, team.id),
  });

  if (!firstListing) {
    return { pendingQuotes: [], reviewedQuotes: [] };
  }

  const allQuotes = await adminDb.query.quotes.findMany({
    where: and(
      eq(quotes.listingId, firstListing.id),
      eq(quotes.sharedWithClient, true),
    ),
    with: { vendor: true, lineItems: true },
  });

  const pendingQuotes = allQuotes.filter(
    (q) => !q.clientReviewStatus || q.clientReviewStatus === 'pending_review',
  );
  const reviewedQuotes = allQuotes.filter(
    (q) => q.clientReviewStatus === 'client_approved' || q.clientReviewStatus === 'client_declined',
  );

  return { pendingQuotes, reviewedQuotes };
};

export const actions: Actions = {
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
    if (!quote.sharedWithClient) return fail(403, { error: 'Quote not shared with client' });

    await adminDb
      .update(quotes)
      .set({ clientReviewStatus: 'client_approved', updatedAt: new Date() })
      .where(eq(quotes.id, quoteId));

    return { success: true };
  },

  declineQuote: async ({ request, params }) => {
    const form = await request.formData();
    const quoteId = form.get('id') as string;
    const reason = (form.get('reason') as string)?.trim() || null;
    if (!quoteId) return fail(400, { error: 'Missing quote id' });

    const team = await adminDb.query.teams.findFirst({
      where: eq((await import('$lib/server/db/schema/index.js')).teams.slug, params.team),
    });
    if (!team) return fail(404, { error: 'Team not found' });

    const quote = await adminDb.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.teamId, team.id)),
    });
    if (!quote) return fail(404, { error: 'Quote not found' });
    if (!quote.sharedWithClient) return fail(403, { error: 'Quote not shared with client' });

    await adminDb
      .update(quotes)
      .set({
        clientReviewStatus: 'client_declined',
        notes: reason ? `${quote.notes ? quote.notes + '\n' : ''}Client declined: ${reason}` : quote.notes,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));

    return { success: true };
  },
};
