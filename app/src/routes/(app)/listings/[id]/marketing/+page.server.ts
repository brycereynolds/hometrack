import type { PageServerLoad } from './$types';
import { getMarketingByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { marketingAssets: [] };
  }

  try {
    const marketingAssets = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getMarketingByListing(team.id, params.id, db);
    });
    return { marketingAssets };
  } catch {
    return { marketingAssets: [] };
  }
};
