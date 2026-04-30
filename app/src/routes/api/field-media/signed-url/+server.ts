import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase.js';

const BUCKET = 'field-media';

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

			const supabase = getSupabaseAdmin();
			const { data, error } = await supabase.storage
				.from(BUCKET)
				.createSignedUploadUrl(storagePath, { upsert: false });

			if (error) throw new Error(`Signed URL failed: ${error.message}`);

			return {
				signedUrl: data.signedUrl,
				token: data.token,
				path: data.path,
				storagePath,
				teamId: member.teamId,
				memberId: member.id,
				memberName: member.name,
				memberInitials: member.initials,
			};
		});

		return json(result);
	} catch (err) {
		console.error('Signed URL error:', err);
		return json({ error: 'Failed to create upload URL' }, { status: 500 });
	}
};
