import type { PageServerLoad } from './$types';
import { getDashboardData } from '$lib/server/db/queries/dashboard.js';

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  if (!team) {
    return {
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
  }

  try {
    return await getDashboardData(team.id);
  } catch {
    return {
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
  }
};
