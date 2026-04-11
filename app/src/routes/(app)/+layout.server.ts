import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db/index.js';

export const load: LayoutServerLoad = async () => {
  try {
    const team = await db.query.teams.findFirst({
      with: { members: true },
    });

    if (!team) {
      return { team: null, teamMembers: [] };
    }

    return {
      team,
      teamMembers: team.members,
    };
  } catch {
    return { team: null, teamMembers: [] };
  }
};
