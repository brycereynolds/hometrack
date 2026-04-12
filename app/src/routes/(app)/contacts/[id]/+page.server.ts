import type { PageServerLoad } from './$types';
import { getContactById, getContactListings, getContactActivity } from '$lib/server/db/queries/contacts.js';
import { withRLS } from '$lib/server/db/index.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    throw error(401, 'Not authenticated');
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [contact, contactListings, activity] = await Promise.all([
        getContactById(team.id, params.id, db),
        getContactListings(team.id, params.id, db),
        getContactActivity(team.id, db),
      ]);
      return { contact, listings: contactListings, activity };
    });

    if (!result.contact) {
      throw error(404, 'Contact not found');
    }

    return {
      contact: result.contact,
      listings: result.listings,
      activity: result.activity,
    };
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) throw e;
    return { contact: null, listings: [], activity: [] };
  }
};
