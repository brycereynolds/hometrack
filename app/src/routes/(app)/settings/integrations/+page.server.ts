import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { integrations, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { integrations: [] };
  }

  try {
    const integrationList = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.integrations.findMany({
        where: eq(integrations.teamId, team.id),
        with: {
          connectedBy: true,
        },
      });
    });

    return { integrations: integrationList };
  } catch {
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
