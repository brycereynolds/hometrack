import type { PageServerLoad, Actions } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { activityItems, listings } from '$lib/server/db/schema/index.js';
import { eq, desc, and, or, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ parent }) => {
  const { team } = await parent();

  // Get the first listing for this team (portal context)
  const listing = await adminDb.query.listings.findFirst({
    where: eq(listings.teamId, team.id),
    with: { property: true, agent: true, client: true },
  });

  // Load activity items that are relevant to client communication:
  // messages, notes, and portal messages (metadata.source = 'portal')
  const messages = await adminDb.query.activityItems.findMany({
    where: and(
      eq(activityItems.teamId, team.id),
      or(
        eq(activityItems.type, 'message'),
        eq(activityItems.type, 'note'),
      ),
    ),
    orderBy: desc(activityItems.timestamp),
    limit: 50,
  });

  return {
    listing,
    messages,
  };
};

export const actions: Actions = {
  sendMessage: async ({ request, params }) => {
    const formData = await request.formData();
    const content = (formData.get('content') as string)?.trim();
    const teamId = formData.get('teamId') as string;
    const listingId = (formData.get('listingId') as string) || null;
    const clientName = (formData.get('clientName') as string) || 'Client';

    if (!content) return fail(400, { error: 'Message cannot be empty' });
    if (!teamId) return fail(400, { error: 'Team context missing' });

    try {
      await adminDb.insert(activityItems).values({
        id: nanoid(),
        teamId,
        listingId,
        type: 'message',
        authorName: clientName,
        content,
        metadata: { source: 'portal' },
        timestamp: new Date(),
      });
      return { success: true };
    } catch (e) {
      console.error('Send portal message error:', e);
      return fail(500, { error: 'Failed to send message' });
    }
  },
};
