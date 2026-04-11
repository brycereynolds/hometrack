import type { LayoutServerLoad } from './$types';
import { getListingById } from '$lib/server/db/queries/listings.js';

export const load: LayoutServerLoad = async ({ params, parent }) => {
  const { team } = await parent();

  if (!team) {
    return { listing: null };
  }

  try {
    const listing = await getListingById(team.id, params.id);
    return { listing: listing ?? null };
  } catch {
    return { listing: null };
  }
};
