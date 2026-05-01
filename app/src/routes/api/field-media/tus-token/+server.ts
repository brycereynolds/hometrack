import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

/**
 * Returns TUS upload credentials for direct browser-to-Supabase resumable uploads.
 *
 * The browser uses the returned authToken + supabaseUrl to initiate a TUS upload
 * directly to Supabase Storage's /upload/resumable endpoint.
 *
 * We return the service role key because Supabase Storage TUS requires a valid
 * auth token, and we don't have user-scoped JWTs for storage yet. The server
 * validates the user session before issuing credentials.
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
				supabaseUrl: env.SUPABASE_URL ?? '',
				authToken: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
				storagePath,
				bucketName: 'field-media',
				teamId: member.teamId,
				memberId: member.id,
				memberName: member.name,
				memberInitials: member.initials,
			};
		});

		return json(result);
	} catch (err) {
		console.error('TUS token error:', err);
		return json({ error: 'Failed to get upload credentials' }, { status: 500 });
	}
};
