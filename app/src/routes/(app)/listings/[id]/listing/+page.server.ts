import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { marketAnalyses, compListings, analysisSchedules, listings } from '$lib/server/db/schema/index.js';
import { eq, desc, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

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

      let comps: any[] = [];
      if (analyses.length > 0) {
        comps = await db.query.compListings.findMany({
          where: eq(compListings.marketAnalysisId, analyses[0].id),
          with: { property: true },
        });
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

export const actions: Actions = {
  setPrice: async ({ params, locals, request }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const priceStr = formData.get('price') as string;

    if (!priceStr) return fail(400, { error: 'Price is required' });

    const price = parseFloat(priceStr.replace(/[,$]/g, ''));
    if (isNaN(price) || price <= 0) return fail(400, { error: 'Invalid price' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(listings)
          .set({ price, updatedAt: new Date() })
          .where(eq(listings.id, params.id));
      });
      return { success: true };
    } catch {
      return fail(500, { error: 'Failed to update price' });
    }
  },

  toggleConfirmedComp: async ({ locals, request }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const compId = formData.get('compId') as string;

    if (!compId) return fail(400, { error: 'Comp ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(compListings)
          .set({
            isConfirmedComp: sql`NOT is_confirmed_comp`,
            updatedAt: new Date(),
          })
          .where(eq(compListings.id, compId));
      });
      return { success: true };
    } catch {
      return fail(500, { error: 'Failed to toggle comp' });
    }
  },
};
