import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { tasks, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { tasks: [], listings: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [taskList, listingList] = await Promise.all([
        db.query.tasks.findMany({
          where: eq(tasks.teamId, team.id),
          with: {
            assignee: true,
            listing: true,
          },
        }),
        getListings(team.id, db),
      ]);

      return { tasks: taskList, listings: listingList };
    });
  } catch {
    return { tasks: [], listings: [] };
  }
};

export const actions: Actions = {
  toggleStatus: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const taskId = form.get('taskId') as string;
    const newStatus = form.get('status') as string;

    if (!taskId || !newStatus) {
      return fail(400, { error: 'Task ID and status are required' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        await db
          .update(tasks)
          .set({ status: newStatus as any, updatedAt: new Date() })
          .where(and(eq(tasks.id, taskId), eq(tasks.teamId, member.teamId)));
      });
      return { success: true };
    } catch (err) {
      console.error('toggleStatus error:', err);
      return fail(500, { error: 'Failed to update task status' });
    }
  },
};
