import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes, teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { textContent, listingId, teamId } = await request.json();

	try {
		const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
			const member = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.userId, locals.user!.id),
			});
			if (!member) throw new Error('Team member not found');

			const noteId = crypto.randomUUID();
			await db.insert(fieldNotes).values({
				id: noteId,
				teamId: member.teamId,
				listingId: listingId || null,
				authorId: member.id,
				mediaType: 'text',
				status: 'completed',
				tag: 'general',
				textContent: textContent?.trim() || null,
			});

			return {
				noteId,
				teamId: member.teamId,
				memberId: member.id,
				memberName: member.name,
				memberInitials: member.initials,
			};
		});

		return json({ success: true, ...result });
	} catch (err) {
		console.error('Create note error:', err);
		return json({ error: 'Failed to create note' }, { status: 500 });
	}
};
