import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { workflowTemplates } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

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
