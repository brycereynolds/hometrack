import type { PageServerLoad } from './$types';
import { getPipelineTimeSeries } from '$lib/server/db/queries/analytics.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { pipelineValueTimeSeries: null };
  }

  try {
    const pipelineValueTimeSeries = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getPipelineTimeSeries(team.id, db);
    });
    return { pipelineValueTimeSeries };
  } catch {
    return { pipelineValueTimeSeries: null };
  }
};
