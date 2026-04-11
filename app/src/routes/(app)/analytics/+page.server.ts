import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/index.js';
import { teams } from '$lib/server/db/schema/index.js';
import { getPipelineTimeSeries } from '$lib/server/db/queries/analytics.js';

export const load: PageServerLoad = async () => {
  const [team] = await db.select({ id: teams.id }).from(teams).limit(1);
  if (!team) {
    return { pipelineValueTimeSeries: null };
  }

  const pipelineValueTimeSeries = await getPipelineTimeSeries(team.id);
  return { pipelineValueTimeSeries };
};
