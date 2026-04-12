import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { team, teamMembers } = await parent();

  return {
    team,
    teamMembers,
  };
};
