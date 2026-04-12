import type { LayoutServerLoad } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { teams } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

// Portal auth model: Clients access this route group without standard user auth.
// Portal-specific authentication (e.g., magic links, access tokens) will be
// implemented separately. For now, queries are scoped strictly to the team
// identified by the URL slug to prevent cross-team data leakage.

export const load: LayoutServerLoad = async ({ params }) => {
  const team = await adminDb.query.teams.findFirst({
    where: eq(teams.slug, params.team),
  });

  if (!team) {
    throw error(404, 'Team not found');
  }

  return { team };
};
