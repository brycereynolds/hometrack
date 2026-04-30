import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { marketAnalyses, compListings, analysisSchedules, listings } from '$lib/server/db/schema/index.js';
import { eq, desc, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

/**
 * Scan narrative text for comp addresses and replace them with markdown links
 * to the property detail page.
 */
function linkPropertiesInNarrative(narrative: string, comps: any[]): string {
  if (!narrative || !comps?.length) return narrative;

  let result = narrative;

  // Sort by address length descending to match longer addresses first
  const sortedComps = [...comps]
    .filter((c) => c.property?.address && c.propertyId)
    .sort((a, b) => b.property.address.length - a.property.address.length);

  for (const comp of sortedComps) {
    const address = comp.property.address;
    // Extract just the street part (before city)
    const streetParts = address.split(',')[0].trim();

    if (streetParts.length < 5) continue; // Skip very short matches

    // Replace in narrative — but only if not already inside a markdown link
    const escaped = streetParts.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\[)\\b(${escaped})\\b(?![^\\[]*\\])`, 'gi');

    result = result.replace(regex, `[$1](/properties/${comp.propertyId})`);
  }

  return result;
}

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

      // Link property addresses in the latest analysis narrative
      if (analyses.length > 0 && analyses[0].aiNarrative && comps.length) {
        analyses[0] = {
          ...analyses[0],
          aiNarrative: linkPropertiesInNarrative(analyses[0].aiNarrative, comps),
        };
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

  saveSearchArea: async ({ params, locals, request }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const searchAreaStr = formData.get('searchArea') as string;

    try {
      const searchArea = searchAreaStr ? JSON.parse(searchAreaStr) : null;
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(listings)
          .set({ searchArea, updatedAt: new Date() })
          .where(eq(listings.id, params.id));
      });
      return { success: true };
    } catch {
      return fail(500, { error: 'Failed to save search area' });
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
