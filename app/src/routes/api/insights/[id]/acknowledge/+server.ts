import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { aiInsights } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const insightId = params.id;
	if (!insightId) {
		return json({ error: 'Missing insight ID' }, { status: 400 });
	}

	try {
		await withRLS(locals.user.id, 'authenticated', async (db) => {
			await db
				.update(aiInsights)
				.set({ dismissed: true, updatedAt: new Date() })
				.where(eq(aiInsights.id, insightId));
		});

		return json({ success: true });
	} catch (err) {
		console.error('Failed to acknowledge insight:', err);
		return json({ error: 'Failed to acknowledge insight' }, { status: 500 });
	}
};
