import type { LayoutServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const membership = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, locals.user!.id),
        with: { team: { with: { members: true } } },
      });
      return membership?.team ?? null;
    });

    if (!result) {
      return { team: null, teamMembers: [] };
    }

    return { team: result, teamMembers: result.members };
  } catch {
    return { team: null, teamMembers: [] };
  }
};
