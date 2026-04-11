import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../index.js';
import {
  analyticsEvents,
  analyticsShowings,
  pipelineMetrics,
  teamPerformance,
} from '../schema/index.js';

export interface ViewTimeSeries {
  labels: string[];
  zillow: number[];
  redfin: number[];
  realtor: number[];
  website: number[];
  social: number[];
}

/** Get view time-series for a listing, grouped by platform and date */
export async function getListingViewTimeSeries(listingId: string): Promise<ViewTimeSeries> {
  const rows = await db
    .select({
      date: analyticsEvents.date,
      platform: analyticsEvents.platform,
      count: sql<number>`sum(${analyticsEvents.count})::int`,
    })
    .from(analyticsEvents)
    .where(and(eq(analyticsEvents.listingId, listingId), eq(analyticsEvents.eventType, 'view')))
    .groupBy(analyticsEvents.date, analyticsEvents.platform)
    .orderBy(analyticsEvents.date);

  // Pivot into chart-ready shape
  const dateMap = new Map<string, Record<string, number>>();
  for (const r of rows) {
    if (!dateMap.has(r.date)) dateMap.set(r.date, {});
    dateMap.get(r.date)![r.platform] = r.count;
  }
  const labels = [...dateMap.keys()].map((d) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const values = [...dateMap.values()];
  return {
    labels,
    zillow: values.map((v) => v['zillow'] ?? 0),
    redfin: values.map((v) => v['redfin'] ?? 0),
    realtor: values.map((v) => v['realtor'] ?? 0),
    website: values.map((v) => v['website'] ?? 0),
    social: values.map((v) => v['social'] ?? 0),
  };
}

/** Get showing volume for a listing, aggregated by week */
export async function getListingShowingsSeries(listingId: string) {
  const rows = await db
    .select()
    .from(analyticsShowings)
    .where(eq(analyticsShowings.listingId, listingId))
    .orderBy(analyticsShowings.date);

  const labels = rows.map((_, i) => `Week ${i + 1}`);
  return {
    labels,
    showings: rows.map((r) => r.showingCount),
    openHouseAttendees: rows.map((r) => r.openHouseAttendees),
  };
}

/** Get pipeline value trends for a team */
export async function getPipelineTimeSeries(teamId: string) {
  const rows = await db
    .select()
    .from(pipelineMetrics)
    .where(eq(pipelineMetrics.teamId, teamId))
    .orderBy(pipelineMetrics.date);

  return {
    labels: rows.map((r) => {
      const dt = new Date(r.date + 'T00:00:00');
      return dt.toLocaleDateString('en-US', { month: 'short' });
    }),
    values: rows.map((r) => r.totalValue),
    closedDeals: rows.map((r) => r.closedDeals),
  };
}

/** Get team performance data for charts */
export async function getTeamPerformanceData(teamMemberIds: string[]) {
  const rows = await db
    .select()
    .from(teamPerformance)
    .where(eq(teamPerformance.period, 'monthly'))
    .orderBy(desc(teamPerformance.periodStart));

  // Filter to known members and build chart data
  const memberRows = rows.filter((r) => teamMemberIds.includes(r.teamMemberId!));
  return memberRows;
}
