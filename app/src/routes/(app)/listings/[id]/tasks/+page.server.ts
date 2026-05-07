import type { PageServerLoad, Actions } from './$types';
import { getTasksByListing } from '$lib/server/db/queries/tasks.js';
import { withRLS } from '$lib/server/db/index.js';
import { tasks, teamMembers, listingCosts, quotes, vendors } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import crypto from 'node:crypto';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { tasks: [] };
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [taskList, vendorList] = await Promise.all([
        getTasksByListing(team.id, params.id, db),
        db.query.vendors.findMany({
          where: eq(vendors.teamId, team.id),
          orderBy: (v, { asc }) => [asc(v.name)],
        }),
      ]);
      return { tasks: taskList, vendors: vendorList };
    });
    return { tasks: result.tasks, vendors: result.vendors };
  } catch {
    return { tasks: [], vendors: [] };
  }
};

async function getTeamId(userId: string) {
  const { withRLS: rls } = await import('$lib/server/db/index.js');
  return rls(userId, 'authenticated', async (db) => {
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });
    return member?.teamId ?? null;
  });
}

export const actions: Actions = {
  createTask: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const title = form.get('title') as string;
    const priority = (form.get('priority') as string) || 'medium';
    const phase = (form.get('phase') as string) || null;
    const dueDate = form.get('dueDate') as string;
    const assigneeId = (form.get('assigneeId') as string) || null;

    if (!title?.trim()) {
      return fail(400, { error: 'Title is required' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(tasks).values({
          id: crypto.randomUUID(),
          teamId,
          listingId: params.id,
          title: title.trim(),
          status: 'todo',
          priority: priority as any,
          phase: phase as any,
          dueDate: dueDate ? new Date(dueDate) : null,
          assigneeId: assigneeId || null,
        });
      });
      return { success: true, action: 'createTask' };
    } catch (err) {
      console.error('createTask error:', err);
      return fail(500, { error: 'Failed to create task' });
    }
  },

  toggleStatus: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const taskId = form.get('taskId') as string;
    const newStatus = form.get('status') as string;

    if (!taskId || !newStatus) {
      return fail(400, { error: 'Task ID and status are required' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(tasks)
          .set({ status: newStatus as any, updatedAt: new Date() })
          .where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)));
      });
      return { success: true, action: 'toggleStatus' };
    } catch (err) {
      console.error('toggleStatus error:', err);
      return fail(500, { error: 'Failed to update task status' });
    }
  },

  editTask: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const taskId = form.get('taskId') as string;
    const title = form.get('title') as string;
    const status = form.get('status') as string;
    const priority = form.get('priority') as string;
    const dueDate = form.get('dueDate') as string;
    const assigneeId = (form.get('assigneeId') as string) || null;

    if (!taskId) return fail(400, { error: 'Task ID is required' });
    if (!title?.trim()) return fail(400, { error: 'Title is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(tasks)
          .set({
            title: title.trim(),
            status: status as any,
            priority: priority as any,
            dueDate: dueDate ? new Date(dueDate) : null,
            assigneeId: assigneeId || null,
            updatedAt: new Date(),
          })
          .where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)));
      });
      return { success: true, action: 'editTask' };
    } catch (err) {
      console.error('editTask error:', err);
      return fail(500, { error: 'Failed to update task' });
    }
  },

  deleteTask: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const taskId = form.get('taskId') as string;

    if (!taskId) return fail(400, { error: 'Task ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .delete(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)));
      });
      return { success: true, action: 'deleteTask' };
    } catch (err) {
      console.error('deleteTask error:', err);
      return fail(500, { error: 'Failed to delete task' });
    }
  },

  completeTask: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const taskId = form.get('taskId') as string;
    const listingId = (form.get('listingId') as string) || params.id;
    const shouldMarkDone = form.has('markDone');
    const shouldTrackCost = form.has('trackCost');
    const shouldAttachReceipt = form.has('attachReceipt');
    const shouldRequestQuote = form.has('requestQuote');

    if (!taskId) return fail(400, { error: 'Task ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // 1. Mark as done
        if (shouldMarkDone) {
          await db
            .update(tasks)
            .set({ status: 'done', updatedAt: new Date() })
            .where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)));
        }

        // 2. Track cost
        let costId: string | null = null;
        if (shouldTrackCost) {
          const amount = parseFloat(form.get('costAmount') as string) || 0;
          const category = (form.get('costCategory') as string) || null;
          const notes = (form.get('costNotes') as string) || null;

          // Get task title for the cost entry
          const task = await db.query.tasks.findFirst({
            where: and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)),
          });

          costId = crypto.randomUUID();
          await db.insert(listingCosts).values({
            id: costId,
            teamId,
            listingId,
            taskId,
            title: task?.title ?? 'Task cost',
            amount: amount > 0 ? amount : null,
            category,
            status: 'committed',
            notes,
          });
        }

        // 3. Attach receipt (store path reference — actual upload handled client-side or separately)
        if (shouldAttachReceipt && costId) {
          // Receipt file is submitted as multipart but we store a placeholder path.
          // A full file upload pipeline (e.g., Supabase Storage) would be wired here.
          const receiptFile = form.get('receiptFile') as File | null;
          if (receiptFile && receiptFile.size > 0) {
            const receiptPath = `receipts/${listingId}/${costId}/${receiptFile.name}`;
            await db
              .update(listingCosts)
              .set({ receiptPath })
              .where(eq(listingCosts.id, costId));
          }
        }

        // 4. Request quote
        if (shouldRequestQuote) {
          const vendorId = form.get('vendorId') as string;
          if (vendorId) {
            await db.insert(quotes).values({
              id: crypto.randomUUID(),
              teamId,
              vendorId,
              listingId,
              scope: `Quote for: ${(await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) }))?.title ?? 'task'}`,
              status: 'requested',
              requestedDate: new Date(),
            });
          }
        }
      });
      return { success: true, action: 'completeTask' };
    } catch (err) {
      console.error('completeTask error:', err);
      return fail(500, { error: 'Failed to complete task' });
    }
  },

  toggleSubtask: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const taskId = form.get('taskId') as string;
    const subtaskIndex = parseInt(form.get('subtaskIndex') as string, 10);

    if (!taskId || isNaN(subtaskIndex)) {
      return fail(400, { error: 'Task ID and subtask index are required' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const task = await db.query.tasks.findFirst({
          where: and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)),
        });
        if (!task) throw new Error('Task not found');

        const subtasks = (task.subtasks as any[]) ?? [];
        if (subtaskIndex >= 0 && subtaskIndex < subtasks.length) {
          subtasks[subtaskIndex].done = !subtasks[subtaskIndex].done;
          await db
            .update(tasks)
            .set({ subtasks, updatedAt: new Date() })
            .where(eq(tasks.id, taskId));
        }
      });
      return { success: true, action: 'toggleSubtask' };
    } catch (err) {
      console.error('toggleSubtask error:', err);
      return fail(500, { error: 'Failed to toggle subtask' });
    }
  },
};
