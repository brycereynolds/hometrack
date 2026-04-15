import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { listings, teamMembers, teams } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sendPortalInvite } from '$lib/server/comms.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { portalSettings: null };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const listing = await db.query.listings.findFirst({
        where: and(eq(listings.id, params.id), eq(listings.teamId, team.id)),
        columns: { portalSettings: true },
      });
      return { portalSettings: (listing?.portalSettings as Record<string, unknown>) ?? null };
    });
  } catch {
    return { portalSettings: null };
  }
};

async function getTeamId(userId: string) {
  return withRLS(userId, 'authenticated', async (db) => {
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });
    return member?.teamId ?? null;
  });
}

export const actions: Actions = {
  savePortalSections: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });
    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    const formData = await request.formData();
    const sections = JSON.parse(formData.get('sections')?.toString() ?? '{}');

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const existing = await db.query.listings.findFirst({
          where: and(eq(listings.id, params.id), eq(listings.teamId, teamId)),
          columns: { portalSettings: true },
        });
        const current = (existing?.portalSettings as Record<string, unknown>) ?? {};
        await db
          .update(listings)
          .set({
            portalSettings: { ...current, sections },
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, params.id), eq(listings.teamId, teamId)));
      });
    } catch (err) {
      console.error('Failed to save portal sections:', err);
      return fail(500, { error: 'Failed to save portal sections' });
    }
    return { success: true, action: 'savePortalSections' };
  },

  saveDocumentSharing: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });
    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    const formData = await request.formData();
    const documentSharing = JSON.parse(formData.get('documentSharing')?.toString() ?? '{}');

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const existing = await db.query.listings.findFirst({
          where: and(eq(listings.id, params.id), eq(listings.teamId, teamId)),
          columns: { portalSettings: true },
        });
        const current = (existing?.portalSettings as Record<string, unknown>) ?? {};
        await db
          .update(listings)
          .set({
            portalSettings: { ...current, documentSharing },
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, params.id), eq(listings.teamId, teamId)));
      });
    } catch (err) {
      console.error('Failed to save document sharing:', err);
      return fail(500, { error: 'Failed to save document sharing' });
    }
    return { success: true, action: 'saveDocumentSharing' };
  },

  saveNotifications: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });
    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    const formData = await request.formData();
    const notifications = JSON.parse(formData.get('notifications')?.toString() ?? '{}');

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const existing = await db.query.listings.findFirst({
          where: and(eq(listings.id, params.id), eq(listings.teamId, teamId)),
          columns: { portalSettings: true },
        });
        const current = (existing?.portalSettings as Record<string, unknown>) ?? {};
        await db
          .update(listings)
          .set({
            portalSettings: { ...current, notifications },
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, params.id), eq(listings.teamId, teamId)));
      });
    } catch (err) {
      console.error('Failed to save notifications:', err);
      return fail(500, { error: 'Failed to save notifications' });
    }
    return { success: true, action: 'saveNotifications' };
  },

  approveRequest: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });
    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    const formData = await request.formData();
    const requestId = formData.get('requestId')?.toString();
    if (!requestId) return fail(400, { error: 'Missing request ID' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const existing = await db.query.listings.findFirst({
          where: and(eq(listings.id, params.id), eq(listings.teamId, teamId)),
          columns: { portalSettings: true },
        });
        const current = (existing?.portalSettings as Record<string, unknown>) ?? {};
        const approvalQueue = (current.approvalQueue as Array<{ id: string; status: string }>) ?? [];
        const updated = approvalQueue.map((item) =>
          item.id === requestId ? { ...item, status: 'approved' } : item,
        );
        await db
          .update(listings)
          .set({
            portalSettings: { ...current, approvalQueue: updated },
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, params.id), eq(listings.teamId, teamId)));
      });
    } catch (err) {
      console.error('Failed to approve request:', err);
      return fail(500, { error: 'Failed to approve request' });
    }
    return { success: true, action: 'approveRequest' };
  },

  denyRequest: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });
    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    const formData = await request.formData();
    const requestId = formData.get('requestId')?.toString();
    if (!requestId) return fail(400, { error: 'Missing request ID' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const existing = await db.query.listings.findFirst({
          where: and(eq(listings.id, params.id), eq(listings.teamId, teamId)),
          columns: { portalSettings: true },
        });
        const current = (existing?.portalSettings as Record<string, unknown>) ?? {};
        const approvalQueue = (current.approvalQueue as Array<{ id: string; status: string }>) ?? [];
        const updated = approvalQueue.map((item) =>
          item.id === requestId ? { ...item, status: 'denied' } : item,
        );
        await db
          .update(listings)
          .set({
            portalSettings: { ...current, approvalQueue: updated },
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, params.id), eq(listings.teamId, teamId)));
      });
    } catch (err) {
      console.error('Failed to deny request:', err);
      return fail(500, { error: 'Failed to deny request' });
    }
    return { success: true, action: 'denyRequest' };
  },

  sendToClient: async ({ params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });
    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    try {
      const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
        const listing = await db.query.listings.findFirst({
          where: and(eq(listings.id, params.id), eq(listings.teamId, teamId)),
          columns: { address: true, portalSettings: true },
          with: { client: { columns: { name: true, email: true } } },
        });
        if (!listing) return fail(400, { error: 'Listing not found' });

        const team = await db.query.teams.findFirst({
          where: eq(teams.id, teamId),
          columns: { name: true, slug: true },
        });

        const clientEmail = listing.client?.email;
        const clientName = listing.client?.name ?? 'there';
        if (!clientEmail) return fail(400, { error: 'No client email on this listing' });

        const portalBaseUrl = env.PORTAL_BASE_URL ?? '';
        const portalUrl = `${portalBaseUrl}/${team?.slug ?? 'team'}`;

        await sendPortalInvite({
          clientEmail,
          clientName,
          teamName: team?.name ?? 'Your agent',
          portalUrl,
          listingAddress: listing.address ?? 'your property',
        });

        return { success: true, action: 'sendToClient' };
      });
      return result;
    } catch (err) {
      console.error('Failed to send portal invite:', err);
      return fail(500, { error: 'Failed to send portal invite' });
    }
  },
};
