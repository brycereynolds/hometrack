import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { vendors } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

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
