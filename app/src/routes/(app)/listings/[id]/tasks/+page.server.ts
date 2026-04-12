import type { PageServerLoad } from './$types';
import { getTasksByListing } from '$lib/server/db/queries/tasks.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { tasks: [] };
  }

  try {
    const tasks = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getTasksByListing(team.id, params.id, db);
    });
    return { tasks };
  } catch {
    return { tasks: [] };
  }
};
