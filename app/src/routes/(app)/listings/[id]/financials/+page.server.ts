import type { PageServerLoad } from './$types';
import { getFinancialsByListing, getQuotesByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { financial: null, quotes: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [financial, quotes] = await Promise.all([
        getFinancialsByListing(team.id, params.id, db),
        getQuotesByListing(team.id, params.id, db),
      ]);
      return { financial: financial ?? null, quotes };
    });
  } catch {
    return { financial: null, quotes: [] };
  }
};
