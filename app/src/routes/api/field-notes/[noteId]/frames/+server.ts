import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNoteFrames } from '$lib/server/db/schema/index.js';
import { eq, asc } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase.js';

const BUCKET = 'field-media';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { noteId } = params;

	try {
		const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
			const frames = await db.query.fieldNoteFrames.findMany({
				where: eq(fieldNoteFrames.fieldNoteId, noteId),
				orderBy: asc(fieldNoteFrames.frameIndex),
			});

			if (frames.length === 0) return [];

			const supabase = getSupabaseAdmin();

			const signedFrames = await Promise.all(
				frames.map(async (frame) => {
					let url = '';
					if (frame.storagePath) {
						const { data, error } = await supabase.storage
							.from(BUCKET)
							.createSignedUrl(frame.storagePath, 3600);
						if (!error && data) {
							url = data.signedUrl;
						}
					}

					return {
						frameIndex: frame.frameIndex,
						timestamp: frame.timestamp,
						url,
						caption: frame.caption,
					};
				}),
			);

			return signedFrames;
		});

		return json(result);
	} catch (err) {
		console.error('Field note frames error:', err);
		return json({ error: 'Failed to get frames' }, { status: 500 });
	}
};
