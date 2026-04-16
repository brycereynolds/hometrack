import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { listings, activityItems } from '$lib/server/db/schema/index.js';
import { eq, and, gte, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, url }) => {
  const listing = await adminDb.query.listings.findFirst({
    where: eq(listings.id, params.listingId),
    with: { property: true },
  });

  if (!listing) {
    throw error(404, 'Listing not found');
  }

  // Count today's visitors
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const checkIns = await adminDb
    .select()
    .from(activityItems)
    .where(
      and(
        eq(activityItems.teamId, listing.teamId),
        eq(activityItems.listingId, listing.id),
        gte(activityItems.timestamp, todayStart),
        sql`${activityItems.metadata}->>'subtype' = 'open_house_checkin'`
      )
    );

  // Build the QR code URL — links to the visitor registration form
  const baseUrl = env.PUBLIC_BASE_URL || url.origin;
  const registerUrl = `${baseUrl}/open-house/${params.listingId}/register?source=qr`;

  return {
    listing: {
      id: listing.id,
      address: listing.property.address,
      city: listing.property.city,
      state: listing.property.state,
      zip: listing.property.zip,
      price: listing.price,
      beds: listing.property.beds,
      baths: listing.property.baths,
      sqft: listing.property.sqft,
      photoUrl: (listing.property.photos as { url: string }[])?.[0]?.url ?? null,
    },
    visitorCount: checkIns.length,
    registerUrl,
  };
};
