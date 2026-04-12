import type { PageServerLoad } from './$types';
import { getContactsByType } from '$lib/server/db/queries/contacts.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { clientContacts: [] };
  }

  try {
    const clientContacts = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getContactsByType(team.id, 'client', db);
    });
    return { clientContacts };
  } catch {
    return { clientContacts: [] };
  }
};
