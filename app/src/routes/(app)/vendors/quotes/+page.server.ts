import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { quotes, listingCosts } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { uploadFile, buildStoragePath } from '$lib/server/storage.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { quotes: [] };
  }

  try {
    const quoteList = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.quotes.findMany({
        where: eq(quotes.teamId, team.id),
        with: {
          lineItems: true,
          vendor: true,
          listing: { with: { property: true } },
          task: true,
        },
      });
    });

    return { quotes: quoteList };
  } catch {
    return { quotes: [] };
  }
};

export const actions: Actions = {
  approve: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const quoteId = formData.get('quoteId') as string;
    const teamId = formData.get('teamId') as string;

    if (!quoteId || !teamId) return fail(400, { error: 'Missing required fields' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Fetch the quote with vendor info to build the cost entry
        const quote = await db.query.quotes.findFirst({
          where: and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)),
          with: { vendor: true, lineItems: true },
        });
        if (!quote) throw new Error('Quote not found');

        // Update quote status
        await db
          .update(quotes)
          .set({ status: 'approved', updatedAt: new Date() })
          .where(and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)));

        // Auto-create a listing_costs entry
        const amount = quote.amount ?? quote.lineItems.reduce((s, li) => s + (li.amount ?? 0), 0);
        await db.insert(listingCosts).values({
          teamId: quote.teamId,
          listingId: quote.listingId,
          quoteId: quote.id,
          vendorId: quote.vendorId,
          title: quote.scope ?? 'Approved quote',
          category: quote.vendor?.category ?? 'improvements',
          amount,
          status: 'committed',
          notes: quote.notes,
        });
      });
      return { success: true, action: 'approve' };
    } catch (e) {
      console.error('Approve quote error:', e);
      return fail(500, { error: 'Failed to approve quote' });
    }
  },

  decline: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const quoteId = formData.get('quoteId') as string;
    const teamId = formData.get('teamId') as string;

    if (!quoteId || !teamId) return fail(400, { error: 'Missing required fields' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Update quote status
        await db
          .update(quotes)
          .set({ status: 'declined', updatedAt: new Date() })
          .where(and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)));

        // Guard: remove any cost entry that was linked to this quote
        const existingCost = await db.query.listingCosts.findFirst({
          where: and(eq(listingCosts.quoteId, quoteId), eq(listingCosts.teamId, teamId)),
        });
        if (existingCost) {
          await db.delete(listingCosts).where(eq(listingCosts.id, existingCost.id));
        }
      });
      return { success: true, action: 'decline' };
    } catch (e) {
      console.error('Decline quote error:', e);
      return fail(500, { error: 'Failed to decline quote' });
    }
  },

  shareWithClient: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const quoteId = formData.get('quoteId') as string;
    const teamId = formData.get('teamId') as string;
    const shared = formData.get('shared') === 'true';

    if (!quoteId || !teamId) return fail(400, { error: 'Missing required fields' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(quotes)
          .set({
            sharedWithClient: shared,
            clientReviewStatus: shared ? 'pending_review' : null,
            updatedAt: new Date(),
          })
          .where(and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)));
      });
      return { success: true, action: 'shareWithClient' };
    } catch (e) {
      console.error('Share with client error:', e);
      return fail(500, { error: 'Failed to update sharing' });
    }
  },

  uploadDocument: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const quoteId = formData.get('quoteId') as string;
    const teamId = formData.get('teamId') as string;
    const file = formData.get('document') as File | null;

    if (!quoteId || !teamId) return fail(400, { error: 'Missing required fields' });
    if (!file || file.size === 0) return fail(400, { error: 'No file provided' });

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return fail(400, { error: 'Only PDF and image files are allowed' });
    }

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const storagePath = buildStoragePath(teamId, `quotes/${quoteId}/${file.name}`);

      await uploadFile(storagePath, buffer, file.type);

      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(quotes)
          .set({
            documentPath: storagePath,
            documentName: file.name,
            updatedAt: new Date(),
          })
          .where(and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)));
      });

      return { success: true, action: 'uploadDocument' };
    } catch (e) {
      console.error('Upload document error:', e);
      return fail(500, { error: 'Failed to upload document' });
    }
  },
};
