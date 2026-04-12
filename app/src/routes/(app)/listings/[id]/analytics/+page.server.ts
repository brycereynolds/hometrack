import type { PageServerLoad } from './$types';
import { getListingViewTimeSeries, getListingShowingsSeries } from '$lib/server/db/queries/analytics.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { viewsTimeSeries: null, showingsTimeSeries: null };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const allListings = await getListings(team.id, db);
      const listing = allListings.find((l) => l.id === params.id);
      if (!listing) {
        return { viewsTimeSeries: null, showingsTimeSeries: null };
      }

      const [viewsTimeSeries, showingsTimeSeries] = await Promise.all([
        getListingViewTimeSeries(listing.id, db),
        getListingShowingsSeries(listing.id, db),
      ]);

      return { viewsTimeSeries, showingsTimeSeries };
    });
  } catch {
    return { viewsTimeSeries: null, showingsTimeSeries: null };
  }
};
