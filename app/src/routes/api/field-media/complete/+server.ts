import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { activityItems, fieldNotes, fieldNoteAttachments, teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { startFieldMediaWorkflow } from '$lib/server/temporal.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { noteId, storagePath, listingId, fileName, fileSize, contentType, teamId, memberId, memberName, memberInitials } = await request.json();

	if (!storagePath || !contentType) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	if (!noteId) {
		return json({ error: 'Missing noteId' }, { status: 400 });
	}

	const isVideo = contentType.startsWith('video/');
	const isPhoto = contentType.startsWith('image/');
	const mediaType = isVideo ? 'video' : isPhoto ? 'photo' : 'photo';

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

			// Update the field_notes record with media info
			await db.update(fieldNotes)
				.set({
					mediaType,
					mediaStoragePath: storagePath,
					status: isVideo ? 'pending' : 'completed',
					contentHash: `${fileName}-${fileSize}-${Date.now()}`,
					updatedAt: new Date(),
				})
				.where(eq(fieldNotes.id, noteId));

			// Insert activity item
			const activityId = crypto.randomUUID();
			await db.insert(activityItems).values({
				id: activityId,
				teamId,
				listingId: listingId ?? null,
				type: 'note' as const,
				authorId: memberId,
				authorName: memberName,
				authorInitials: memberInitials,
				content: `${isVideo ? 'Video' : 'Photo'} uploaded`,
				metadata: {
					storagePath,
					bucket: 'field-media',
					mimeType: contentType,
					fileSize,
					originalName: fileName,
					fieldNoteId: noteId,
				},
				timestamp: new Date(),
			});

			// Trigger Temporal workflow for video processing
			const workflow = isVideo ? await startFieldMediaWorkflow({
				mediaType: 'video',
				storagePath: `field-media/${storagePath}`,
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

			return { fieldNoteId: noteId, attachmentId, storagePath, workflowId: workflow?.workflowId ?? null };
		});

		return json({ success: true, ...result });
	} catch (err) {
		console.error('Complete upload error:', err);
		return json({ error: 'Failed to complete upload' }, { status: 500 });
	}
};
