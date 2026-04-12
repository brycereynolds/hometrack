import type { PageServerLoad } from './$types';
import { getContactsByType, getContactListings } from '$lib/server/db/queries/contacts.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { clients: [], listings: [] };
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [clients, allListings] = await Promise.all([
        getContactsByType(team.id, 'client', db),
        getListings(team.id, db),
      ]);
      return { clients, listings: allListings };
    });
    return result;
  } catch {
    return { clients: [], listings: [] };
  }
};
