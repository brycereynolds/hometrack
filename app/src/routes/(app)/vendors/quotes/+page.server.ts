import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { quotes } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

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
        await db
          .update(quotes)
          .set({ status: 'approved', updatedAt: new Date() })
          .where(and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)));
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
        await db
          .update(quotes)
          .set({ status: 'declined', updatedAt: new Date() })
          .where(and(eq(quotes.id, quoteId), eq(quotes.teamId, teamId)));
      });
      return { success: true, action: 'decline' };
    } catch (e) {
      console.error('Decline quote error:', e);
      return fail(500, { error: 'Failed to decline quote' });
    }
  },
};
