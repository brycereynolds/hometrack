import type { PageServerLoad, Actions } from './$types';
import { getContacts } from '$lib/server/db/queries/contacts.js';
import { withRLS } from '$lib/server/db/index.js';
import { contacts } from '$lib/server/db/schema/index.js';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { contacts: [] };
  }

  try {
    const allContacts = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getContacts(team.id, db);
    });
    return { contacts: allContacts };
  } catch {
    return { contacts: [] };
  }
};

export const actions: Actions = {
  create: async ({ request, locals, url }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim() || null;
    const phone = (formData.get('phone') as string)?.trim() || null;
    const type = (formData.get('type') as string) || 'client';
    const company = (formData.get('company') as string)?.trim() || null;
    const teamId = formData.get('teamId') as string;

    if (!name) return fail(400, { error: 'Name is required' });
    if (!teamId) return fail(400, { error: 'Team context missing' });

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(contacts).values({
          id: nanoid(),
          teamId,
          name,
          email,
          phone,
          type: type as 'client' | 'agent' | 'vendor' | 'lender' | 'inspector' | 'title',
          company,
          initials,
        });
      });
      return { success: true };
    } catch (e) {
      console.error('Create contact error:', e);
      return fail(500, { error: 'Failed to create contact' });
    }
  },
};
