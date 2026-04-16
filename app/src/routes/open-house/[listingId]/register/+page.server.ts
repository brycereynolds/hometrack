import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { listings } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
  const listing = await adminDb.query.listings.findFirst({
    where: eq(listings.id, params.listingId),
    with: { property: true },
  });

  if (!listing) {
    throw error(404, 'Listing not found');
  }

  return {
    listing: {
      id: listing.id,
      address: listing.property.address,
      city: listing.property.city,
      state: listing.property.state,
      zip: listing.property.zip,
      price: listing.price,
      photoUrl: (listing.property.photos as { url: string }[])?.[0]?.url ?? null,
    },
    source: url.searchParams.get('source') || 'direct',
  };
};
