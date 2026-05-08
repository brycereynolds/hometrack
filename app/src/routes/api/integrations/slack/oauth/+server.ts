import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { adminDb } from '$lib/server/db/index.js';
import { integrations, teamMembers, teams } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase.js';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';

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

		// Check if a Slack agent member already exists for this team
		const existingAgent = await adminDb.query.teamMembers.findFirst({
			where: and(
				eq(teamMembers.teamId, member.teamId),
				eq(teamMembers.isAgent, true),
				eq(teamMembers.agentType, 'slack'),
			),
		});

		let agentMemberId = existingAgent?.id;
		let agentUserId = existingAgent?.userId;

		if (!existingAgent) {
			// Get team slug for the agent email
			const team = await adminDb.query.teams.findFirst({
				where: eq(teams.id, member.teamId),
			});
			const teamSlug = team?.slug ?? 'default';

			// Create a GoTrue user for the agent
			const supabaseAdmin = getSupabaseAdmin();
			const agentEmail = `slack-agent@${teamSlug}.hometrack.agent`;
			const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
				email: agentEmail,
				password: randomUUID(),
				email_confirm: true,
			});

			if (authError) {
				console.error('[Slack OAuth] Failed to create agent auth user:', authError);
				redirect(302, '/settings/integrations?slack=error');
			}

			agentUserId = authUser.user.id;
			agentMemberId = nanoid();

			await adminDb.insert(teamMembers).values({
				id: agentMemberId,
				teamId: member.teamId,
				name: 'HomeTrack Slack Agent',
				email: agentEmail,
				userId: agentUserId,
				role: 'agent',
				roleLabel: 'AI Agent',
				isAgent: true,
				agentType: 'slack',
				initials: 'SA',
			});
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
					agentMemberId,
					agentUserId,
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
