import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const clientId = env.SLACK_CLIENT_ID;
	if (!clientId) {
		return new Response('Slack integration not configured', { status: 500 });
	}

	const redirectUri = `${url.origin}/api/integrations/slack/oauth`;
	const scopes = 'app_mentions:read,chat:write,files:read,channels:history';

	const slackUrl = new URL('https://slack.com/oauth/v2/authorize');
	slackUrl.searchParams.set('client_id', clientId);
	slackUrl.searchParams.set('scope', scopes);
	slackUrl.searchParams.set('redirect_uri', redirectUri);

	redirect(302, slackUrl.toString());
};
