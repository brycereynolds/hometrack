import type { PageServerLoad } from './$types';
import { getListingShowingsSeries } from '$lib/server/db/queries/analytics.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { db } from '$lib/server/db/index.js';
import { teams } from '$lib/server/db/schema/index.js';

export const load: PageServerLoad = async ({ params }) => {
  const [team] = await db.select({ id: teams.id }).from(teams).limit(1);
  if (!team) {
    return { showingsTimeSeries: null };
  }

  const allListings = await getListings(team.id);
  const listing = allListings.find((l) => l.id === params.id);
  if (!listing) {
    return { showingsTimeSeries: null };
  }

  const showingsTimeSeries = await getListingShowingsSeries(listing.id);
  return { showingsTimeSeries };
};
