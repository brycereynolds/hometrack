import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { activityItems, listings } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

/** Public registration endpoint — used by QR code visitors, no auth required */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { listingId, guestName, guestEmail, guestPhone, guestAgent, heardAbout, source } = body;

	if (!listingId || !guestName || !guestEmail) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		// Look up listing to get teamId
		const listing = await adminDb.query.listings.findFirst({
			where: eq(listings.id, listingId),
		});

		if (!listing) {
			return json({ error: 'Listing not found' }, { status: 404 });
		}

		const id = crypto.randomUUID();
		await adminDb.insert(activityItems).values({
			id,
			teamId: listing.teamId,
			listingId,
			type: 'note',
			authorName: 'Open House',
			authorInitials: 'OH',
			content: `Open house visitor: ${guestName}`,
			metadata: {
				subtype: 'open_house_checkin',
				guestName,
				guestEmail,
				guestPhone: guestPhone || null,
				guestAgent: guestAgent || null,
				heardAbout: heardAbout || null,
				source: source || 'qr',
			},
			timestamp: new Date(),
		});

		return json({ success: true });
	} catch (err) {
		console.error('Public registration error:', err);
		return json({ error: 'Failed to register' }, { status: 500 });
	}
};
