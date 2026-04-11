import type { PageServerLoad } from './$types';
import { getListings } from '$lib/server/db/queries/listings.js';

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  if (!team) {
    return { listings: [] };
  }

  try {
    const listings = await getListings(team.id);
    return { listings };
  } catch {
    return { listings: [] };
  }
};
