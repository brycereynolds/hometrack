import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { quotes, quoteLineItems, listingCosts, activityItems } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { uploadFile, buildStoragePath } from '$lib/server/storage.js';
import crypto from 'node:crypto';

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

        await db.insert(activityItems).values({
          id: crypto.randomUUID(),
          teamId: quote.teamId,
          listingId: quote.listingId,
          type: 'system',
          authorName: 'System',
          authorInitials: 'HT',
          content: `Quote approved: ${quote.scope ?? 'Quote'} from ${quote.vendor?.name ?? 'vendor'} — $${(amount ?? 0).toLocaleString()}`,
          timestamp: new Date(),
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
        // Fetch quote for activity log
        const quote = await db.query.quotes.findFirst({
          where: and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)),
          with: { vendor: true },
        });

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

        if (quote) {
          await db.insert(activityItems).values({
            id: crypto.randomUUID(),
            teamId,
            listingId: quote.listingId,
            type: 'system',
            authorName: 'System',
            authorInitials: 'HT',
            content: `Quote declined: ${quote.scope ?? 'Quote'} from ${quote.vendor?.name ?? 'vendor'}`,
            timestamp: new Date(),
          });
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

  enterQuoteDetails: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const quoteId = formData.get('quoteId') as string;
    const teamId = formData.get('teamId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const receivedDate = formData.get('receivedDate') as string;
    const notes = (formData.get('notes') as string) || null;
    const lineItemsJson = formData.get('lineItems') as string;
    const file = formData.get('document') as File | null;

    if (!quoteId || !teamId || isNaN(amount)) {
      return fail(400, { error: 'Missing required fields' });
    }

    let lineItems: { description: string; amount: number }[] = [];
    try {
      lineItems = JSON.parse(lineItemsJson || '[]');
    } catch {
      // ignore parse errors
    }

    try {
      // Upload document if provided
      let documentPath: string | null = null;
      let documentName: string | null = null;
      if (file && file.size > 0) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.type)) {
          const buffer = new Uint8Array(await file.arrayBuffer());
          documentPath = buildStoragePath(teamId, `quotes/${quoteId}/${file.name}`);
          documentName = file.name;
          await uploadFile(documentPath, buffer, file.type);
        }
      }

      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const quote = await db.query.quotes.findFirst({
          where: and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)),
          with: { vendor: true },
        });
        if (!quote) throw new Error('Quote not found');

        // Update quote
        const updateData: Record<string, any> = {
          amount,
          status: 'received',
          receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
          notes: notes ?? quote.notes,
          updatedAt: new Date(),
        };
        if (documentPath) {
          updateData.documentPath = documentPath;
          updateData.documentName = documentName;
        }

        await db
          .update(quotes)
          .set(updateData)
          .where(and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)));

        // Upsert line items — delete existing and insert new
        await db.delete(quoteLineItems).where(eq(quoteLineItems.quoteId, quoteId));
        if (lineItems.length > 0) {
          await db.insert(quoteLineItems).values(
            lineItems.map((li) => ({
              id: crypto.randomUUID(),
              quoteId,
              description: li.description,
              amount: li.amount,
            }))
          );
        }

        // Activity log
        await db.insert(activityItems).values({
          id: crypto.randomUUID(),
          teamId: quote.teamId,
          listingId: quote.listingId,
          type: 'system',
          authorName: 'System',
          authorInitials: 'HT',
          content: `Quote received from ${quote.vendor?.name ?? 'vendor'}: $${amount.toLocaleString()}`,
          timestamp: new Date(),
        });
      });

      return { success: true, action: 'enterQuoteDetails' };
    } catch (e) {
      console.error('Enter quote details error:', e);
      return fail(500, { error: 'Failed to save quote details' });
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
