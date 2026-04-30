import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { activityItems, fieldNotes, teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { startFieldMediaWorkflow } from '$lib/server/temporal.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { storagePath, listingId, fileName, fileSize, contentType, teamId, memberId, memberName, memberInitials } = await request.json();

	if (!storagePath || !contentType) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const isVideo = contentType.startsWith('video/');

	try {
		const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
			// Create field_notes record
			const fieldNoteId = crypto.randomUUID();
			await db.insert(fieldNotes).values({
				id: fieldNoteId,
				teamId,
				listingId: listingId ?? null,
				authorId: memberId,
				mediaType: isVideo ? 'video' : 'photo',
				status: 'pending',
				contentHash: `${fileName}-${fileSize}-${Date.now()}`,
				tag: 'general',
				mediaStoragePath: storagePath,
			});

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
					fieldNoteId,
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
					fieldNoteId,
				},
			}) : null;

			return { fieldNoteId, storagePath, workflowId: workflow?.workflowId ?? null };
		});

		return json({ success: true, ...result });
	} catch (err) {
		console.error('Complete upload error:', err);
		return json({ error: 'Failed to complete upload' }, { status: 500 });
	}
};
