import type { PageServerLoad, Actions } from './$types';
import { withRLS, adminDb } from '$lib/server/db/index.js';
import { integrations, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

const DEFAULT_INTEGRATIONS = [
  { name: 'Gmail', description: 'Email sync and send', category: 'email' as const, icon: 'Mail' },
  { name: 'Google Calendar', description: 'Showings and appointments', category: 'calendar' as const, icon: 'Calendar' },
  { name: 'DocuSign', description: 'E-signatures and document routing', category: 'documents' as const, icon: 'FileSignature' },
  { name: 'MLSListings (Bay Area)', description: 'MLS data and comp feeds', category: 'mls' as const, icon: 'Database' },
  { name: 'Zillow', description: 'View and save analytics', category: 'marketing' as const, icon: 'BarChart' },
  { name: 'QuickBooks', description: 'Financial tracking and invoicing', category: 'financial' as const, icon: 'Receipt' },
  { name: 'Slack', description: 'Team notifications and activity updates', category: 'communication' as const, icon: 'MessageSquare' },
  { name: 'Twilio', description: 'SMS messaging (Phase 2)', category: 'communication' as const, icon: 'MessageSquare' },
];

const DEFAULT_NAMES = DEFAULT_INTEGRATIONS.map((i) => i.name);

async function provisionMissingIntegrations(teamId: string, existingNames: string[]) {
  const missing = DEFAULT_INTEGRATIONS.filter((i) => !existingNames.includes(i.name));
  if (missing.length === 0) return;
  await adminDb.insert(integrations).values(
    missing.map((i) => ({
      id: randomUUID(),
      teamId,
      name: i.name,
      description: i.description,
      category: i.category,
      icon: i.icon,
      status: 'disconnected' as const,
    }))
  );
}

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { integrations: [] };
  }

  try {
    // Use adminDb for the read so RLS misconfiguration never causes a silent empty state.
    // The integrations page is team-scoped server-side; RLS is enforced on mutations.
    let integrationList = await adminDb.query.integrations.findMany({
      where: and(eq(integrations.teamId, team.id), inArray(integrations.name, DEFAULT_NAMES)),
      with: { connectedBy: true },
    });

    const existingNames = integrationList.map((i) => i.name);
    const hasMissing = DEFAULT_NAMES.some((n) => !existingNames.includes(n));

    if (hasMissing) {
      await provisionMissingIntegrations(team.id, existingNames);
      integrationList = await adminDb.query.integrations.findMany({
        where: and(eq(integrations.teamId, team.id), inArray(integrations.name, DEFAULT_NAMES)),
        with: { connectedBy: true },
      });
    }

    return { integrations: integrationList };
  } catch (err) {
    console.error('integrations load error:', err);
    return { integrations: [] };
  }
};

export const actions: Actions = {
  connectSlack: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const integrationId = form.get('integrationId') as string;
    const webhookUrl = form.get('webhookUrl') as string;

    if (!integrationId || !webhookUrl) {
      return fail(400, { error: 'Missing required fields' });
    }

    if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
      return fail(400, { error: 'Invalid Slack webhook URL' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('No team membership found');

        await db
          .update(integrations)
          .set({
            status: 'connected',
            config: {
              enabled: true,
              webhookUrl,
              connectedAt: new Date().toISOString(),
              connectedBy: member.id,
            },
            connectedById: member.id,
            lastSync: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(integrations.id, integrationId), eq(integrations.teamId, member.teamId)));
      });

      return { success: true, action: 'connectSlack' };
    } catch (err) {
      console.error('connectSlack error:', err);
      return fail(500, { error: 'Failed to connect Slack' });
    }
  },

  disconnectSlack: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const integrationId = form.get('integrationId') as string;

    if (!integrationId) {
      return fail(400, { error: 'Missing integration ID' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('No team membership found');

        await db
          .update(integrations)
          .set({
            status: 'disconnected',
            config: null,
            connectedById: null,
            lastSync: null,
            updatedAt: new Date(),
          })
          .where(and(eq(integrations.id, integrationId), eq(integrations.teamId, member.teamId)));
      });

      return { success: true, action: 'disconnectSlack' };
    } catch (err) {
      console.error('disconnectSlack error:', err);
      return fail(500, { error: 'Failed to disconnect Slack' });
    }
  },
};
