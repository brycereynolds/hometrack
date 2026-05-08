import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import {
  fieldNotes,
  fieldNoteActions,
  tasks,
  teamMembers,
  listingCosts,
  activityItems,
} from '$lib/server/db/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getWorkflowStatus } from '$lib/server/temporal.js';
import crypto from 'node:crypto';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { note: null };
  }

  try {
    const note = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const result = await db.query.fieldNotes.findFirst({
        where: and(
          eq(fieldNotes.id, params.noteId),
          eq(fieldNotes.teamId, team.id),
        ),
        with: {
          author: true,
          transcripts: true,
          attachments: true,
          listing: {
            with: {
              property: true,
            },
          },
          frames: {
            orderBy: (frames, { asc }) => [asc(frames.frameIndex)],
          },
          moments: {
            orderBy: (moments, { asc }) => [asc(moments.momentIndex)],
            with: {
              bestFrame: true,
            },
          },
          actions: {
            with: {
              sourceMoment: {
                with: {
                  bestFrame: true,
                },
              },
              actionMoments: {
                with: {
                  moment: {
                    with: {
                      bestFrame: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // If note is pending and has a workflow, check if it failed/was cancelled
      if (result && (result.status === 'pending' || result.status === 'processing') && result.workflowId) {
        const wfStatus = await getWorkflowStatus(result.workflowId);
        if (wfStatus === 'failed' || wfStatus === 'cancelled') {
          await db.update(fieldNotes)
            .set({ status: 'failed', updatedAt: new Date() })
            .where(eq(fieldNotes.id, result.id));
          return { ...result, status: 'failed' as const };
        }
      }

      return result;
    });

    if (!note) {
      return { note: null };
    }

    return { note };
  } catch (e) {
    console.error('Load field note detail error:', e);
    return { note: null };
  }
};

export const actions: Actions = {
  markAsTask: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const actionId = form.get('actionId') as string;
    const listingId = form.get('listingId') as string;
    const category = form.get('category') as string;
    const priority = form.get('priority') as string;
    const assigneeId = form.get('assigneeId') as string;
    const dueDate = form.get('dueDate') as string;

    if (!actionId || !listingId) return fail(400, { error: 'Action ID and listing ID are required' });

    try {
      const taskId = crypto.randomUUID();

      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('No team membership found');

        const action = await db.query.fieldNoteActions.findFirst({
          where: eq(fieldNoteActions.id, actionId),
        });
        if (!action) throw new Error('Action not found');

        await db.insert(tasks).values({
          id: taskId,
          teamId: member.teamId,
          listingId,
          title: action.title,
          status: 'todo',
          priority: (priority as any) || 'medium',
          taskCategory: (category as any) || 'general',
          assigneeId: assigneeId || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          sourceFieldNoteActionId: actionId,
        });

        await db
          .update(fieldNoteActions)
          .set({
            status: 'task_created',
            linkedTaskId: taskId,
            reviewedBy: member.id,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(fieldNoteActions.id, actionId));

        await db.insert(activityItems).values({
          id: crypto.randomUUID(),
          teamId: member.teamId,
          listingId,
          type: 'system',
          authorName: member.name,
          authorInitials: member.initials ?? member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          content: `Task created from field note: ${action.title}`,
          timestamp: new Date(),
        });
      });

      return { success: true, action: 'markAsTask', taskId };
    } catch (err) {
      console.error('markAsTask error:', err);
      return fail(500, { error: 'Failed to create task from action' });
    }
  },

  dismissAction: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const actionId = form.get('actionId') as string;

    if (!actionId) return fail(400, { error: 'Action ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('No team membership found');

        const action = await db.query.fieldNoteActions.findFirst({
          where: eq(fieldNoteActions.id, actionId),
        });

        await db
          .update(fieldNoteActions)
          .set({
            status: 'dismissed',
            reviewedBy: member.id,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(fieldNoteActions.id, actionId));

        if (action) {
          await db.insert(activityItems).values({
            id: crypto.randomUUID(),
            teamId: member.teamId,
            type: 'system',
            authorName: member.name,
            authorInitials: member.initials ?? member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            content: `Action dismissed: ${action.title}`,
            timestamp: new Date(),
          });
        }
      });

      return { success: true, action: 'dismissAction' };
    } catch (err) {
      console.error('dismissAction error:', err);
      return fail(500, { error: 'Failed to dismiss action' });
    }
  },

  bulkMarkAsTasks: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const actionIdsStr = form.get('actionIds') as string;
    const listingId = form.get('listingId') as string;
    const category = form.get('category') as string;
    const priority = form.get('priority') as string;
    const assigneeId = form.get('assigneeId') as string;
    const dueDate = form.get('dueDate') as string;

    if (!actionIdsStr || !listingId) return fail(400, { error: 'Action IDs and listing ID are required' });

    const actionIds = actionIdsStr.split(',').filter(Boolean);
    if (actionIds.length === 0) return fail(400, { error: 'No action IDs provided' });

    try {
      let tasksCreated = 0;

      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('No team membership found');

        const actionsToProcess = await db.query.fieldNoteActions.findMany({
          where: and(
            inArray(fieldNoteActions.id, actionIds),
            eq(fieldNoteActions.status, 'suggested'),
          ),
        });

        for (const action of actionsToProcess) {
          const taskId = crypto.randomUUID();

          await db.insert(tasks).values({
            id: taskId,
            teamId: member.teamId,
            listingId,
            title: action.title,
            status: 'todo',
            priority: (priority as any) || 'medium',
            taskCategory: (category as any) || 'general',
            assigneeId: assigneeId || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            sourceFieldNoteActionId: action.id,
          });

          await db
            .update(fieldNoteActions)
            .set({
              status: 'task_created',
              linkedTaskId: taskId,
              reviewedBy: member.id,
              reviewedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(fieldNoteActions.id, action.id));

          tasksCreated++;
        }

        if (tasksCreated > 0) {
          await db.insert(activityItems).values({
            id: crypto.randomUUID(),
            teamId: member.teamId,
            listingId,
            type: 'system',
            authorName: member.name,
            authorInitials: member.initials ?? member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            content: `${tasksCreated} task${tasksCreated > 1 ? 's' : ''} created from field note`,
            timestamp: new Date(),
          });
        }
      });

      return { success: true, action: 'bulkMarkAsTasks', tasksCreated };
    } catch (err) {
      console.error('bulkMarkAsTasks error:', err);
      return fail(500, { error: 'Failed to create tasks' });
    }
  },

  trackCost: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const actionId = form.get('actionId') as string;
    const listingId = form.get('listingId') as string;
    const category = form.get('category') as string;
    const amountStr = form.get('amount') as string;
    const notes = form.get('notes') as string;

    if (!actionId || !listingId) return fail(400, { error: 'Action ID and listing ID are required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('No team membership found');

        const action = await db.query.fieldNoteActions.findFirst({
          where: eq(fieldNoteActions.id, actionId),
        });
        if (!action) throw new Error('Action not found');

        const amount = amountStr ? parseFloat(amountStr) : null;

        await db.insert(listingCosts).values({
          teamId: member.teamId,
          listingId,
          actionId,
          title: action.title,
          description: action.description,
          category: category || 'general',
          amount,
          status: 'estimated',
          notes: notes || null,
        });

        await db
          .update(fieldNoteActions)
          .set({
            status: 'task_created',
            reviewedBy: member.id,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(fieldNoteActions.id, actionId));

        await db.insert(activityItems).values({
          id: crypto.randomUUID(),
          teamId: member.teamId,
          listingId,
          type: 'system',
          authorName: member.name,
          authorInitials: member.initials ?? member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          content: `Cost tracked: ${action.title}${amount ? ` — $${amount.toLocaleString()}` : ''}`,
          timestamp: new Date(),
        });
      });

      return { success: true, action: 'trackCost' };
    } catch (err) {
      console.error('trackCost error:', err);
      return fail(500, { error: 'Failed to track cost' });
    }
  },
};
