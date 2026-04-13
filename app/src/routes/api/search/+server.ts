import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { listings, contacts, tasks, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and, ilike, or } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    return json({ results: [] }, { status: 401 });
  }

  const q = url.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return json({ results: [] });
  }

  const pattern = `%${q}%`;

  try {
    const results = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const member = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, locals.user!.id),
      });
      if (!member) return { listings: [], contacts: [], tasks: [] };

      const teamId = member.teamId;

      const [matchedListings, matchedContacts, matchedTasks] = await Promise.all([
        db.query.listings.findMany({
          where: and(
            eq(listings.teamId, teamId),
            or(
              ilike(listings.address, pattern),
              ilike(listings.city, pattern),
            ),
          ),
          limit: 5,
        }),
        db.query.contacts.findMany({
          where: and(
            eq(contacts.teamId, teamId),
            or(
              ilike(contacts.name, pattern),
              ilike(contacts.email, pattern),
            ),
          ),
          limit: 5,
        }),
        db.query.tasks.findMany({
          where: and(
            eq(tasks.teamId, teamId),
            ilike(tasks.title, pattern),
          ),
          limit: 5,
        }),
      ]);

      return {
        listings: matchedListings.map((l) => ({
          id: l.id,
          title: l.address,
          subtitle: `${l.city}, ${l.state}`,
          href: `/listings/${l.id}`,
          type: 'listing' as const,
        })),
        contacts: matchedContacts.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: c.type,
          href: `/contacts/${c.id}`,
          type: 'contact' as const,
        })),
        tasks: matchedTasks.map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.status,
          href: `/listings/${t.listingId}/tasks`,
          type: 'task' as const,
        })),
      };
    });

    return json(results);
  } catch (err) {
    console.error('Search error:', err);
    return json({ listings: [], contacts: [], tasks: [] }, { status: 500 });
  }
};
