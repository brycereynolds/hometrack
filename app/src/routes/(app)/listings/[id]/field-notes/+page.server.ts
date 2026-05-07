import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes, fieldNoteFrames, fieldNoteMoments, fieldNoteActions } from '$lib/server/db/schema/index.js';
import { eq, and, desc, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { fieldNotes: [] };
  }

  try {
    const notes = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.fieldNotes.findMany({
        where: and(
          eq(fieldNotes.teamId, team.id),
          eq(fieldNotes.listingId, params.id),
        ),
        with: {
          author: true,
        },
        orderBy: desc(fieldNotes.createdAt),
      });
    });

    // Get counts for related data
    const notesWithCounts = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return Promise.all(
        notes.map(async (note) => {
          const [frameCount, momentCount, actionCount] = await Promise.all([
            db.select({ count: count() }).from(fieldNoteFrames).where(eq(fieldNoteFrames.fieldNoteId, note.id)),
            db.select({ count: count() }).from(fieldNoteMoments).where(eq(fieldNoteMoments.fieldNoteId, note.id)),
            db.select({ count: count() }).from(fieldNoteActions).where(eq(fieldNoteActions.fieldNoteId, note.id)),
          ]);
          return {
            ...note,
            _counts: {
              frames: frameCount[0]?.count ?? 0,
              moments: momentCount[0]?.count ?? 0,
              actions: actionCount[0]?.count ?? 0,
            },
          };
        }),
      );
    });

    return { fieldNotes: notesWithCounts };
  } catch (e) {
    console.error('Load field notes error:', e);
    return { fieldNotes: [] };
  }
};
