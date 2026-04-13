import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { fieldNotes } from '$lib/server/db/schema/index.js';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { listings: [] };
  }

  try {
    const listings = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getListings(team.id, db);
    });

    return { listings };
  } catch {
    return { listings: [] };
  }
};

export const actions: Actions = {
  save: async ({ request, locals, url }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const listingId = (formData.get('listingId') as string)?.trim();
    const tag = (formData.get('tag') as string)?.trim();
    const content = (formData.get('content') as string)?.trim();
    const teamId = formData.get('teamId') as string;

    if (!content) return fail(400, { error: 'Note content is required' });
    if (!listingId) return fail(400, { error: 'Listing is required' });
    if (!teamId) return fail(400, { error: 'Team context missing' });
    if (!tag || !['showing', 'vendor', 'client'].includes(tag)) {
      return fail(400, { error: 'Invalid tag' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(fieldNotes).values({
          id: nanoid(),
          teamId,
          listingId,
          tag: tag as 'showing' | 'vendor' | 'client',
          content,
          authorId: locals.user!.id,
        });
      });
      return { success: true };
    } catch (e) {
      console.error('Save field note error:', e);
      return fail(500, { error: 'Failed to save note' });
    }
  },
};
