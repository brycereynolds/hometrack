import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { tasks } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { tasks: [], listings: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [taskList, listingList] = await Promise.all([
        db.query.tasks.findMany({
          where: eq(tasks.teamId, team.id),
          with: {
            assignee: true,
            listing: true,
          },
        }),
        getListings(team.id, db),
      ]);

      return { tasks: taskList, listings: listingList };
    });
  } catch {
    return { tasks: [], listings: [] };
  }
};
