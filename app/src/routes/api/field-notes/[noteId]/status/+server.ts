import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes, fieldNoteFrames, fieldNoteMoments, fieldNoteActions } from '$lib/server/db/schema/index.js';
import { eq, and, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { noteId } = params;

	try {
		const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
			const note = await db.query.fieldNotes.findFirst({
				where: eq(fieldNotes.id, noteId),
			});

			if (!note) return null;

			const [frameResult] = await db
				.select({ value: count() })
				.from(fieldNoteFrames)
				.where(eq(fieldNoteFrames.fieldNoteId, noteId));

			const [momentResult] = await db
				.select({ value: count() })
				.from(fieldNoteMoments)
				.where(eq(fieldNoteMoments.fieldNoteId, noteId));

			const [actionResult] = await db
				.select({ value: count() })
				.from(fieldNoteActions)
				.where(eq(fieldNoteActions.fieldNoteId, noteId));

			return {
				status: note.status,
				stages: note.processingStages ?? [],
				frameCount: frameResult?.value ?? 0,
				momentCount: momentResult?.value ?? 0,
				actionCount: actionResult?.value ?? 0,
				processingError: note.processingError,
			};
		});

		if (!result) {
			return json({ error: 'Field note not found' }, { status: 404 });
		}

		return json(result);
	} catch (err) {
		console.error('Field note status error:', err);
		return json({ error: 'Failed to get status' }, { status: 500 });
	}
};
