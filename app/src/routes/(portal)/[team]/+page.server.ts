import type { PageServerLoad, Actions } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { listings, activityItems, showings, contacts } from '$lib/server/db/schema/index.js';
import { eq, desc, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

// All queries are scoped to team.id from the parent layout, which resolves
// the team strictly by URL slug. No cross-team data is returned.

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  const [allListings, activity, recentShowings] = await Promise.all([
    adminDb.query.listings.findMany({
      where: eq(listings.teamId, team.id),
      with: { property: true, agent: true, client: true },
    }),
    adminDb.query.activityItems.findMany({
      where: eq(activityItems.teamId, team.id),
      orderBy: desc(activityItems.timestamp),
      limit: 10,
    }),
    adminDb.query.showings.findMany({
      where: eq(showings.teamId, team.id),
      orderBy: desc(showings.date),
      limit: 10,
    }),
  ]);

  // Use first listing as the client's property (portal shows a single listing context)
  const listing = allListings[0] ?? null;

  const portalSettings = (listing?.portalSettings as Record<string, any>) ?? null;

  return {
    listing,
    listings: allListings,
    recentActivity: activity,
    showings: recentShowings,
    portalSettings,
  };
};

export const actions: Actions = {
  authenticate: async ({ request, params, cookies }) => {
    const formData = await request.formData();
    const email = (formData.get('email') as string)?.trim().toLowerCase();

    if (!email) return fail(400, { error: 'Please enter your email address.' });

    // Look up the team by slug
    const { teams } = await import('$lib/server/db/schema/index.js');
    const team = await adminDb.query.teams.findFirst({
      where: eq(teams.slug, params.team),
    });

    if (!team) return fail(404, { error: 'Team not found.' });

    // Check if this email matches a contact on the team
    const contact = await adminDb.query.contacts.findFirst({
      where: and(eq(contacts.teamId, team.id), eq(contacts.email, email)),
    });

    if (!contact) {
      return fail(403, { error: 'No account found for this email. Please contact your agent for access.' });
    }

    // Set portal_token cookie (simple email-based token for now)
    const token = Buffer.from(JSON.stringify({ email, teamId: team.id, contactId: contact.id })).toString('base64');
    cookies.set('portal_token', token, {
      path: `/${params.team}`,
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Set to true in production
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true };
  },
};
