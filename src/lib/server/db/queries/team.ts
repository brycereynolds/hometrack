import { eq } from 'drizzle-orm';
import { db } from '../index.js';
import { teams, teamMembers } from '../schema/index.js';

export async function getTeam(teamId: string) {
  return db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: { members: true },
  });
}

export async function getTeamMembers(teamId: string) {
  return db.query.teamMembers.findMany({
    where: eq(teamMembers.teamId, teamId),
  });
}
