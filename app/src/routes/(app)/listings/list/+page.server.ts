import type { PageServerLoad } from './$types';
import { getListings } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

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
