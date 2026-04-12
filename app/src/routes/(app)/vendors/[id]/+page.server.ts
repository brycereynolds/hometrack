import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { vendors, quotes } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { vendor: null, quotes: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [vendor, vendorQuotes] = await Promise.all([
        db.query.vendors.findFirst({
          where: and(eq(vendors.teamId, team.id), eq(vendors.id, params.id)),
        }),
        db.query.quotes.findMany({
          where: and(eq(quotes.teamId, team.id), eq(quotes.vendorId, params.id)),
          with: {
            lineItems: true,
            listing: true,
          },
        }),
      ]);

      return {
        vendor: vendor ?? null,
        quotes: vendorQuotes,
      };
    });
  } catch {
    return { vendor: null, quotes: [] };
  }
};
