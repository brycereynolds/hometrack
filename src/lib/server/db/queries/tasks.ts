import { eq, and, lt, ne, desc } from 'drizzle-orm';
import { db } from '../index.js';
import { tasks } from '../schema/index.js';

export async function getTasks(teamId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.teamId, teamId),
    with: {
      assignee: true,
      listing: true,
    },
    orderBy: desc(tasks.dueDate),
  });
}

export async function getTasksByListing(teamId: string, listingId: string) {
  return db.query.tasks.findMany({
    where: and(eq(tasks.teamId, teamId), eq(tasks.listingId, listingId)),
    with: {
      assignee: true,
    },
    orderBy: desc(tasks.dueDate),
  });
}

export async function getOverdueTasks(teamId: string) {
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
