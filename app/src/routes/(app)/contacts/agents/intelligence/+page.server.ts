import type { PageServerLoad } from './$types';
import { getContactsByType } from '$lib/server/db/queries/contacts.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { agents: [], listings: [] };
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [agents, allListings] = await Promise.all([
        getContactsByType(team.id, 'agent', db),
        getListings(team.id, db),
      ]);
      return { agents, listings: allListings };
    });
    return result;
  } catch {
    return { agents: [], listings: [] };
  }
};
