import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { chatConversations, chatMessages } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const conversation = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.chatConversations.findFirst({
        where: eq(chatConversations.id, params.id),
        with: {
          messages: {
            orderBy: (m, { asc }) => [asc(m.createdAt)],
          },
        },
      });
    });

    if (!conversation) return json({ error: 'Not found' }, { status: 404 });
    return json({ conversation });
  } catch {
    return json({ error: 'Failed to load conversation' }, { status: 500 });
  }
};
