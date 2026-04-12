import type { PageServerLoad } from './$types';
import { getListingShowingsSeries } from '$lib/server/db/queries/analytics.js';
import { getShowingsByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { showings: [], showingsTimeSeries: null };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [showings, showingsTimeSeries] = await Promise.all([
        getShowingsByListing(team.id, params.id, db),
        getListingShowingsSeries(params.id, db),
      ]);
      return { showings, showingsTimeSeries };
    });
  } catch {
    return { showings: [], showingsTimeSeries: null };
  }
};
