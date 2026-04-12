import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { showings } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { listings: [], showings: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [listingList, showingList] = await Promise.all([
        getListings(team.id, db),
        db.query.showings.findMany({
          where: eq(showings.teamId, team.id),
          with: { listing: true },
        }),
      ]);

      return { listings: listingList, showings: showingList };
    });
  } catch {
    return { listings: [], showings: [] };
  }
};
