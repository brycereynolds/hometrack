import type { PageServerLoad } from './$types';
import { getOffersByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { offers: [] };
  }

  try {
    const offers = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getOffersByListing(team.id, params.id, db);
    });
    return { offers };
  } catch {
    return { offers: [] };
  }
};
