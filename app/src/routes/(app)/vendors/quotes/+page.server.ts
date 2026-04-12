import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { quotes } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { quotes: [] };
  }

  try {
    const quoteList = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.quotes.findMany({
        where: eq(quotes.teamId, team.id),
        with: {
          lineItems: true,
          vendor: true,
          listing: true,
        },
      });
    });

    return { quotes: quoteList };
  } catch {
    return { quotes: [] };
  }
};
