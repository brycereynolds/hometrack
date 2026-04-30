import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { workflowTemplates, workflowTemplateTasks } from '$lib/server/db/schema/index.js';
import { eq, and, asc, notInArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { workflowTemplates: [] };
  }

  try {
    const workflows = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.workflowTemplates.findMany({
        where: eq(workflowTemplates.teamId, team.id),
        with: {
          tasks: {
            orderBy: [asc(workflowTemplateTasks.sortOrder)],
          },
        },
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

  createWorkflow: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const teamId = formData.get('teamId') as string;
    const name = (formData.get('name') as string)?.trim();
    const phase = formData.get('phase') as string;
    const description = (formData.get('description') as string)?.trim() || null;

    if (!teamId) return fail(400, { error: 'Missing team' });
    if (!name) return fail(400, { error: 'Name is required' });
    if (!phase) return fail(400, { error: 'Phase is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(workflowTemplates).values({
          id: nanoid(),
          teamId,
          name,
          phase: phase as 'pre_market' | 'active' | 'closed' | 'canceled',
          description,
          isDefault: false,
          taskCount: 0,
        });
      });
      return { success: true };
    } catch (e) {
      console.error('Create workflow error:', e);
      return fail(500, { error: 'Failed to create workflow' });
    }
  },

  saveTemplateTasks: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;
    const teamId = formData.get('teamId') as string;
    const name = (formData.get('templateName') as string)?.trim();
    const description = (formData.get('templateDescription') as string)?.trim() || null;
    const tasksJson = formData.get('tasks') as string;

    if (!templateId || !teamId) return fail(400, { error: 'Missing required fields' });
    if (!name) return fail(400, { error: 'Name is required' });

    let taskList: { id?: string; title: string; priority: string; sortOrder: number }[];
    try {
      taskList = JSON.parse(tasksJson || '[]');
    } catch {
      return fail(400, { error: 'Invalid task data' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Update template name/description
        await db
          .update(workflowTemplates)
          .set({
            name,
            description,
            taskCount: taskList.length,
            updatedAt: new Date(),
          })
          .where(and(eq(workflowTemplates.id, templateId), eq(workflowTemplates.teamId, teamId)));

        // Collect IDs of tasks being kept
        const keptIds = taskList.filter((t) => t.id).map((t) => t.id as string);

        // Delete tasks that were removed
        if (keptIds.length > 0) {
          await db
            .delete(workflowTemplateTasks)
            .where(
              and(
                eq(workflowTemplateTasks.templateId, templateId),
                notInArray(workflowTemplateTasks.id, keptIds),
              ),
            );
        } else {
          // All tasks removed — delete all
          await db
            .delete(workflowTemplateTasks)
            .where(eq(workflowTemplateTasks.templateId, templateId));
        }

        // Upsert each task
        for (const task of taskList) {
          const taskId = task.id || nanoid();
          const priority = task.priority as 'low' | 'medium' | 'high' | 'urgent';

          if (task.id) {
            // Update existing
            await db
              .update(workflowTemplateTasks)
              .set({
                title: task.title,
                priority,
                sortOrder: task.sortOrder,
                updatedAt: new Date(),
              })
              .where(eq(workflowTemplateTasks.id, task.id));
          } else {
            // Insert new
            await db.insert(workflowTemplateTasks).values({
              id: taskId,
              templateId,
              title: task.title,
              priority,
              sortOrder: task.sortOrder,
            });
          }
        }
      });

      return { success: true };
    } catch (e) {
      console.error('Save template tasks error:', e);
      return fail(500, { error: 'Failed to save template tasks' });
    }
  },
};
