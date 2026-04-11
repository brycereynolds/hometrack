import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/index.js';
import { teams } from '$lib/server/db/schema/index.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { getListingViewTimeSeries, getListingShowingsSeries } from '$lib/server/db/queries/analytics.js';

export const load: PageServerLoad = async () => {
  const [team] = await db.select({ id: teams.id }).from(teams).limit(1);
  if (!team) {
    return { viewsTimeSeries: null, showingsTimeSeries: null };
  }

  // Use the first active listing for the aggregate overview
  const allListings = await getListings(team.id);
  const activeListing = allListings.find((l) => l.phase === 'active');
  if (!activeListing) {
    return { viewsTimeSeries: null, showingsTimeSeries: null };
  }

  const [viewsTimeSeries, showingsTimeSeries] = await Promise.all([
    getListingViewTimeSeries(activeListing.id),
    getListingShowingsSeries(activeListing.id),
  ]);

  return { viewsTimeSeries, showingsTimeSeries };
};
