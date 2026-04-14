import type { LayoutServerLoad } from './$types';
import { getListingById } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNotes } from '$lib/server/db/schema/index.js';
import { eq, and, count } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { listing: null, fieldNotesCount: 0 };
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const listing = await getListingById(team.id, params.id, db);

      const [countResult] = await db
        .select({ value: count() })
        .from(fieldNotes)
        .where(
          and(
            eq(fieldNotes.teamId, team.id),
            eq(fieldNotes.listingId, params.id),
          ),
        );

      return {
        listing: listing ?? null,
        fieldNotesCount: countResult?.value ?? 0,
      };
    });

    return result;
  } catch {
    return { listing: null, fieldNotesCount: 0 };
  }
};
