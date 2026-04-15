import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { fieldNotes } from '$lib/server/db/schema/index.js';
import { eq, desc, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { listings: [], recentMemos: [] };
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [listings, recentMemos] = await Promise.all([
        getListings(team.id, db),
        db.query.fieldNotes.findMany({
          where: and(
            eq(fieldNotes.teamId, team.id),
            eq(fieldNotes.mediaType, 'voice_memo'),
          ),
          orderBy: desc(fieldNotes.createdAt),
          limit: 5,
          with: { author: true },
        }),
      ]);
      return { listings, recentMemos };
    });

    return result;
  } catch {
    return { listings: [], recentMemos: [] };
  }
};
