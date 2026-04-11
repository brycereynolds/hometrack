import type { PageServerLoad } from './$types';
import { getListingViewTimeSeries, getListingShowingsSeries } from '$lib/server/db/queries/analytics.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { db } from '$lib/server/db/index.js';
import { teams } from '$lib/server/db/schema/index.js';

export const load: PageServerLoad = async ({ params }) => {
  // Get the first team (single-tenant for now)
  const [team] = await db.select({ id: teams.id }).from(teams).limit(1);
  if (!team) {
    return { viewsTimeSeries: null, showingsTimeSeries: null };
  }

  const allListings = await getListings(team.id);
  const listing = allListings.find((l) => l.id === params.id);
  if (!listing) {
    return { viewsTimeSeries: null, showingsTimeSeries: null };
  }

  const [viewsTimeSeries, showingsTimeSeries] = await Promise.all([
    getListingViewTimeSeries(listing.id),
    getListingShowingsSeries(listing.id),
  ]);

  return { viewsTimeSeries, showingsTimeSeries };
};
