import type { LayoutServerLoad } from './$types';
import { getListingById } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: LayoutServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { listing: null };
  }

  try {
    const listing = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getListingById(team.id, params.id, db);
    });
    return { listing: listing ?? null };
  } catch {
    return { listing: null };
  }
};
