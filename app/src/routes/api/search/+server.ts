import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { listings, properties, contacts, tasks, teamMembers, vendors } from '$lib/server/db/schema/index.js';
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
      if (!member) return { listings: [], contacts: [], tasks: [], vendors: [], team: [] };

      const teamId = member.teamId;

      const [matchedListings, matchedContacts, matchedTasks, matchedVendors, matchedTeam] = await Promise.all([
        db.query.listings.findMany({
          where: eq(listings.teamId, teamId),
          with: { property: true },
          limit: 50,
        }).then((rows) =>
          rows
            .filter((l) =>
              l.property.address?.toLowerCase().includes(q!.toLowerCase()) ||
              l.property.city?.toLowerCase().includes(q!.toLowerCase()),
            )
            .slice(0, 5),
        ),
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
        db.query.vendors.findMany({
          where: and(
            eq(vendors.teamId, teamId),
            or(
              ilike(vendors.name, pattern),
              ilike(vendors.company, pattern),
            ),
          ),
          limit: 5,
        }),
        db.query.teamMembers.findMany({
          where: and(
            eq(teamMembers.teamId, teamId),
            ilike(teamMembers.name, pattern),
          ),
          limit: 5,
        }),
      ]);

      const sortByTitle = (a: { title: string }, b: { title: string }) =>
        a.title.localeCompare(b.title);

      return {
        listings: matchedListings.map((l) => ({
          id: l.id,
          title: l.property.address,
          subtitle: `${l.property.city}, ${l.property.state}`,
          href: `/listings/${l.id}`,
          type: 'listing' as const,
        })).sort(sortByTitle),
        contacts: matchedContacts.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: c.type,
          href: `/contacts/${c.id}`,
          type: 'contact' as const,
        })).sort(sortByTitle),
        vendors: matchedVendors.map((v) => ({
          id: v.id,
          title: v.name,
          subtitle: [v.company, v.category].filter(Boolean).join(' · '),
          href: `/vendors/${v.id}`,
          type: 'vendor' as const,
        })).sort(sortByTitle),
        tasks: matchedTasks.map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.status,
          href: `/listings/${t.listingId}/tasks`,
          type: 'task' as const,
        })).sort(sortByTitle),
        team: matchedTeam.map((m) => ({
          id: m.id,
          title: m.name,
          subtitle: m.roleLabel ?? m.role,
          href: '/settings',
          type: 'team' as const,
        })).sort(sortByTitle),
      };
    });

    return json(results);
  } catch (err) {
    console.error('Search error:', err);
    return json({ listings: [], contacts: [], tasks: [], vendors: [], team: [] }, { status: 500 });
  }
};
