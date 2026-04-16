import type { PageServerLoad, Actions } from './$types';
import { getListingShowingsSeries } from '$lib/server/db/queries/analytics.js';
import { getShowingsByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { showings, teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import crypto from 'node:crypto';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { showings: [], showingsTimeSeries: null };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [showingsList, showingsTimeSeries] = await Promise.all([
        getShowingsByListing(team.id, params.id, db),
        getListingShowingsSeries(params.id, db),
      ]);
      return { showings: showingsList, showingsTimeSeries };
    });
  } catch {
    return { showings: [], showingsTimeSeries: null };
  }
};

export const actions: Actions = {
  scheduleShowing: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const date = form.get('date') as string;
    const time = form.get('time') as string;
    const agentName = form.get('agentName') as string;
    const agentCompany = form.get('agentCompany') as string;
    const buyerType = form.get('buyerType') as string;

    if (!date) {
      return fail(400, { error: 'Date is required' });
    }
    if (!agentName?.trim()) {
      return fail(400, { error: 'Agent name is required' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        await db.insert(showings).values({
          id: crypto.randomUUID(),
          teamId: member.teamId,
          listingId: params.id,
          date: new Date(date),
          time: time?.trim() || null,
          agentName: agentName.trim(),
          agentCompany: agentCompany?.trim() || null,
          buyerType: buyerType?.trim() || null,
        });
      });
      return { success: true };
    } catch (err) {
      console.error('scheduleShowing error:', err);
      return fail(500, { error: 'Failed to schedule showing' });
    }
  },

  editShowing: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const showingId = form.get('showingId') as string;
    const date = form.get('date') as string;
    const time = form.get('time') as string;
    const agentName = (form.get('agentName') as string)?.trim();
    const agentCompany = (form.get('agentCompany') as string)?.trim() || null;
    const buyerType = (form.get('buyerType') as string)?.trim() || null;

    if (!showingId) return fail(400, { error: 'Showing ID is required' });
    if (!date) return fail(400, { error: 'Date is required' });
    if (!agentName) return fail(400, { error: 'Agent name is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.update(showings)
          .set({
            date: new Date(date),
            time: time?.trim() || null,
            agentName,
            agentCompany,
            buyerType,
            updatedAt: new Date(),
          })
          .where(eq(showings.id, showingId));
      });
      return { success: true };
    } catch (err) {
      console.error('editShowing error:', err);
      return fail(500, { error: 'Failed to update showing' });
    }
  },

  saveFeedback: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const showingId = form.get('showingId') as string;
    const feedback = (form.get('feedback') as string)?.trim() || null;
    const rating = form.get('rating') ? parseInt(form.get('rating') as string) : null;
    const interestedLevel = (form.get('interestedLevel') as string) || null;

    if (!showingId) return fail(400, { error: 'Showing ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.update(showings)
          .set({
            feedback,
            rating,
            interestedLevel: interestedLevel as 'very' | 'somewhat' | 'not' | null,
            updatedAt: new Date(),
          })
          .where(eq(showings.id, showingId));
      });
      return { success: true };
    } catch (err) {
      console.error('saveFeedback error:', err);
      return fail(500, { error: 'Failed to save feedback' });
    }
  },

  cancelShowing: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const showingId = form.get('showingId') as string;

    if (!showingId) return fail(400, { error: 'Showing ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.delete(showings)
          .where(eq(showings.id, showingId));
      });
      return { success: true };
    } catch (err) {
      console.error('cancelShowing error:', err);
      return fail(500, { error: 'Failed to cancel showing' });
    }
  },
};
