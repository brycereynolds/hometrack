import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import {
  fieldNotes,
  fieldNoteTranscripts,
  fieldNoteFrames,
  fieldNoteMoments,
  fieldNoteActions,
  tasks,
  teamMembers,
} from '$lib/server/db/schema/index.js';
import { eq, and, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import crypto from 'node:crypto';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { note: null };
  }

  try {
    const note = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.fieldNotes.findFirst({
        where: and(
          eq(fieldNotes.id, params.noteId),
          eq(fieldNotes.teamId, team.id),
        ),
        with: {
          author: true,
          transcripts: true,
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
            },
          },
        },
      });
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

async function getTeamId(userId: string) {
  return withRLS(userId, 'authenticated', async (db) => {
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });
    return member?.teamId ?? null;
  });
}

export const actions: Actions = {
  acceptAction: async ({ request, locals, params }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(401, { error: 'No team found' });

    const form = await request.formData();
    const actionId = form.get('actionId') as string;

    if (!actionId) return fail(400, { error: 'Action ID is required' });

    try {
      const taskId = crypto.randomUUID();

      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Get the action details
        const action = await db.query.fieldNoteActions.findFirst({
          where: eq(fieldNoteActions.id, actionId),
        });

        if (!action) throw new Error('Action not found');

        // Get the field note to find author and listing
        const note = await db.query.fieldNotes.findFirst({
          where: eq(fieldNotes.id, action.fieldNoteId),
        });

        if (!note) throw new Error('Field note not found');

        // Map action category to task category
        const categoryMap: Record<string, string> = {
          demolition: 'improvements',
          flooring: 'improvements',
          fixtures: 'improvements',
          paint: 'improvements',
          cleaning: 'staging',
          moving: 'staging',
          staging: 'staging',
          quoting: 'general',
          general: 'general',
        };
        const taskCategory = categoryMap[action.category ?? 'general'] ?? 'general';

        // Create the task
        await db.insert(tasks).values({
          id: taskId,
          teamId,
          listingId: params.id,
          title: action.title,
          status: 'todo',
          priority: (action.priority as any) ?? 'medium',
          taskCategory: taskCategory as any,
          assigneeId: note.authorId,
        });

        // Update the action status
        await db
          .update(fieldNoteActions)
          .set({
            status: 'task_created',
            linkedTaskId: taskId,
            reviewedBy: locals.user!.id,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(fieldNoteActions.id, actionId));
      });

      return { success: true, action: 'acceptAction', taskId };
    } catch (err) {
      console.error('acceptAction error:', err);
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
        await db
          .update(fieldNoteActions)
          .set({
            status: 'dismissed',
            reviewedBy: locals.user!.id,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(fieldNoteActions.id, actionId));
      });

      return { success: true, action: 'dismissAction' };
    } catch (err) {
      console.error('dismissAction error:', err);
      return fail(500, { error: 'Failed to dismiss action' });
    }
  },
};
