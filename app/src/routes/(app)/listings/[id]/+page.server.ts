import type { PageServerLoad, Actions } from './$types';
import { getTasksByListing } from '$lib/server/db/queries/tasks.js';
import { getActivityByListing, getInsightsByListing, getConfirmedComps } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { listings, properties, teamMembers, teams, aiInsights as aiInsightsTable, activityItems as activityItemsTable } from '$lib/server/db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'node:crypto';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sendPhaseChangeNotification } from '$lib/server/comms.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { tasks: [], activityItems: [], aiInsights: [], confirmedComps: null, pendingAlerts: [] };
  }

  try {
    return await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [tasks, activityItems, aiInsights, confirmedCompsData, pendingAlerts] = await Promise.all([
        getTasksByListing(team.id, params.id, db),
        getActivityByListing(team.id, params.id, db),
        getInsightsByListing(team.id, params.id, db),
        getConfirmedComps(params.id, db),
        db.query.aiInsights.findMany({
          where: and(
            eq(aiInsightsTable.listingId, params.id),
            eq(aiInsightsTable.dismissed, false)
          ),
          orderBy: desc(aiInsightsTable.timestamp),
        }),
      ]);
      return { tasks, activityItems, aiInsights, confirmedComps: confirmedCompsData, pendingAlerts };
    });
  } catch {
    return { tasks: [], activityItems: [], aiInsights: [], confirmedComps: null, pendingAlerts: [] };
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
  changePhase: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    const formData = await request.formData();
    const phase = formData.get('phase')?.toString();

    const validPhases = ['pre_market', 'active', 'closed', 'canceled'];
    if (!phase || !validPhases.includes(phase)) {
      return fail(400, { error: 'Invalid phase' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(listings)
          .set({
            phase: phase as 'pre_market' | 'active' | 'closed' | 'canceled',
            daysInPhase: 0,
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, params.id), eq(listings.teamId, teamId)));

        await db.insert(activityItemsTable).values({
          id: crypto.randomUUID(),
          teamId,
          listingId: params.id,
          type: 'phase_change',
          authorName: 'System',
          authorInitials: 'HT',
          content: `Phase changed to ${phase.replace('_', ' ')}`,
          timestamp: new Date(),
        });

        // Send phase change notification if configured
        try {
          const listing = await db.query.listings.findFirst({
            where: and(eq(listings.id, params.id), eq(listings.teamId, teamId)),
            columns: { portalSettings: true, propertyId: true },
            with: {
              property: { columns: { address: true } },
              client: { columns: { name: true, email: true, phone: true } },
            },
          });

          const notifSettings = (listing?.portalSettings as Record<string, any>)?.notifications
            ?.phase_change;
          const clientEmail = listing?.client?.email;

          if (clientEmail && notifSettings) {
            const team = await db.query.teams.findFirst({
              where: eq(teams.id, teamId),
              columns: { name: true, slug: true },
            });
            const portalBaseUrl = env.PORTAL_BASE_URL ?? '';
            const portalUrl = `${portalBaseUrl}/${team?.slug ?? 'team'}`;

            await sendPhaseChangeNotification({
              recipientEmail: clientEmail,
              recipientPhone: listing?.client?.phone ?? undefined,
              emailEnabled: notifSettings.email ?? false,
              smsEnabled: notifSettings.sms ?? false,
              clientName: listing?.client?.name ?? 'there',
              teamName: team?.name ?? 'Your agent',
              listingAddress: listing?.property?.address ?? 'your property',
              newPhase: phase,
              portalUrl,
            });
          }
        } catch (notifErr) {
          console.error('Phase change notification failed (non-blocking):', notifErr);
        }
      });
    } catch (err) {
      console.error('Failed to change phase:', err);
      return fail(500, { error: 'Failed to change phase' });
    }

    return { success: true, action: 'changePhase' };
  },

  editListing: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const teamId = await getTeamId(locals.user.id);
    if (!teamId) return fail(400, { error: 'No team found' });

    const formData = await request.formData();

    const address = formData.get('address')?.toString().trim();
    const city = formData.get('city')?.toString().trim();
    const state = formData.get('state')?.toString().trim();
    const zip = formData.get('zip')?.toString().trim();

    if (!address || !city || !state || !zip) {
      return fail(400, { error: 'Address, city, state, and ZIP are required' });
    }

    const priceStr = formData.get('price')?.toString().replace(/[^0-9.]/g, '');
    const price = priceStr ? parseFloat(priceStr) : null;
    const beds = parseInt(formData.get('beds')?.toString() ?? '') || null;
    const baths = parseFloat(formData.get('baths')?.toString() ?? '') || null;
    const sqft = parseInt(formData.get('sqft')?.toString() ?? '') || null;
    const lotSqft = parseInt(formData.get('lotSqft')?.toString() ?? '') || null;
    const yearBuilt = parseInt(formData.get('yearBuilt')?.toString() ?? '') || null;
    const propertyType = formData.get('propertyType')?.toString() || null;
    const description = formData.get('description')?.toString().trim() || null;
    const mlsNumber = formData.get('mlsNumber')?.toString().trim() || null;

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Get the listing to find the propertyId
        const listing = await db.query.listings.findFirst({
          where: and(eq(listings.id, params.id), eq(listings.teamId, teamId)),
          columns: { propertyId: true },
        });
        if (!listing) throw new Error('Listing not found');

        // Update property fields on the properties table
        await db
          .update(properties)
          .set({
            address,
            city,
            state,
            zip,
            beds,
            baths,
            sqft,
            lotSqft,
            yearBuilt,
            propertyType,
            updatedAt: new Date(),
          })
          .where(eq(properties.id, listing.propertyId));

        // Update listing-specific fields on the listings table
        await db
          .update(listings)
          .set({
            price,
            description,
            mlsNumber,
            updatedAt: new Date(),
          })
          .where(and(eq(listings.id, params.id), eq(listings.teamId, teamId)));

        await db.insert(activityItemsTable).values({
          id: crypto.randomUUID(),
          teamId,
          listingId: params.id,
          type: 'system',
          authorName: 'System',
          authorInitials: 'HT',
          content: `Listing updated: ${address}`,
          timestamp: new Date(),
        });
      });
    } catch (err) {
      console.error('Failed to edit listing:', err);
      return fail(500, { error: 'Failed to update listing' });
    }

    return { success: true, action: 'editListing' };
  },
};
