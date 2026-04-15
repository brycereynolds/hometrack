import type { PageServerLoad, Actions } from './$types';
import { getContactsByType } from '$lib/server/db/queries/contacts.js';
import { withRLS } from '$lib/server/db/index.js';
import { listings, teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

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

async function getTeamId(userId: string) {
  return withRLS(userId, 'authenticated', async (db) => {
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });
    return member?.teamId ?? null;
  });
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) {
      return fail(400, { error: 'No team found' });
    }

    const formData = await request.formData();

    const address = formData.get('address')?.toString().trim();
    const city = formData.get('city')?.toString().trim();
    const state = formData.get('state')?.toString().trim();
    const zip = formData.get('zip')?.toString().trim();

    if (!address || !city || !state || !zip) {
      return fail(400, { error: 'Address, city, state, and ZIP are required' });
    }

    const priceStr = formData.get('listPrice')?.toString().replace(/[^0-9.]/g, '');
    const price = priceStr ? parseFloat(priceStr) : null;
    const beds = parseInt(formData.get('beds')?.toString() ?? '') || null;
    const baths = parseFloat(formData.get('baths')?.toString() ?? '') || null;
    const sqft = parseInt(formData.get('sqft')?.toString() ?? '') || null;
    const lotSqft = parseInt(formData.get('lotSqft')?.toString() ?? '') || null;
    const yearBuilt = parseInt(formData.get('yearBuilt')?.toString() ?? '') || null;
    const propertyType = formData.get('propertyType')?.toString() || 'single_family';
    const description = formData.get('description')?.toString().trim() || null;
    const phase = formData.get('phase')?.toString() || 'pre_market';
    const agentId = formData.get('agentId')?.toString() || null;
    const clientId = formData.get('clientId')?.toString() || null;

    const id = crypto.randomUUID();

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(listings).values({
          id,
          teamId,
          address,
          city,
          state,
          zip,
          price,
          beds,
          baths,
          sqft,
          lotSqft,
          yearBuilt,
          propertyType,
          description,
          phase: phase as 'pre_market' | 'active' | 'closed' | 'canceled',
          agentId,
          clientId,
        });
      });
    } catch (err) {
      console.error('Failed to create listing:', err);
      return fail(500, { error: 'Failed to create listing. Please try again.' });
    }

    redirect(303, `/listings/${id}`);
  },
};
