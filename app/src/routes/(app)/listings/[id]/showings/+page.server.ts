import type { PageServerLoad } from './$types';
import { getListingShowingsSeries } from '$lib/server/db/queries/analytics.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { showingsTimeSeries: null };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const allListings = await getListings(team.id, db);
      const listing = allListings.find((l) => l.id === params.id);
      if (!listing) {
        return { showingsTimeSeries: null };
      }

      const showingsTimeSeries = await getListingShowingsSeries(listing.id, db);
      return { showingsTimeSeries };
    });
  } catch {
    return { showingsTimeSeries: null };
  }
};
