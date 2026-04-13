import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { showings } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { listings: [], showings: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [listingList, showingList] = await Promise.all([
        getListings(team.id, db),
        db.query.showings.findMany({
          where: eq(showings.teamId, team.id),
          with: { listing: true },
        }),
      ]);

      return { listings: listingList, showings: showingList };
    });
  } catch {
    return { listings: [], showings: [] };
  }
};

export const actions: Actions = {
  submit: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const showingId = (formData.get('showingId') as string)?.trim();
    const interestLevel = (formData.get('interestLevel') as string)?.trim();
    const rating = parseInt(formData.get('rating') as string, 10);
    const priceFeedback = (formData.get('priceFeedback') as string)?.trim();
    const pros = (formData.get('pros') as string)?.trim();
    const cons = (formData.get('cons') as string)?.trim();
    const comments = (formData.get('comments') as string)?.trim();

    if (!showingId) return fail(400, { error: 'Showing is required' });

    // Build a readable feedback summary
    const parts: string[] = [];
    if (priceFeedback) parts.push(`Price: ${priceFeedback}`);
    if (pros) parts.push(`Pros: ${pros}`);
    if (cons) parts.push(`Cons: ${cons}`);
    if (comments) parts.push(comments);
    const feedback = parts.join('\n') || null;

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(showings)
          .set({
            feedback,
            rating: isNaN(rating) || rating === 0 ? null : rating,
            interestedLevel: interestLevel as 'very' | 'somewhat' | 'not' | undefined || null,
            updatedAt: new Date(),
          })
          .where(eq(showings.id, showingId));
      });
      return { success: true };
    } catch (e) {
      console.error('Submit showing feedback error:', e);
      return fail(500, { error: 'Failed to submit feedback' });
    }
  },
};
