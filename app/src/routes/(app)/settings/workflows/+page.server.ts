import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { workflowTemplates } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { workflowTemplates: [] };
  }

  try {
    const workflows = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.workflowTemplates.findMany({
        where: eq(workflowTemplates.teamId, team.id),
      });
    });

    return { workflowTemplates: workflows };
  } catch {
    return { workflowTemplates: [] };
  }
};

export const actions: Actions = {
  editWorkflow: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const workflowId = formData.get('workflowId') as string;
    const teamId = formData.get('teamId') as string;
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;

    if (!workflowId || !teamId) return fail(400, { error: 'Missing required fields' });
    if (!name) return fail(400, { error: 'Name is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(workflowTemplates)
          .set({
            name,
            description,
            updatedAt: new Date(),
          })
          .where(and(eq(workflowTemplates.id, workflowId), eq(workflowTemplates.teamId, teamId)));
      });
      return { success: true };
    } catch (e) {
      console.error('Edit workflow error:', e);
      return fail(500, { error: 'Failed to update workflow' });
    }
  },
};
