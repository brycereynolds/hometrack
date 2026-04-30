import { eq, desc, and, gte, lt, between } from 'drizzle-orm';
import { adminDb, type AppDatabase } from '../index.js';
import { listings, tasks, activityItems, aiInsights, showings, pipelineMetrics } from '../schema/index.js';

export async function getDashboardData(teamId: string, db: AppDatabase = adminDb) {
  const [allListings, allTasks, recentActivity, insights, recentShowings] = await Promise.all([
    db.query.listings.findMany({
      where: eq(listings.teamId, teamId),
      with: { property: true, agent: true, client: true },
    }),
    db.query.tasks.findMany({
      where: eq(tasks.teamId, teamId),
      with: { assignee: true, listing: { with: { property: true } } },
    }),
    db.query.activityItems.findMany({
      where: eq(activityItems.teamId, teamId),
      orderBy: desc(activityItems.timestamp),
      limit: 10,
    }),
    db.query.aiInsights.findMany({
      where: eq(aiInsights.teamId, teamId),
      orderBy: desc(aiInsights.timestamp),
    }),
    db.query.showings.findMany({
      where: eq(showings.teamId, teamId),
      orderBy: desc(showings.date),
      limit: 10,
    }),
  ]);

  const pipelineValue = allListings.reduce((sum, l) => sum + (l.price || 0), 0);
  const overdueTasks = allTasks.filter((t) => t.isOverdue);

  // Compute comparison deltas
  const deltas = await computeDeltas(teamId, allListings, db);

  return {
    listings: allListings,
    listingsCount: allListings.length,
    pipelineValue,
    tasks: allTasks,
    overdueTasks,
    overdueTasksCount: overdueTasks.length,
    recentActivity,
    aiInsights: insights,
    showings: recentShowings,
    deltas,
  };
}

async function computeDeltas(
  teamId: string,
  allListings: any[],
  db: AppDatabase,
) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const lastQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);

  // Listings created this month vs last month
  const thisMonthListings = allListings.filter(
    (l) => new Date(l.createdAt) >= thisMonthStart,
  ).length;
  const lastMonthListings = allListings.filter(
    (l) => new Date(l.createdAt) >= lastMonthStart && new Date(l.createdAt) < thisMonthStart,
  ).length;
  const listingsDelta = thisMonthListings - lastMonthListings;

  // Pipeline value: get most recent pipeline_metrics rows for this month and last month
  let pipelineValueDelta = 0;
  try {
    const thisMonthDateStr = thisMonthStart.toISOString().split('T')[0];
    const lastMonthDateStr = lastMonthStart.toISOString().split('T')[0];
    const thisMonthEndStr = now.toISOString().split('T')[0];

    const [currentMetrics, prevMetrics] = await Promise.all([
      db.query.pipelineMetrics.findFirst({
        where: and(
          eq(pipelineMetrics.teamId, teamId),
          gte(pipelineMetrics.date, thisMonthDateStr),
        ),
        orderBy: desc(pipelineMetrics.date),
      }),
      db.query.pipelineMetrics.findFirst({
        where: and(
          eq(pipelineMetrics.teamId, teamId),
          gte(pipelineMetrics.date, lastMonthDateStr),
          lt(pipelineMetrics.date, thisMonthDateStr),
        ),
        orderBy: desc(pipelineMetrics.date),
      }),
    ]);

    if (currentMetrics && prevMetrics) {
      pipelineValueDelta = currentMetrics.totalValue - prevMetrics.totalValue;
    }
  } catch {
    // pipeline_metrics may not have data yet
  }

  // Avg DOM: this quarter vs last quarter
  const thisQuarterListings = allListings.filter(
    (l) => l.daysOnMarket != null && l.daysOnMarket > 0 && new Date(l.createdAt) >= thisQuarterStart,
  );
  const lastQuarterListings = allListings.filter(
    (l) => l.daysOnMarket != null && l.daysOnMarket > 0 && new Date(l.createdAt) >= lastQuarterStart && new Date(l.createdAt) < thisQuarterStart,
  );

  const thisQuarterAvgDom = thisQuarterListings.length > 0
    ? Math.round(thisQuarterListings.reduce((s, l) => s + (l.daysOnMarket ?? 0), 0) / thisQuarterListings.length)
    : 0;
  const lastQuarterAvgDom = lastQuarterListings.length > 0
    ? Math.round(lastQuarterListings.reduce((s, l) => s + (l.daysOnMarket ?? 0), 0) / lastQuarterListings.length)
    : 0;
  const domDelta = thisQuarterAvgDom - lastQuarterAvgDom;

  return {
    listingsDelta,
    pipelineValueDelta,
    domDelta,
  };
}
