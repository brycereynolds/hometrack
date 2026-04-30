import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { activityItems, teamMembers, fieldNotes } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase.js';
import { startFieldMediaWorkflow } from '$lib/server/temporal.js';

const BUCKET = 'field-media';

const ALLOWED_TYPES = new Set([
	'video/mp4',
	'video/quicktime',
	'video/webm',
	'image/jpeg',
	'image/png',
	'image/webp',
	'application/pdf',
]);

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const listingId = formData.get('listingId') as string | null;

	if (!file) {
		return json({ error: 'Missing file' }, { status: 400 });
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		return json({ error: 'Unsupported file type' }, { status: 400 });
	}

	const isVideo = file.type.startsWith('video/');

	try {
		const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
			const member = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.userId, locals.user!.id),
			});
			if (!member) throw new Error('Team member not found');

			// Upload to Supabase Storage
			const timestamp = Date.now();
			const ext = file.name.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg');
			const storagePath = `${member.teamId}/${listingId ?? 'general'}/${timestamp}.${ext}`;
			const supabase = getSupabaseAdmin();
			const { error: uploadError } = await supabase.storage
				.from(BUCKET)
				.upload(storagePath, file, {
					contentType: file.type,
					upsert: false,
				});

			if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

			// Create field_notes record BEFORE triggering workflow
			const fieldNoteId = crypto.randomUUID();
			await db.insert(fieldNotes).values({
				id: fieldNoteId,
				teamId: member.teamId,
				listingId: listingId ?? null,
				authorId: member.id,
				mediaType: isVideo ? 'video' : 'photo',
				status: 'pending',
				contentHash: `${file.name}-${file.size}-${timestamp}`,
				tag: 'general',
				mediaStoragePath: storagePath,
			});

			// Insert activity item
			const activityId = crypto.randomUUID();
			const type = 'note' as const;
			await db.insert(activityItems).values({
				id: activityId,
				teamId: member.teamId,
				listingId: listingId ?? null,
				type,
				authorId: member.id,
				authorName: member.name,
				authorInitials: member.initials,
				content: `${isVideo ? 'Video' : 'Photo'} uploaded`,
				metadata: {
					storagePath,
					bucket: BUCKET,
					mimeType: file.type,
					fileSize: file.size,
					originalName: file.name,
					fieldNoteId,
				},
				timestamp: new Date(),
			});

			// Trigger Temporal workflow for video processing (photos don't need pipeline)
			const workflow = isVideo ? await startFieldMediaWorkflow({
				mediaType: 'video',
				storagePath: `${BUCKET}/${storagePath}`,
				listingId: listingId ?? null,
				teamId: member.teamId,
				authorId: member.id,
				authorName: member.name,
				metadata: {
					mimeType: file.type,
					fileSize: file.size,
					originalName: file.name,
					fieldNoteId,
				},
			}) : null;

			return { id: activityId, fieldNoteId, storagePath, workflowId: workflow?.workflowId ?? null };
		});

		return json({ success: true, ...result });
	} catch (err) {
		console.error('Field media upload error:', err);
		return json({ error: 'Failed to upload media' }, { status: 500 });
	}
};
