import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { adminDb } from '$lib/server/db/index.js';
import { activityItems, teamMembers, listings } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

/** Authenticated check-in (from mobile open house page) */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { listingId, guestName, guestEmail, guestPhone, guestAgent, heardAbout } = body;

	if (!listingId || !guestName || !guestEmail) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		await withRLS(locals.user.id, 'authenticated', async (db) => {
			const member = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.userId, locals.user!.id),
			});
			if (!member) throw new Error('Team member not found');

			const id = crypto.randomUUID();
			await db.insert(activityItems).values({
				id,
				teamId: member.teamId,
				listingId,
				type: 'note',
				authorId: member.id,
				authorName: member.name,
				authorInitials: member.initials,
				content: `Open house check-in: ${guestName}`,
				metadata: {
					subtype: 'open_house_checkin',
					guestName,
					guestEmail,
					guestPhone: guestPhone || null,
					guestAgent: guestAgent || null,
					heardAbout: heardAbout || null,
				},
				timestamp: new Date(),
			});
		});

		return json({ success: true });
	} catch (err) {
		console.error('Check-in error:', err);
		return json({ error: 'Failed to save check-in' }, { status: 500 });
	}
};
