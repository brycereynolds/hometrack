import type { PageServerLoad } from './$types';
import { getTeamPerformanceData } from '$lib/server/db/queries/analytics.js';
import { withRLS } from '$lib/server/db/index.js';
import { teamMembers, tasks, listings } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { teamPerformanceData: null, memberTaskCounts: [], projectedCommission: 0, ytdClosed: 0 };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [members, allTasks, allListings] = await Promise.all([
        db.query.teamMembers.findMany({
          where: eq(teamMembers.teamId, team.id),
        }),
        db.query.tasks.findMany({
          where: eq(tasks.teamId, team.id),
        }),
        db.query.listings.findMany({
          where: eq(listings.teamId, team.id),
        }),
      ]);

      const perfRows = await getTeamPerformanceData(members.map((m) => m.id), db);

      // Build chart-ready shape matching what the page expects
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

      // Per-member task counts for the member cards
      const memberTaskCounts = members.map((m) => ({
        ...m,
        activeTasks: allTasks.filter((t) => t.assigneeId === m.id && t.status !== 'done').length,
        completedTasks: allTasks.filter((t) => t.assigneeId === m.id && t.status === 'done').length,
        overdueTasks: allTasks.filter((t) => t.assigneeId === m.id && t.isOverdue).length,
      }));

      const projectedCommission = allListings.reduce((s, l) => s + (l.price ?? 0) * 0.025, 0);
      const ytdClosed = 14475000 * 0.025;

      return {
        teamPerformanceData: {
          members: memberNames,
          activeTasks,
          completedThisMonth,
          avgCompletionDays,
        },
        memberTaskCounts,
        projectedCommission,
        ytdClosed,
      };
    });
  } catch {
    return { teamPerformanceData: null, memberTaskCounts: [], projectedCommission: 0, ytdClosed: 0 };
  }
};
