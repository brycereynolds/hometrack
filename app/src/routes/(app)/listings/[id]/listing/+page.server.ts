import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { marketAnalyses, compListings, analysisSchedules, listings } from '$lib/server/db/schema/index.js';
import { eq, desc, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team, listing } = await parent();

  if (!team || !locals.user || !listing) {
    return { analyses: [], comps: [], schedule: null };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const analyses = await db
        .select()
        .from(marketAnalyses)
        .where(eq(marketAnalyses.listingId, params.id))
        .orderBy(desc(marketAnalyses.createdAt));

      let comps: (typeof compListings.$inferSelect)[] = [];
      if (analyses.length > 0) {
        comps = await db
          .select()
          .from(compListings)
          .where(eq(compListings.marketAnalysisId, analyses[0].id));
      }

      const schedule = await db.query.analysisSchedules.findFirst({
        where: eq(analysisSchedules.listingId, params.id),
      });

      return {
        analyses,
        comps,
        schedule: schedule ?? null,
      };
    });
  } catch {
    return { analyses: [], comps: [], schedule: null };
  }
};
