import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { aiInsights } from '$lib/server/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { aiInsights: [] };
  }

  try {
    const insights = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.aiInsights.findMany({
        where: eq(aiInsights.teamId, team.id),
        orderBy: desc(aiInsights.timestamp),
      });
    });
    return { aiInsights: insights };
  } catch {
    return { aiInsights: [] };
  }
};
