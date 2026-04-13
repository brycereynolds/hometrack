import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { adminDb } from '$lib/server/db/index.js';
import { integrations, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // userId
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    throw redirect(303, '/settings/integrations?error=google_denied');
  }

  if (!code || !state) {
    throw error(400, 'Missing authorization code');
  }

  const clientId = env.GOOGLE_ADMIN_CLIENT_ID;
  const clientSecret = env.GOOGLE_ADMIN_SECRET;

  if (!clientId || !clientSecret) {
    throw error(500, 'Google OAuth not configured');
  }

  const redirectUri = `${url.origin}/api/integrations/google/callback`;

  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    console.error('Google token exchange failed:', await tokenRes.text());
    throw redirect(303, '/settings/integrations?error=token_exchange_failed');
  }

  const tokens = await tokenRes.json();

  // Find the team member for this user
  const member = await adminDb.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, state),
  });

  if (!member) {
    throw redirect(303, '/settings/integrations?error=no_team');
  }

  // Update Gmail and Google Calendar integrations to connected
  const googleIntegrationNames = ['Gmail', 'Google Calendar'];

  const teamIntegrations = await adminDb.query.integrations.findMany({
    where: and(
      eq(integrations.teamId, member.teamId),
      inArray(integrations.name, googleIntegrationNames),
    ),
  });

  const now = new Date();
  for (const integration of teamIntegrations) {
    await adminDb.update(integrations)
      .set({
        status: 'connected',
        connectedById: member.id,
        lastSync: now,
        updatedAt: now,
      })
      .where(eq(integrations.id, integration.id));
  }

  // Note: In production, tokens (tokens.access_token, tokens.refresh_token)
  // should be stored encrypted in a dedicated credentials table.
  // For now, integration status is updated to 'connected'.

  throw redirect(303, '/settings/integrations?success=google_connected');
};
