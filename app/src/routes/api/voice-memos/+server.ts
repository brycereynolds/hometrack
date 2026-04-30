import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { activityItems, teamMembers, fieldNotes } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase.js';
import { startFieldMediaWorkflow } from '$lib/server/temporal.js';

const BUCKET = 'voice-memos';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get('audio') as File | null;
	const listingId = formData.get('listingId') as string | null;
	const duration = parseInt(formData.get('duration') as string, 10) || 0;

	if (!file) {
		return json({ error: 'Missing audio file' }, { status: 400 });
	}

	try {
		const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
			const member = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.userId, locals.user!.id),
			});
			if (!member) throw new Error('Team member not found');

			// Upload to Supabase Storage
			const timestamp = Date.now();
			const storagePath = `${member.teamId}/${listingId ?? 'general'}/${timestamp}.webm`;
			const supabase = getSupabaseAdmin();
			const { error: uploadError } = await supabase.storage
				.from(BUCKET)
				.upload(storagePath, file, {
					contentType: 'audio/webm',
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
				mediaType: 'voice_memo',
				status: 'pending',
				contentHash: `voice-${timestamp}-${file.size}`,
				tag: 'general',
				mediaStoragePath: storagePath,
				duration,
			});

			// Insert activity item
			const activityId = crypto.randomUUID();
			await db.insert(activityItems).values({
				id: activityId,
				teamId: member.teamId,
				listingId: listingId ?? null,
				type: 'voice_memo',
				authorId: member.id,
				authorName: member.name,
				authorInitials: member.initials,
				content: `Voice memo (${formatDuration(duration)})`,
				metadata: {
					storagePath,
					bucket: BUCKET,
					duration,
					mimeType: 'audio/webm',
					fileSize: file.size,
					fieldNoteId,
				},
				timestamp: new Date(),
			});

			// Trigger Temporal workflow for transcription
			const workflow = await startFieldMediaWorkflow({
				mediaType: 'voice_memo',
				storagePath: `${BUCKET}/${storagePath}`,
				listingId: listingId ?? null,
				teamId: member.teamId,
				authorId: member.id,
				authorName: member.name,
				metadata: {
					duration,
					mimeType: 'audio/webm',
					fileSize: file.size,
					fieldNoteId,
				},
			});

			return { id: activityId, fieldNoteId, storagePath, workflowId: workflow?.workflowId ?? null };
		});

		return json({ success: true, ...result });
	} catch (err) {
		console.error('Voice memo upload error:', err);
		return json({ error: 'Failed to save voice memo' }, { status: 500 });
	}
};

function formatDuration(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}
