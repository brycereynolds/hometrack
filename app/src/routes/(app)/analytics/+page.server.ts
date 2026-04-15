import type { PageServerLoad } from './$types';
import { getPipelineTimeSeries } from '$lib/server/db/queries/analytics.js';
import { withRLS } from '$lib/server/db/index.js';
import { pipelineMetrics, listings } from '$lib/server/db/schema/index.js';
import { eq, and, gte, lt, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { pipelineValueTimeSeries: null, analyticsDeltas: null };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const pipelineValueTimeSeries = await getPipelineTimeSeries(team.id, db);

      // Compute deltas for stat cards
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthStr = thisMonthStart.toISOString().split('T')[0];
      const lastMonthStr = lastMonthStart.toISOString().split('T')[0];

      const [currentMetric, prevMetric] = await Promise.all([
        db.query.pipelineMetrics.findFirst({
          where: and(eq(pipelineMetrics.teamId, team.id), gte(pipelineMetrics.date, thisMonthStr)),
          orderBy: desc(pipelineMetrics.date),
        }),
        db.query.pipelineMetrics.findFirst({
          where: and(eq(pipelineMetrics.teamId, team.id), gte(pipelineMetrics.date, lastMonthStr), lt(pipelineMetrics.date, thisMonthStr)),
          orderBy: desc(pipelineMetrics.date),
        }),
      ]);

      // Listings delta
      const allListings = await db.query.listings.findMany({
        where: eq(listings.teamId, team.id),
      });
      const thisMonthListings = allListings.filter((l) => new Date(l.createdAt) >= thisMonthStart).length;
      const lastMonthListings = allListings.filter((l) => new Date(l.createdAt) >= lastMonthStart && new Date(l.createdAt) < thisMonthStart).length;

      // Pipeline value delta
      const pipelineValueDelta = currentMetric && prevMetric
        ? currentMetric.totalValue - prevMetric.totalValue
        : 0;

      // DOM delta (this month vs last month from pipeline_metrics)
      const domDelta = currentMetric && prevMetric
        ? (currentMetric.activeListings - prevMetric.activeListings)
        : 0;

      // List-to-sale ratio from closed deals
      const closedListings = allListings.filter((l) => l.phase === 'closed' && l.price);
      const listToSaleRatio = closedListings.length > 0
        ? (closedListings.reduce((s, l) => s + (l.price ?? 0), 0) /
           closedListings.reduce((s, l) => s + (l.price ?? 0), 0) * 100).toFixed(1)
        : null;

      // Closed deals by month from pipeline_metrics
      const allMetrics = await db.query.pipelineMetrics.findMany({
        where: eq(pipelineMetrics.teamId, team.id),
        orderBy: desc(pipelineMetrics.date),
      });
      const closedDealsByMonth = allMetrics
        .filter((m) => m.closedDeals > 0 || m.closedValue > 0)
        .slice(0, 4)
        .reverse()
        .map((m) => {
          const dt = new Date(m.date + 'T00:00:00');
          return {
            month: dt.toLocaleDateString('en-US', { month: 'long' }),
            count: m.closedDeals,
            volume: m.closedValue,
          };
        });

      return {
        pipelineValueTimeSeries,
        analyticsDeltas: {
          listingsDelta: thisMonthListings - lastMonthListings,
          pipelineValueDelta,
          listToSaleRatio,
          closedDealsByMonth,
        },
      };
    });
  } catch {
    return { pipelineValueTimeSeries: null, analyticsDeltas: null };
  }
};
