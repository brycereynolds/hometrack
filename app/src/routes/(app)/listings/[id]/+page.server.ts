import type { PageServerLoad } from './$types';
import { getTasksByListing } from '$lib/server/db/queries/tasks.js';
import { getActivityByListing, getInsightsByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { tasks: [], activityItems: [], aiInsights: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [tasks, activityItems, aiInsights] = await Promise.all([
        getTasksByListing(team.id, params.id, db),
        getActivityByListing(team.id, params.id, db),
        getInsightsByListing(team.id, params.id, db),
      ]);
      return { tasks, activityItems, aiInsights };
    });
  } catch {
    return { tasks: [], activityItems: [], aiInsights: [] };
  }
};
