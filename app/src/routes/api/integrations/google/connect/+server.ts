import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const clientId = env.GOOGLE_ADMIN_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_ADMIN_CLIENT_ID is not configured');
  }

  const redirectUri = `${url.origin}/api/integrations/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: locals.user.id,
  });

  throw redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};
