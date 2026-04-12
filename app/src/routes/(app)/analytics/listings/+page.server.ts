import type { PageServerLoad } from './$types';
import { getListings } from '$lib/server/db/queries/listings.js';
import { getListingViewTimeSeries, getListingShowingsSeries } from '$lib/server/db/queries/analytics.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { viewsTimeSeries: null, showingsTimeSeries: null };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      // Use the first active listing for the aggregate overview
      const allListings = await getListings(team.id, db);
      const activeListing = allListings.find((l) => l.phase === 'active');
      if (!activeListing) {
        return { viewsTimeSeries: null, showingsTimeSeries: null };
      }

      const [viewsTimeSeries, showingsTimeSeries] = await Promise.all([
        getListingViewTimeSeries(activeListing.id, db),
        getListingShowingsSeries(activeListing.id, db),
      ]);

      return { viewsTimeSeries, showingsTimeSeries };
    });
  } catch {
    return { viewsTimeSeries: null, showingsTimeSeries: null };
  }
};
