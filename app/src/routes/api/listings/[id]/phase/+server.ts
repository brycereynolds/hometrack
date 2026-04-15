import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { listings, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { phase } = body;

  const validPhases = ['pre_market', 'active', 'closed', 'canceled'];
  if (!phase || !validPhases.includes(phase)) {
    return json({ error: 'Invalid phase' }, { status: 400 });
  }

  try {
    await withRLS(locals.user.id, 'authenticated', async (db) => {
      const member = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, locals.user!.id),
      });
      if (!member) throw new Error('Team member not found');

      await db
        .update(listings)
        .set({
          phase: phase as any,
          daysInPhase: 0,
          updatedAt: new Date(),
        })
        .where(and(eq(listings.id, params.id), eq(listings.teamId, member.teamId)));
    });

    return json({ success: true });
  } catch (err) {
    console.error('Phase update error:', err);
    return json({ error: 'Failed to update phase' }, { status: 500 });
  }
};
