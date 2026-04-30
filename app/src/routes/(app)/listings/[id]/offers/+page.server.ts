import type { PageServerLoad, Actions } from './$types';
import { getOffersByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { offers, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import crypto from 'node:crypto';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { offers: [] };
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getOffersByListing(team.id, params.id, db);
    });
    return { offers: result };
  } catch {
    return { offers: [] };
  }
};

async function getTeamId(userId: string) {
  return withRLS(userId, 'authenticated', async (db) => {
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });
    return member?.teamId ?? null;
  });
}

export const actions: Actions = {
  logOffer: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const buyerName = form.get('buyerName') as string;
    const buyerAgent = form.get('buyerAgent') as string;
    const price = parseFloat(form.get('price') as string);
    const earnestDeposit = parseFloat(form.get('earnestDeposit') as string) || 0;
    const financingType = form.get('financingType') as string;
    const contingenciesRaw = form.get('contingencies') as string;
    const closeDate = form.get('closeDate') as string;
    const notes = form.get('notes') as string;

    if (!buyerName?.trim()) {
      return fail(400, { error: 'Buyer name is required' });
    }
    if (isNaN(price) || price <= 0) {
      return fail(400, { error: 'Valid price is required' });
    }

    const contingencies = contingenciesRaw
      ? contingenciesRaw.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        await db.insert(offers).values({
          id: crypto.randomUUID(),
          teamId: member.teamId,
          listingId: params.id,
          buyerName: buyerName.trim(),
          buyerAgent: buyerAgent?.trim() || null,
          price,
          earnestDeposit,
          financingType: financingType?.trim() || null,
          contingencies,
          closeDate: closeDate ? new Date(closeDate) : null,
          submittedDate: new Date(),
          notes: notes?.trim() || null,
          status: 'received',
        });
      });
      return { success: true, action: 'logOffer' };
    } catch (err) {
      console.error('logOffer error:', err);
      return fail(500, { error: 'Failed to log offer' });
    }
  },

  updateStatus: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const offerId = form.get('offerId') as string;
    const newStatus = form.get('newStatus') as string;

    if (!offerId || !newStatus) {
      return fail(400, { error: 'Offer ID and status are required' });
    }

    const validStatuses = ['received', 'reviewed', 'countered', 'accepted', 'declined'];
    if (!validStatuses.includes(newStatus)) {
      return fail(400, { error: 'Invalid status' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(offers)
          .set({ status: newStatus as any, updatedAt: new Date() })
          .where(and(eq(offers.id, offerId), eq(offers.teamId, teamId)));
      });
      return { success: true, action: 'updateStatus' };
    } catch (err) {
      console.error('updateStatus error:', err);
      return fail(500, { error: 'Failed to update offer status' });
    }
  },

  editOffer: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const offerId = form.get('offerId') as string;
    const buyerName = form.get('buyerName') as string;
    const buyerAgent = form.get('buyerAgent') as string;
    const price = parseFloat(form.get('price') as string);
    const earnestDeposit = parseFloat(form.get('earnestDeposit') as string) || 0;
    const financingType = form.get('financingType') as string;
    const contingenciesRaw = form.get('contingencies') as string;
    const closeDate = form.get('closeDate') as string;
    const notes = form.get('notes') as string;

    if (!offerId) return fail(400, { error: 'Offer ID is required' });
    if (!buyerName?.trim()) return fail(400, { error: 'Buyer name is required' });
    if (isNaN(price) || price <= 0) return fail(400, { error: 'Valid price is required' });

    const contingencies = contingenciesRaw
      ? contingenciesRaw.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(offers)
          .set({
            buyerName: buyerName.trim(),
            buyerAgent: buyerAgent?.trim() || null,
            price,
            earnestDeposit,
            financingType: financingType?.trim() || null,
            contingencies,
            closeDate: closeDate ? new Date(closeDate) : null,
            notes: notes?.trim() || null,
            updatedAt: new Date(),
          })
          .where(and(eq(offers.id, offerId), eq(offers.teamId, teamId)));
      });
      return { success: true, action: 'editOffer' };
    } catch (err) {
      console.error('editOffer error:', err);
      return fail(500, { error: 'Failed to update offer' });
    }
  },

  deleteOffer: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const offerId = form.get('offerId') as string;

    if (!offerId) return fail(400, { error: 'Offer ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .delete(offers)
          .where(and(eq(offers.id, offerId), eq(offers.teamId, teamId)));
      });
      return { success: true, action: 'deleteOffer' };
    } catch (err) {
      console.error('deleteOffer error:', err);
      return fail(500, { error: 'Failed to delete offer' });
    }
  },

  counterOffer: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const originalOfferId = form.get('originalOfferId') as string;
    const price = parseFloat(form.get('price') as string);
    const earnestDeposit = parseFloat(form.get('earnestDeposit') as string) || 0;
    const financingType = form.get('financingType') as string;
    const contingenciesRaw = form.get('contingencies') as string;
    const closeDate = form.get('closeDate') as string;
    const notes = form.get('notes') as string;

    if (!originalOfferId) return fail(400, { error: 'Original offer ID is required' });
    if (isNaN(price) || price <= 0) return fail(400, { error: 'Valid counter price is required' });

    const contingencies = contingenciesRaw
      ? contingenciesRaw.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Get the original offer to copy buyer info
        const original = await db.query.offers.findFirst({
          where: and(eq(offers.id, originalOfferId), eq(offers.teamId, teamId)),
        });
        if (!original) throw new Error('Original offer not found');

        // Mark original as countered
        await db
          .update(offers)
          .set({ status: 'countered' as any, updatedAt: new Date() })
          .where(eq(offers.id, originalOfferId));

        // Create the counter offer, copying buyer info from original
        await db.insert(offers).values({
          id: crypto.randomUUID(),
          teamId,
          listingId: params.id,
          buyerName: original.buyerName,
          buyerAgent: original.buyerAgent,
          price,
          earnestDeposit,
          financingType: financingType?.trim() || original.financingType,
          contingencies,
          closeDate: closeDate ? new Date(closeDate) : null,
          submittedDate: new Date(),
          notes: notes?.trim() || null,
          status: 'countered',
        });
      });
      return { success: true, action: 'counterOffer' };
    } catch (err) {
      console.error('counterOffer error:', err);
      return fail(500, { error: 'Failed to create counter offer' });
    }
  },
};
