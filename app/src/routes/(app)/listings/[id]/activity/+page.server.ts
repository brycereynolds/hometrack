import type { PageServerLoad } from './$types';
import { getActivityByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { activityItems: [] };
  }

  try {
    const activityItems = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getActivityByListing(team.id, params.id, db);
    });
    return { activityItems };
  } catch {
    return { activityItems: [] };
  }
};
