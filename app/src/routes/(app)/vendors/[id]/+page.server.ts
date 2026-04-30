import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { vendors, quotes } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { vendor: null, quotes: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [vendor, vendorQuotes] = await Promise.all([
        db.query.vendors.findFirst({
          where: and(eq(vendors.teamId, team.id), eq(vendors.id, params.id)),
        }),
        db.query.quotes.findMany({
          where: and(eq(quotes.teamId, team.id), eq(quotes.vendorId, params.id)),
          with: {
            lineItems: true,
            listing: { with: { property: true } },
          },
        }),
      ]);

      return {
        vendor: vendor ?? null,
        quotes: vendorQuotes,
      };
    });
  } catch {
    return { vendor: null, quotes: [] };
  }
};

export const actions: Actions = {
  requestQuote: async ({ request, locals, params }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const listingId = (formData.get('listingId') as string)?.trim();
    const scope = (formData.get('scope') as string)?.trim();
    const notes = (formData.get('notes') as string)?.trim() || null;
    const teamId = formData.get('teamId') as string;

    if (!listingId) return fail(400, { error: 'Please select a listing' });
    if (!scope) return fail(400, { error: 'Scope is required' });
    if (!teamId) return fail(400, { error: 'Team context missing' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(quotes).values({
          id: nanoid(),
          teamId,
          vendorId: params.id,
          listingId,
          scope,
          notes,
          status: 'requested',
          requestedDate: new Date(),
        });
      });
      return { success: true };
    } catch (e) {
      console.error('Request quote error:', e);
      return fail(500, { error: 'Failed to request quote' });
    }
  },
};
