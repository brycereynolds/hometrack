import type { PageServerLoad } from './$types';
import { getDocumentsByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { documents: [] };
  }

  try {
    const documents = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getDocumentsByListing(team.id, params.id, db);
    });
    return { documents };
  } catch {
    return { documents: [] };
  }
};
