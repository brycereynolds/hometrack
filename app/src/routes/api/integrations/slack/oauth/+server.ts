import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { adminDb } from '$lib/server/db/index.js';
import { integrations, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		console.error('[Slack OAuth] Error from Slack:', error);
		redirect(302, '/settings/integrations?slack=error');
	}

	if (!code) {
		redirect(302, '/settings/integrations?slack=error');
	}

	const clientId = env.SLACK_CLIENT_ID;
	const clientSecret = env.SLACK_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		console.error('[Slack OAuth] Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET');
		redirect(302, '/settings/integrations?slack=error');
	}

	try {
		// Exchange code for bot token
		const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				code,
				redirect_uri: `${url.origin}/api/integrations/slack/oauth`,
			}),
		});

		const tokenData = await tokenRes.json();

		if (!tokenData.ok) {
			console.error('[Slack OAuth] Token exchange failed:', tokenData.error);
			redirect(302, '/settings/integrations?slack=error');
		}

		const botToken = tokenData.access_token;
		const workspaceId = tokenData.team?.id;
		const workspaceName = tokenData.team?.name;

		// Find the user's team
		const member = await adminDb.query.teamMembers.findFirst({
			where: eq(teamMembers.userId, locals.user.id),
		});

		if (!member) {
			redirect(302, '/settings/integrations?slack=error');
		}

		// Update or find the Slack integration for this team
		const slackIntegration = await adminDb.query.integrations.findFirst({
			where: and(
				eq(integrations.teamId, member.teamId),
				eq(integrations.name, 'Slack'),
			),
		});

		if (!slackIntegration) {
			redirect(302, '/settings/integrations?slack=error');
		}

		// Store OAuth data in the integration config
		await adminDb
			.update(integrations)
			.set({
				status: 'connected',
				config: {
					enabled: true,
					method: 'oauth',
					botToken,
					workspaceId,
					workspaceName,
					connectedAt: new Date().toISOString(),
				},
				connectedById: member.id,
				lastSync: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(integrations.id, slackIntegration.id));

		redirect(302, '/settings/integrations?slack=connected');
	} catch (err) {
		// Re-throw redirects
		if (err && typeof err === 'object' && 'status' in err) throw err;

		console.error('[Slack OAuth] Error:', err);
		redirect(302, '/settings/integrations?slack=error');
	}
};
