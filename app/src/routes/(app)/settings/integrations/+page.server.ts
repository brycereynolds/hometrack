import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { integrations } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { integrations: [] };
  }

  try {
    const integrationList = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.integrations.findMany({
        where: eq(integrations.teamId, team.id),
        with: {
          connectedBy: true,
        },
      });
    });

    return { integrations: integrationList };
  } catch {
    return { integrations: [] };
  }
};
