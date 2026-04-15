import type { PageServerLoad, Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ parent }) => {
  const { team, teamMembers } = await parent();

  return {
    team,
    teamMembers,
  };
};

export const actions: Actions = {
  inviteMember: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const teamId = formData.get('teamId') as string;
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const role = formData.get('role') as string;

    if (!teamId) return fail(400, { error: 'Missing team' });
    if (!name) return fail(400, { error: 'Name is required' });
    if (!email) return fail(400, { error: 'Email is required' });
    if (!role) return fail(400, { error: 'Role is required' });

    // Generate initials from name
    const parts = name.split(/\s+/);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    const roleLabelMap: Record<string, string> = {
      admin: 'Admin',
      listing_agent: 'Listing Agent',
      tc: 'Transaction Coordinator',
      marketing: 'Marketing',
      staging_lead: 'Staging Lead',
    };

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(teamMembers).values({
          id: nanoid(),
          teamId,
          name,
          email,
          role: role as 'admin' | 'listing_agent' | 'tc' | 'marketing' | 'staging_lead',
          roleLabel: roleLabelMap[role] || role,
          initials,
          userId: null,
        });
      });
      return { success: true };
    } catch (e: any) {
      if (e?.code === '23505') {
        return fail(400, { error: 'A member with this email already exists on the team' });
      }
      console.error('Invite member error:', e);
      return fail(500, { error: 'Failed to invite member' });
    }
  },

  removeMember: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const memberId = formData.get('memberId') as string;
    const teamId = formData.get('teamId') as string;

    if (!memberId || !teamId) return fail(400, { error: 'Missing required fields' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .delete(teamMembers)
          .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId)));
      });
      return { success: true };
    } catch (e) {
      console.error('Remove member error:', e);
      return fail(500, { error: 'Failed to remove member' });
    }
  },
};
