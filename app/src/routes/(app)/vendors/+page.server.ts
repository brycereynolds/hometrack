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

  editVendor: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const vendorId = formData.get('vendorId') as string;
    const name = (formData.get('name') as string)?.trim();
    const company = (formData.get('company') as string)?.trim() || null;
    const category = (formData.get('category') as string) || 'contractor';
    const phone = (formData.get('phone') as string)?.trim() || null;
    const email = (formData.get('email') as string)?.trim() || null;
    const ratingStr = formData.get('rating') as string;
    const rating = ratingStr ? parseFloat(ratingStr) : undefined;

    if (!vendorId) return fail(400, { error: 'Vendor ID is required' });
    if (!name) return fail(400, { error: 'Name is required' });

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const updateData: Record<string, unknown> = {
          name,
          company,
          category,
          phone,
          email,
          initials,
          updatedAt: new Date(),
        };
        if (rating !== undefined && !isNaN(rating)) {
          updateData.rating = rating;
        }

        await db.update(vendors)
          .set(updateData)
          .where(eq(vendors.id, vendorId));
      });
      return { success: true };
    } catch (e) {
      console.error('Edit vendor error:', e);
      return fail(500, { error: 'Failed to update vendor' });
    }
  },

  deleteVendor: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const vendorId = formData.get('vendorId') as string;

    if (!vendorId) return fail(400, { error: 'Vendor ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.delete(vendors)
          .where(eq(vendors.id, vendorId));
      });
      return { success: true };
    } catch (e) {
      console.error('Delete vendor error:', e);
      return fail(500, { error: 'Failed to delete vendor' });
    }
  },
};
