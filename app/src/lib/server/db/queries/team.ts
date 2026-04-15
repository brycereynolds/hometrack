import { eq } from 'drizzle-orm';
import { adminDb, type AppDatabase } from '../index.js';
import { teams, teamMembers } from '../schema/index.js';

export async function getTeam(teamId: string, db: AppDatabase = adminDb) {
  return db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: { members: true },
  });
}

export async function getTeamMembers(teamId: string, db: AppDatabase = adminDb) {
  return db.query.teamMembers.findMany({
    where: eq(teamMembers.teamId, teamId),
  });
}
