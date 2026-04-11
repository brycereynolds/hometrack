import type { PageServerLoad } from './$types';
import { getDashboardData } from '$lib/server/db/queries/dashboard.js';
import { getTeamPerformanceData } from '$lib/server/db/queries/analytics.js';
import { db } from '$lib/server/db/index.js';
import { teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

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
  teamPerformanceData: null as null,
};

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  if (!team) {
    return emptyDashboard;
  }

  try {
    const [dashData, members] = await Promise.all([
      getDashboardData(team.id),
      db
        .select({ id: teamMembers.id, name: teamMembers.name })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id)),
    ]);

    const perfRows = await getTeamPerformanceData(members.map((m) => m.id));

    const memberNames: string[] = [];
    const activeTasks: number[] = [];
    const completedThisMonth: number[] = [];
    const avgCompletionDays: number[] = [];

    for (const member of members) {
      const perf = perfRows.find((r) => r.teamMemberId === member.id);
      const parts = member.name.split(' ');
      const short = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
      memberNames.push(short);
      activeTasks.push(perf?.activeListings ?? 0);
      completedThisMonth.push(perf?.tasksCompleted ?? 0);
      avgCompletionDays.push(perf?.avgCompletionDays ?? 0);
    }

    return {
      ...dashData,
      teamPerformanceData: {
        members: memberNames,
        activeTasks,
        completedThisMonth,
        avgCompletionDays,
      },
    };
  } catch {
    return emptyDashboard;
  }
};
