import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { properties } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.properties.findFirst({
        where: eq(properties.id, params.id),
        columns: {
          address: true,
          city: true,
          state: true,
          beds: true,
          baths: true,
          sqft: true,
          yearBuilt: true,
          lastSoldPrice: true,
          lastSoldDate: true,
          zestimate: true,
          photos: true,
        },
      });
    });

    if (!result) {
      return json({ error: 'Property not found' }, { status: 404 });
    }

    // Extract first photo URL if available
    const photos = result.photos as Array<{ url?: string }> | null;
    const photoUrl = photos?.[0]?.url ?? null;

    return json({
      address: result.address,
      city: result.city,
      state: result.state,
      beds: result.beds,
      baths: result.baths,
      sqft: result.sqft,
      yearBuilt: result.yearBuilt,
      price: result.lastSoldPrice,
      lastSoldDate: result.lastSoldDate,
      zestimate: result.zestimate,
      photoUrl,
    });
  } catch (err) {
    console.error('Property preview error:', err);
    return json({ error: 'Failed to load property preview' }, { status: 500 });
  }
};
