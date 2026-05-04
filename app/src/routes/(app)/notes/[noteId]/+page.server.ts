import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { getWorkflowStatus } from '$lib/server/temporal.js';

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
