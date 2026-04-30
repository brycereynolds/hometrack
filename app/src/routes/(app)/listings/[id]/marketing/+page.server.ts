import type { PageServerLoad, Actions } from './$types';
import { getMarketingByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { marketingAssets, teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { marketingAssets: [] };
  }

  try {
    const assets = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getMarketingByListing(team.id, params.id, db);
    });
    return { marketingAssets: assets };
  } catch {
    return { marketingAssets: [] };
  }
};

export const actions: Actions = {
  createAsset: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const type = form.get('type') as string;
    const name = (form.get('name') as string)?.trim();
    const status = (form.get('status') as string) || 'scheduled';
    const url = (form.get('url') as string)?.trim() || null;
    const platform = (form.get('platform') as string)?.trim() || null;

    if (!name) return fail(400, { error: 'Name is required' });
    if (!type) return fail(400, { error: 'Type is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        await db.insert(marketingAssets).values({
          id: nanoid(),
          teamId: member.teamId,
          listingId: params.id,
          type: type as 'photo' | 'video' | 'floorplan' | 'brochure' | 'social_post' | 'virtual_tour',
          name,
          status: status as 'scheduled' | 'in_production' | 'complete' | 'published',
          url,
          platform,
          date: new Date(),
        });
      });
      return { success: true };
    } catch (err) {
      console.error('createAsset error:', err);
      return fail(500, { error: 'Failed to create asset' });
    }
  },

  updateStatus: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const assetId = form.get('assetId') as string;
    const status = form.get('status') as string;

    if (!assetId) return fail(400, { error: 'Asset ID is required' });
    if (!status) return fail(400, { error: 'Status is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.update(marketingAssets)
          .set({
            status: status as 'scheduled' | 'in_production' | 'complete' | 'published',
            updatedAt: new Date(),
          })
          .where(eq(marketingAssets.id, assetId));
      });
      return { success: true };
    } catch (err) {
      console.error('updateStatus error:', err);
      return fail(500, { error: 'Failed to update status' });
    }
  },

  editAsset: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const assetId = form.get('assetId') as string;
    const name = (form.get('name') as string)?.trim();
    const type = form.get('type') as string;
    const url = (form.get('url') as string)?.trim() || null;
    const platform = (form.get('platform') as string)?.trim() || null;

    if (!assetId) return fail(400, { error: 'Asset ID is required' });
    if (!name) return fail(400, { error: 'Name is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.update(marketingAssets)
          .set({
            name,
            type: type as 'photo' | 'video' | 'floorplan' | 'brochure' | 'social_post' | 'virtual_tour',
            url,
            platform,
            updatedAt: new Date(),
          })
          .where(eq(marketingAssets.id, assetId));
      });
      return { success: true };
    } catch (err) {
      console.error('editAsset error:', err);
      return fail(500, { error: 'Failed to update asset' });
    }
  },

  deleteAsset: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const assetId = form.get('assetId') as string;

    if (!assetId) return fail(400, { error: 'Asset ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.delete(marketingAssets)
          .where(eq(marketingAssets.id, assetId));
      });
      return { success: true };
    } catch (err) {
      console.error('deleteAsset error:', err);
      return fail(500, { error: 'Failed to delete asset' });
    }
  },
};
