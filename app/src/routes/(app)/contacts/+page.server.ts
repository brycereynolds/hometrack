import type { PageServerLoad } from './$types';
import { getContacts } from '$lib/server/db/queries/contacts.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { contacts: [] };
  }

  try {
    const contacts = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getContacts(team.id, db);
    });
    return { contacts };
  } catch {
    return { contacts: [] };
  }
};
