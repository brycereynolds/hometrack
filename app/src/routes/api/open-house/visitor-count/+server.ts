import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { activityItems, listings } from '$lib/server/db/schema/index.js';
import { eq, and, gte, sql, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	const listingId = url.searchParams.get('listingId');
	if (!listingId) {
		return json({ error: 'Missing listingId' }, { status: 400 });
	}

	const listing = await adminDb.query.listings.findFirst({
		where: eq(listings.id, listingId),
	});

	if (!listing) {
		return json({ error: 'Listing not found' }, { status: 404 });
	}

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const result = await adminDb
		.select({ count: count() })
		.from(activityItems)
		.where(
			and(
				eq(activityItems.teamId, listing.teamId),
				eq(activityItems.listingId, listingId),
				gte(activityItems.timestamp, todayStart),
				sql`${activityItems.metadata}->>'subtype' = 'open_house_checkin'`
			)
		);

	return json({ count: result[0]?.count ?? 0 });
};
