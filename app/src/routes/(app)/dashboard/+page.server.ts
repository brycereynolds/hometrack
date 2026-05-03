import type { PageServerLoad } from './$types';
import { getDashboardData } from '$lib/server/db/queries/dashboard.js';
import { withRLS } from '$lib/server/db/index.js';

const emptyDashboard = {
  listings: [],
  listingsCount: 0,
  pipelineValue: 0,
  tasks: [],
  overdueTasks: [],
  overdueTasksCount: 0,
  recentActivity: [],
  aiInsights: [],
  showings: [],
};

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return emptyDashboard;
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getDashboardData(team.id, db);
    });
  } catch {
    return emptyDashboard;
  }
};
