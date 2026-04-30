import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { properties, compListings, listings, marketAnalyses } from '$lib/server/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      // Fetch property by ID
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, params.id),
      });

      if (!property) {
        throw error(404, 'Property not found');
      }

      // Find comp_listings that reference this property (which analyses it appeared in)
      const compAppearances = await db
        .select({
          compId: compListings.id,
          analysisId: compListings.marketAnalysisId,
          distanceMiles: compListings.distanceMiles,
          price: compListings.price,
          status: compListings.status,
          createdAt: compListings.createdAt,
          analysisStatus: marketAnalyses.status,
          listingId: marketAnalyses.listingId,
          listingAddress: properties.address,
          listingCity: properties.city,
          listingState: properties.state,
        })
        .from(compListings)
        .innerJoin(marketAnalyses, eq(compListings.marketAnalysisId, marketAnalyses.id))
        .innerJoin(listings, eq(marketAnalyses.listingId, listings.id))
        .innerJoin(properties, eq(listings.propertyId, properties.id))
        .where(eq(compListings.propertyId, params.id))
        .orderBy(desc(compListings.createdAt));

      // Find listings that reference this property
      const linkedListings = await db
        .select({
          id: listings.id,
          address: properties.address,
          city: properties.city,
          state: properties.state,
          price: listings.price,
          phase: listings.phase,
        })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.id))
        .where(eq(listings.propertyId, params.id));

      return {
        property,
        compAppearances,
        linkedListings,
      };
    });
  } catch (err: any) {
    if (err?.status === 404) throw err;
    console.error('Property load error:', err);
    throw error(500, 'Failed to load property');
  }
};
