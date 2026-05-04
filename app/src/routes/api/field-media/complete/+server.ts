import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes, fieldNoteAttachments } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { startFieldMediaWorkflow } from '$lib/server/temporal.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { noteId, storagePath, listingId, fileName, fileSize, contentType, teamId, memberId, memberName } = await request.json();

	if (!storagePath || !contentType) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	if (!noteId) {
		return json({ error: 'Missing noteId' }, { status: 400 });
	}

	const isVideo = contentType.startsWith('video/');

	try {
		const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
			// Insert attachment record
			const attachmentId = crypto.randomUUID();
			await db.insert(fieldNoteAttachments).values({
				id: attachmentId,
				fieldNoteId: noteId,
				fileName: fileName ?? 'unknown',
				storagePath,
				contentType,
				fileSize: fileSize ?? null,
			});

			// Only upgrade mediaType from the default 'text'
			// Don't overwrite voice_memo or existing video
			const currentNote = await db.query.fieldNotes.findFirst({
				where: eq(fieldNotes.id, noteId),
				columns: { mediaType: true },
			});
			const newMediaType = currentNote?.mediaType === 'text'
				? (isVideo ? 'video' : 'photo')
				: currentNote?.mediaType;

			// Update the field_notes record with media info
			await db.update(fieldNotes)
				.set({
					mediaType: newMediaType,
					mediaStoragePath: storagePath,
					status: isVideo ? 'pending' : 'completed',
					contentHash: `${fileName}-${fileSize}-${Date.now()}`,
					updatedAt: new Date(),
				})
				.where(eq(fieldNotes.id, noteId));

			// Trigger Temporal workflow for video processing
			const workflow = isVideo ? await startFieldMediaWorkflow({
				mediaType: 'video',
				storagePath,
				listingId: listingId ?? null,
				teamId,
				authorId: memberId,
				authorName: memberName,
				metadata: {
					mimeType: contentType,
					fileSize,
					originalName: fileName,
					fieldNoteId: noteId,
				},
			}) : null;

			// Save workflow ID so we can check status later
			if (workflow?.workflowId) {
				await db.update(fieldNotes)
					.set({ workflowId: workflow.workflowId })
					.where(eq(fieldNotes.id, noteId));
			}

			return { fieldNoteId: noteId, attachmentId, storagePath, workflowId: workflow?.workflowId ?? null };
		});

		return json({ success: true, ...result });
	} catch (err) {
		console.error('Complete upload error:', err);
		return json({ error: 'Failed to complete upload' }, { status: 500 });
	}
};
