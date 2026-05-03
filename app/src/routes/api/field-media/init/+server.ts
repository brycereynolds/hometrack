import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Initialize a file upload: generate the storage path and return team info.
 *
 * Called before starting a TUS upload so the browser knows the
 * objectName for TUS metadata and has team context for the complete step.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { fileName, listingId, contentType } = await request.json();
	if (!fileName || !contentType) {
		return json({ error: 'Missing fileName or contentType' }, { status: 400 });
	}

	try {
		const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
			const member = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.userId, locals.user!.id),
			});
			if (!member) throw new Error('Team member not found');

			const timestamp = Date.now();
			const ext = fileName.split('.').pop() ?? 'mp4';
			const storagePath = `${member.teamId}/${listingId ?? 'general'}/${timestamp}.${ext}`;

			return {
				storagePath,
				bucketName: 'field-media',
				teamId: member.teamId,
				memberId: member.id,
				memberName: member.name,
			};
		});

		return json(result);
	} catch (err) {
		console.error('Upload init error:', err);
		return json({ error: 'Failed to initialize upload' }, { status: 500 });
	}
};
