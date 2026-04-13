import type { PageServerLoad, Actions } from './$types';
import { getTasksByListing } from '$lib/server/db/queries/tasks.js';
import { getActivityByListing, getInsightsByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { listings, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { tasks: [], activityItems: [], aiInsights: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [tasks, activityItems, aiInsights] = await Promise.all([
        getTasksByListing(team.id, params.id, db),
        getActivityByListing(team.id, params.id, db),
        getInsightsByListing(team.id, params.id, db),
      ]);
      return { tasks, activityItems, aiInsights };
    });
  } catch {
    return { tasks: [], activityItems: [], aiInsights: [] };
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
  changePhase: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    const formData = await request.formData();
    const phase = formData.get('phase')?.toString();

    const validPhases = ['pre_market', 'active', 'closed', 'canceled'];
    if (!phase || !validPhases.includes(phase)) {
      return fail(400, { error: 'Invalid phase' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(listings)
          .set({
            phase: phase as 'pre_market' | 'active' | 'closed' | 'canceled',
            daysInPhase: 0,
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, params.id), eq(listings.teamId, teamId)));
      });
    } catch (err) {
      console.error('Failed to change phase:', err);
      return fail(500, { error: 'Failed to change phase' });
    }

    return { success: true, action: 'changePhase' };
  },

  editListing: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    const formData = await request.formData();

    const address = formData.get('address')?.toString().trim();
    const city = formData.get('city')?.toString().trim();
    const state = formData.get('state')?.toString().trim();
    const zip = formData.get('zip')?.toString().trim();

    if (!address || !city || !state || !zip) {
      return fail(400, { error: 'Address, city, state, and ZIP are required' });
    }

    const priceStr = formData.get('price')?.toString().replace(/[^0-9.]/g, '');
    const price = priceStr ? parseFloat(priceStr) : null;
    const beds = parseInt(formData.get('beds')?.toString() ?? '') || null;
    const baths = parseFloat(formData.get('baths')?.toString() ?? '') || null;
    const sqft = parseInt(formData.get('sqft')?.toString() ?? '') || null;
    const lotSqft = parseInt(formData.get('lotSqft')?.toString() ?? '') || null;
    const yearBuilt = parseInt(formData.get('yearBuilt')?.toString() ?? '') || null;
    const propertyType = formData.get('propertyType')?.toString() || null;
    const description = formData.get('description')?.toString().trim() || null;
    const mlsNumber = formData.get('mlsNumber')?.toString().trim() || null;

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(listings)
          .set({
            address,
            city,
            state,
            zip,
            price,
            beds,
            baths,
            sqft,
            lotSqft,
            yearBuilt,
            propertyType,
            description,
            mlsNumber,
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, params.id), eq(listings.teamId, teamId)));
      });
    } catch (err) {
      console.error('Failed to edit listing:', err);
      return fail(500, { error: 'Failed to update listing' });
    }

    return { success: true, action: 'editListing' };
  },
};
