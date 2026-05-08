import type { PageServerLoad, Actions } from './$types';
import { getTasksByListing } from '$lib/server/db/queries/tasks.js';
import { withRLS } from '$lib/server/db/index.js';
import { tasks, teamMembers, listingCosts, quotes, vendors, activityItems } from '$lib/server/db/schema/index.js';
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
      const [taskList, vendorList, costList, quoteList] = await Promise.all([
        getTasksByListing(team.id, params.id, db),
        db.query.vendors.findMany({
          where: eq(vendors.teamId, team.id),
          orderBy: (v, { asc }) => [asc(v.name)],
        }),
        db.query.listingCosts.findMany({
          where: and(eq(listingCosts.teamId, team.id), eq(listingCosts.listingId, params.id)),
          with: { vendor: true },
        }),
        db.query.quotes.findMany({
          where: and(eq(quotes.teamId, team.id), eq(quotes.listingId, params.id)),
          with: { vendor: true },
        }),
      ]);
      return { tasks: taskList, vendors: vendorList, costs: costList, quotes: quoteList };
    });
    return result;
  } catch {
    return { tasks: [], vendors: [], costs: [], quotes: [] };
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
        const task = await db.query.tasks.findFirst({
          where: and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)),
        });

        await db
          .update(tasks)
          .set({ status: newStatus as any, updatedAt: new Date() })
          .where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)));

        if (newStatus === 'done' && task) {
          await db.insert(activityItems).values({
            id: crypto.randomUUID(),
            teamId,
            listingId: task.listingId,
            type: 'system',
            authorName: 'System',
            authorInitials: 'HT',
            content: `Task completed: ${task.title}`,
            timestamp: new Date(),
          });
        }
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

  updateTask: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const taskId = form.get('taskId') as string;
    const title = form.get('title') as string;
    const description = (form.get('description') as string) || null;
    const status = form.get('status') as string;
    const priority = form.get('priority') as string;
    const dueDate = form.get('dueDate') as string;
    const assigneeId = (form.get('assigneeId') as string) || null;
    const taskCategory = (form.get('taskCategory') as string) || null;

    if (!taskId) return fail(400, { error: 'Task ID is required' });
    if (!title?.trim()) return fail(400, { error: 'Title is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(tasks)
          .set({
            title: title.trim(),
            description,
            status: status as any,
            priority: priority as any,
            dueDate: dueDate ? new Date(dueDate) : null,
            assigneeId: assigneeId || null,
            taskCategory: taskCategory as any || null,
            updatedAt: new Date(),
          })
          .where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)));
      });
      return { success: true, action: 'updateTask' };
    } catch (err) {
      console.error('updateTask error:', err);
      return fail(500, { error: 'Failed to update task' });
    }
  },

  trackCost: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const taskId = form.get('taskId') as string;
    const amount = parseFloat(form.get('costAmount') as string) || 0;
    const category = (form.get('costCategory') as string) || null;
    const notes = (form.get('costNotes') as string) || null;

    if (!taskId) return fail(400, { error: 'Task ID is required' });
    if (amount <= 0) return fail(400, { error: 'Amount must be greater than 0' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const task = await db.query.tasks.findFirst({
          where: and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)),
        });
        const taskTitle = task?.title ?? 'Task cost';

        await db.insert(listingCosts).values({
          id: crypto.randomUUID(),
          teamId,
          listingId: params.id,
          taskId,
          title: taskTitle,
          amount,
          category,
          status: 'committed',
          notes,
        });

        await db.insert(activityItems).values({
          id: crypto.randomUUID(),
          teamId,
          listingId: params.id,
          type: 'system',
          authorName: 'System',
          authorInitials: 'HT',
          content: `Cost tracked: ${taskTitle} — $${amount.toLocaleString()}`,
          timestamp: new Date(),
        });
      });
      return { success: true, action: 'trackCost' };
    } catch (err) {
      console.error('trackCost error:', err);
      return fail(500, { error: 'Failed to track cost' });
    }
  },

  requestQuote: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const taskId = form.get('taskId') as string;
    const vendorId = form.get('vendorId') as string;

    if (!taskId) return fail(400, { error: 'Task ID is required' });
    if (!vendorId) return fail(400, { error: 'Vendor is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const task = await db.query.tasks.findFirst({
          where: and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)),
        });
        const taskTitle = task?.title ?? 'Quote request';

        const vendor = await db.query.vendors.findFirst({
          where: eq(vendors.id, vendorId),
        });

        await db.insert(quotes).values({
          id: crypto.randomUUID(),
          teamId,
          vendorId,
          listingId: params.id,
          taskId,
          scope: taskTitle,
          status: 'requested',
          requestedDate: new Date(),
        });

        await db.insert(activityItems).values({
          id: crypto.randomUUID(),
          teamId,
          listingId: params.id,
          type: 'system',
          authorName: 'System',
          authorInitials: 'HT',
          content: `Quote requested from ${vendor?.name ?? 'vendor'} for ${taskTitle}`,
          timestamp: new Date(),
        });
      });
      return { success: true, action: 'requestQuote' };
    } catch (err) {
      console.error('requestQuote error:', err);
      return fail(500, { error: 'Failed to request quote' });
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
        // Fetch the task for title in activity logs
        const task = await db.query.tasks.findFirst({
          where: and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)),
        });
        const taskTitle = task?.title ?? 'Task';

        // 1. Mark as done
        if (shouldMarkDone) {
          await db
            .update(tasks)
            .set({ status: 'done', updatedAt: new Date() })
            .where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)));

          await db.insert(activityItems).values({
            id: crypto.randomUUID(),
            teamId,
            listingId,
            type: 'system',
            authorName: 'System',
            authorInitials: 'HT',
            content: `Task completed: ${taskTitle}`,
            timestamp: new Date(),
          });
        }

        // 2. Track cost
        let costId: string | null = null;
        if (shouldTrackCost) {
          const amount = parseFloat(form.get('costAmount') as string) || 0;
          const category = (form.get('costCategory') as string) || null;
          const notes = (form.get('costNotes') as string) || null;

          costId = crypto.randomUUID();
          await db.insert(listingCosts).values({
            id: costId,
            teamId,
            listingId,
            taskId,
            title: taskTitle,
            amount: amount > 0 ? amount : null,
            category,
            status: 'committed',
            notes,
          });

          await db.insert(activityItems).values({
            id: crypto.randomUUID(),
            teamId,
            listingId,
            type: 'system',
            authorName: 'System',
            authorInitials: 'HT',
            content: `Cost tracked: ${taskTitle}${amount > 0 ? ` — $${amount.toLocaleString()}` : ''}`,
            timestamp: new Date(),
          });
        }

        // 3. Attach receipt (store path reference — actual upload handled client-side or separately)
        if (shouldAttachReceipt && costId) {
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
            // Look up vendor name for activity log
            const vendor = await db.query.vendors.findFirst({
              where: eq(vendors.id, vendorId),
            });

            await db.insert(quotes).values({
              id: crypto.randomUUID(),
              teamId,
              vendorId,
              listingId,
              taskId,
              scope: `Quote for: ${taskTitle}`,
              status: 'requested',
              requestedDate: new Date(),
            });

            await db.insert(activityItems).values({
              id: crypto.randomUUID(),
              teamId,
              listingId,
              type: 'system',
              authorName: 'System',
              authorInitials: 'HT',
              content: `Quote requested from ${vendor?.name ?? 'vendor'} for ${taskTitle}`,
              timestamp: new Date(),
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
