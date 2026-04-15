import type { PageServerLoad } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { getListings } from '$lib/server/db/queries/listings.js';
import { activityItems } from '$lib/server/db/schema/index.js';
import { eq, and, gte, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { listings: [], checkIns: [] };
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const listings = await getListings(team.id, db);

      // Load today's open house check-ins
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const checkIns = await db
        .select()
        .from(activityItems)
        .where(
          and(
            eq(activityItems.teamId, team.id),
            gte(activityItems.timestamp, todayStart),
            sql`${activityItems.metadata}->>'subtype' = 'open_house_checkin'`
          )
        );

      return {
        listings,
        checkIns: checkIns.map((c) => {
          const meta = c.metadata as Record<string, any>;
          return {
            name: meta?.guestName ?? '',
            email: meta?.guestEmail ?? '',
            time: new Date(c.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            hasAgent: !!meta?.guestAgent,
            agent: meta?.guestAgent ?? '',
          };
        }),
      };
    });

    return result;
  } catch {
    return { listings: [], checkIns: [] };
  }
};
