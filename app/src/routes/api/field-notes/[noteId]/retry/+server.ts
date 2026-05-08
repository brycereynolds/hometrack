import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import {
	fieldNotes, teamMembers,
	fieldNoteTranscripts, fieldNoteFrames, fieldNoteMoments, fieldNoteActions,
} from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { startFieldMediaWorkflow } from '$lib/server/temporal.js';

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { noteId } = params;

	try {
		const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
			const note = await db.query.fieldNotes.findFirst({
				where: eq(fieldNotes.id, noteId),
			});
			if (!note) throw new Error('Field note not found');
			if (!note.mediaStoragePath) throw new Error('No media to process');

			// Delete old processing results to avoid duplicates on retry
			await db.delete(fieldNoteActions).where(eq(fieldNoteActions.fieldNoteId, noteId));
			await db.delete(fieldNoteMoments).where(eq(fieldNoteMoments.fieldNoteId, noteId));
			await db.delete(fieldNoteFrames).where(eq(fieldNoteFrames.fieldNoteId, noteId));
			await db.delete(fieldNoteTranscripts).where(eq(fieldNoteTranscripts.fieldNoteId, noteId));

			// Reset status and clear old processing data
			await db.update(fieldNotes)
				.set({
					status: 'pending',
					summary: null,
					processingStages: null,
					processingError: null,
					processingCompletedAt: null,
					frameCount: null,
					duration: null,
					updatedAt: new Date(),
				})
				.where(eq(fieldNotes.id, noteId));

			// Re-trigger the workflow
			const isVideo = note.mediaType === 'video';
			const isVoiceMemo = note.mediaType === 'voice_memo';
			if (!isVideo && !isVoiceMemo) {
				return { success: true, message: 'Nothing to reprocess' };
			}

			const member = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.id, note.authorId),
			});

			const workflow = await startFieldMediaWorkflow({
				mediaType: note.mediaType as 'video' | 'voice_memo',
				storagePath: note.mediaStoragePath,
				listingId: note.listingId ?? null,
				teamId: note.teamId,
				authorId: note.authorId,
				authorName: member?.name ?? 'Unknown',
				metadata: {
					fieldNoteId: noteId,
				},
			});

			if (workflow?.workflowId) {
				await db.update(fieldNotes)
					.set({ workflowId: workflow.workflowId })
					.where(eq(fieldNotes.id, noteId));
			}

			return { success: true, workflowId: workflow?.workflowId };
		});

		return json(result);
	} catch (err) {
		console.error('Retry processing error:', err);
		return json({ error: 'Failed to retry processing' }, { status: 500 });
	}
};
