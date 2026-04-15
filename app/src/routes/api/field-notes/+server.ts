import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes, teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { content, listingId, tag, teamId } = body;

	if (!content?.trim()) {
		return json({ error: 'Note content is required' }, { status: 400 });
	}
	if (!teamId) {
		return json({ error: 'Team context missing' }, { status: 400 });
	}
	if (!tag || !['showing', 'vendor', 'client', 'general'].includes(tag)) {
		return json({ error: 'Invalid tag' }, { status: 400 });
	}

	try {
		const noteId = nanoid();
		await withRLS(locals.user.id, 'authenticated', async (db) => {
			await db.insert(fieldNotes).values({
				id: noteId,
				teamId,
				listingId: listingId || null,
				tag: tag as 'showing' | 'vendor' | 'client',
				textContent: content.trim(),
				mediaType: 'text',
				status: 'completed',
				authorId: locals.user!.id,
			});
		});

		return json({ success: true, noteId, listingId: listingId || null });
	} catch (err) {
		console.error('Save field note error:', err);
		return json({ error: 'Failed to save note' }, { status: 500 });
	}
};
