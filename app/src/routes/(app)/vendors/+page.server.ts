import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { vendors } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { vendors: [] };
  }

  try {
    const vendorList = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.vendors.findMany({
        where: eq(vendors.teamId, team.id),
      });
    });

    return { vendors: vendorList };
  } catch {
    return { vendors: [] };
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const company = (formData.get('company') as string)?.trim() || null;
    const email = (formData.get('email') as string)?.trim() || null;
    const phone = (formData.get('phone') as string)?.trim() || null;
    const category = (formData.get('category') as string) || 'contractor';
    const specialtiesRaw = (formData.get('specialties') as string)?.trim() || '';
    const teamId = formData.get('teamId') as string;

    if (!name) return fail(400, { error: 'Name is required' });
    if (!teamId) return fail(400, { error: 'Team context missing' });

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const specialties = specialtiesRaw
      ? specialtiesRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(vendors).values({
          id: nanoid(),
          teamId,
          name,
          company,
          email,
          phone,
          category,
          initials,
          specialties,
          rating: 0,
          reliabilityScore: 0,
          projectsCompleted: 0,
        });
      });
      return { success: true };
    } catch (e) {
      console.error('Create vendor error:', e);
      return fail(500, { error: 'Failed to create vendor' });
    }
  },
};
