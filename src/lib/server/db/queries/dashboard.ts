import { eq, desc } from 'drizzle-orm';
import { db } from '../index.js';
import { listings, tasks, activityItems, aiInsights, showings } from '../schema/index.js';

export async function getDashboardData(teamId: string) {
  const [allListings, allTasks, recentActivity, insights, recentShowings] = await Promise.all([
    db.query.listings.findMany({
      where: eq(listings.teamId, teamId),
      with: { agent: true, client: true },
    }),
    db.query.tasks.findMany({
      where: eq(tasks.teamId, teamId),
      with: { assignee: true, listing: true },
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
  };
}
