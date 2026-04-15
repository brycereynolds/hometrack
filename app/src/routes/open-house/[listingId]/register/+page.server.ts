import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { listings } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
  const listing = await adminDb.query.listings.findFirst({
    where: eq(listings.id, params.listingId),
  });

  if (!listing) {
    throw error(404, 'Listing not found');
  }

  return {
    listing: {
      id: listing.id,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip: listing.zip,
      price: listing.price,
      photoUrl: listing.photoUrl,
    },
    source: url.searchParams.get('source') || 'direct',
  };
};
