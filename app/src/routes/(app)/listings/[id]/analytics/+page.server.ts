import type { PageServerLoad } from './$types';
import { getListingViewTimeSeries, getListingShowingsSeries } from '$lib/server/db/queries/analytics.js';
import { getInsightsByListing, getCompSales } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { viewsTimeSeries: null, showingsTimeSeries: null, aiInsights: [], compSales: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [viewsTimeSeries, showingsTimeSeries, aiInsights, compSales] = await Promise.all([
        getListingViewTimeSeries(params.id, db),
        getListingShowingsSeries(params.id, db),
        getInsightsByListing(team.id, params.id, db),
        getCompSales(team.id, db),
      ]);

      return { viewsTimeSeries, showingsTimeSeries, aiInsights, compSales };
    });
  } catch {
    return { viewsTimeSeries: null, showingsTimeSeries: null, aiInsights: [], compSales: [] };
  }
};
