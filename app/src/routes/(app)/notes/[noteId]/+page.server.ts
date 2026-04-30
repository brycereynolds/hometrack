import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

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
