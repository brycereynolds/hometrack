import type { PageServerLoad, Actions } from './$types';
import { withRLS, adminDb } from '$lib/server/db/index.js';
import { integrations, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

// Only real (non-demo) integrations are stored in the DB.
// The static card list lives in the Svelte component.
const REAL_INTEGRATION_NAMES = ['Slack'];

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { connectedIntegrations: [] };
  }

  try {
    const connectedIntegrations = await adminDb.query.integrations.findMany({
      where: and(
        eq(integrations.teamId, team.id),
        eq(integrations.status, 'connected'),
      ),
      with: { connectedBy: true },
    });

    return { connectedIntegrations };
  } catch (err) {
    console.error('integrations load error:', err);
    return { connectedIntegrations: [] };
  }
};

export const actions: Actions = {
  connectSlack: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const webhookUrl = form.get('webhookUrl') as string;

    if (!webhookUrl) {
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

        // Check for existing Slack row and upsert
        const existing = await db.query.integrations.findFirst({
          where: and(eq(integrations.teamId, member.teamId), eq(integrations.name, 'Slack')),
        });

        const now = new Date();
        const config = {
          enabled: true,
          webhookUrl,
          connectedAt: now.toISOString(),
          connectedBy: member.id,
        };

        if (existing) {
          await db
            .update(integrations)
            .set({ status: 'connected', config, connectedById: member.id, lastSync: now, updatedAt: now })
            .where(eq(integrations.id, existing.id));
        } else {
          await db.insert(integrations).values({
            id: randomUUID(),
            teamId: member.teamId,
            name: 'Slack',
            description: 'Team notifications and activity updates',
            category: 'communication',
            icon: 'MessageSquare',
            status: 'connected',
            config,
            connectedById: member.id,
            lastSync: now,
            createdAt: now,
            updatedAt: now,
          });
        }
      });

      return { success: true, action: 'connectSlack' };
    } catch (err) {
      console.error('connectSlack error:', err);
      return fail(500, { error: 'Failed to connect Slack' });
    }
  },

  disconnectSlack: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('No team membership found');

        await db
          .update(integrations)
          .set({ status: 'disconnected', config: null, connectedById: null, lastSync: null, updatedAt: new Date() })
          .where(and(eq(integrations.teamId, member.teamId), eq(integrations.name, 'Slack')));
      });

      return { success: true, action: 'disconnectSlack' };
    } catch (err) {
      console.error('disconnectSlack error:', err);
      return fail(500, { error: 'Failed to disconnect Slack' });
    }
  },
};
