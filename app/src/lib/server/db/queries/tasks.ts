import { eq, and, desc } from 'drizzle-orm';
import { adminDb, type AppDatabase } from '../index.js';
import { tasks } from '../schema/index.js';

export async function getTasks(teamId: string, db: AppDatabase = adminDb) {
  return db.query.tasks.findMany({
    where: eq(tasks.teamId, teamId),
    with: {
      assignee: true,
      listing: true,
    },
    orderBy: desc(tasks.dueDate),
  });
}

export async function getTasksByListing(teamId: string, listingId: string, db: AppDatabase = adminDb) {
  return db.query.tasks.findMany({
    where: and(eq(tasks.teamId, teamId), eq(tasks.listingId, listingId)),
    with: {
      assignee: true,
      quotes: {
        with: { vendor: true },
      },
    },
    orderBy: desc(tasks.dueDate),
  });
}

export async function getOverdueTasks(teamId: string, db: AppDatabase = adminDb) {
  return db.query.tasks.findMany({
    where: and(
      eq(tasks.teamId, teamId),
      eq(tasks.isOverdue, true),
    ),
    with: {
      assignee: true,
      listing: true,
    },
  });
}
