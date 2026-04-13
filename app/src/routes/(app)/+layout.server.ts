import type { LayoutServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { teamMembers, listings as listingsTable, aiInsights as aiInsightsTable } from '$lib/server/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const membership = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, locals.user!.id),
        with: { team: { with: { members: true } } },
      });
      if (!membership?.team) return null;

      const [allListings, insights] = await Promise.all([
        db.query.listings.findMany({
          where: eq(listingsTable.teamId, membership.team.id),
          with: { agent: true, client: true },
        }),
        db.query.aiInsights.findMany({
          where: eq(aiInsightsTable.teamId, membership.team.id),
          orderBy: desc(aiInsightsTable.timestamp),
        }),
      ]);

      return { team: membership.team, membership, listings: allListings, aiInsights: insights };
    });

    if (!result) {
      return { team: null, teamMembers: [], currentUser: null, listings: [], aiInsights: [] };
    }

    return {
      team: result.team,
      teamMembers: result.team.members,
      currentUser: result.membership,
      listings: result.listings,
      aiInsights: result.aiInsights,
    };
  } catch (err) {
    console.error('Layout load error:', err);
    return { team: null, teamMembers: [], currentUser: null, listings: [], aiInsights: [] };
  }
};
