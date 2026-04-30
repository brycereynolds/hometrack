import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { chatConversations, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const conversations = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const member = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, locals.user!.id),
      });
      if (!member) return [];

      return db.query.chatConversations.findMany({
        where: eq(chatConversations.userId, member.id),
        orderBy: desc(chatConversations.updatedAt),
        limit: 50,
      });
    });

    return json({ conversations });
  } catch {
    return json({ error: 'Failed to load conversations' }, { status: 500 });
  }
};
