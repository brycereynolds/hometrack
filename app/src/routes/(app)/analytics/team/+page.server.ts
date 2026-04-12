import type { PageServerLoad } from './$types';
import { getTeamPerformanceData } from '$lib/server/db/queries/analytics.js';
import { withRLS } from '$lib/server/db/index.js';
import { teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { teamPerformanceData: null };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const members = await db
        .select({ id: teamMembers.id, name: teamMembers.name })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));

      const perfRows = await getTeamPerformanceData(members.map((m) => m.id), db);

      // Build chart-ready shape matching what the page expects
      const memberNames: string[] = [];
      const activeTasks: number[] = [];
      const completedThisMonth: number[] = [];
      const avgCompletionDays: number[] = [];

      for (const member of members) {
        const perf = perfRows.find((r) => r.teamMemberId === member.id);
        // Abbreviate name: "Lauren Chen" -> "Lauren C."
        const parts = member.name.split(' ');
        const short = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
        memberNames.push(short);
        activeTasks.push(perf?.activeListings ?? 0);
        completedThisMonth.push(perf?.tasksCompleted ?? 0);
        avgCompletionDays.push(perf?.avgCompletionDays ?? 0);
      }

      return {
        teamPerformanceData: {
          members: memberNames,
          activeTasks,
          completedThisMonth,
          avgCompletionDays,
        },
      };
    });
  } catch {
    return { teamPerformanceData: null };
  }
};
