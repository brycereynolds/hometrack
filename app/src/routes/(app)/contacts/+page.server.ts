import type { PageServerLoad } from './$types';
import { getContacts } from '$lib/server/db/queries/contacts.js';

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  if (!team) {
    return { contacts: [] };
  }

  try {
    const contacts = await getContacts(team.id);
    return { contacts };
  } catch {
    return { contacts: [] };
  }
};
