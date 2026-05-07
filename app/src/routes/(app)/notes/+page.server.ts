import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes, fieldNoteFrames, fieldNoteMoments, fieldNoteActions, fieldNoteAttachments } from '$lib/server/db/schema/index.js';
import { eq, desc, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { notes: [] };
  }

  try {
    const notes = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.fieldNotes.findMany({
        where: eq(fieldNotes.teamId, team.id),
        with: {
          listing: {
            with: {
              property: true,
            },
          },
          author: true,
        },
        orderBy: desc(fieldNotes.createdAt),
      });
    });

    const notesWithCounts = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return Promise.all(
        notes.map(async (note) => {
          const [frameCount, momentCount, actionCount, attachmentCount] = await Promise.all([
            db.select({ count: count() }).from(fieldNoteFrames).where(eq(fieldNoteFrames.fieldNoteId, note.id)),
            db.select({ count: count() }).from(fieldNoteMoments).where(eq(fieldNoteMoments.fieldNoteId, note.id)),
            db.select({ count: count() }).from(fieldNoteActions).where(eq(fieldNoteActions.fieldNoteId, note.id)),
            db.select({ count: count() }).from(fieldNoteAttachments).where(eq(fieldNoteAttachments.fieldNoteId, note.id)),
          ]);
          return {
            ...note,
            _counts: {
              frames: frameCount[0]?.count ?? 0,
              moments: momentCount[0]?.count ?? 0,
              actions: actionCount[0]?.count ?? 0,
              attachments: attachmentCount[0]?.count ?? 0,
            },
          };
        }),
      );
    });

    return { notes: notesWithCounts };
  } catch (e) {
    console.error('Load all notes error:', e);
    return { notes: [] };
  }
};
