import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase.js';

const BUCKET = 'field-media';

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

			// Prefer processed (downscaled) video if available
			const storagePath = note.processedMediaPath ?? note.mediaStoragePath;
			if (!storagePath) return null;

			const supabase = getSupabaseAdmin();
			const { data, error } = await supabase.storage
				.from(BUCKET)
				.createSignedUrl(storagePath, 3600); // 1 hour

			if (error) throw new Error(`Signed URL failed: ${error.message}`);

			const contentType = note.mediaType === 'video' ? 'video/mp4'
				: note.mediaType === 'voice_memo' ? 'audio/webm'
				: note.mediaType === 'photo' ? 'image/jpeg'
				: 'application/octet-stream';

			return {
				url: data.signedUrl,
				contentType,
				duration: note.duration,
			};
		});

		if (!result) {
			return json({ error: 'Field note or media not found' }, { status: 404 });
		}

		return json(result);
	} catch (err) {
		console.error('Field note media error:', err);
		return json({ error: 'Failed to generate media URL' }, { status: 500 });
	}
};
