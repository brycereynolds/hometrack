import type { PageServerLoad, Actions } from './$types';
import { getActivityByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { activityItems, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import crypto from 'node:crypto';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { activityItems: [] };
  }

  try {
    const items = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getActivityByListing(team.id, params.id, db);
    });
    return { activityItems: items };
  } catch {
    return { activityItems: [] };
  }
};

export const actions: Actions = {
  postNote: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const content = form.get('content') as string;

    if (!content?.trim()) {
      return fail(400, { error: 'Content is required' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Look up team member for author info
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        await db.insert(activityItems).values({
          id: crypto.randomUUID(),
          teamId: member.teamId,
          listingId: params.id,
          type: 'note',
          authorId: member.id,
          authorName: member.name,
          authorInitials: member.initials ?? member.name.split(' ').map((n) => n[0]).join('').toUpperCase(),
          content: content.trim(),
          timestamp: new Date(),
        });
      });
      return { success: true };
    } catch (err) {
      console.error('postNote error:', err);
      return fail(500, { error: 'Failed to post note' });
    }
  },

  deleteActivity: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const activityId = form.get('activityId') as string;

    if (!activityId) return fail(400, { error: 'Activity ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        // Only allow deleting own notes
        const item = await db.query.activityItems.findFirst({
          where: and(
            eq(activityItems.id, activityId),
            eq(activityItems.teamId, member.teamId),
          ),
        });
        if (!item) throw new Error('Activity not found');
        if (item.authorId !== member.id) throw new Error('Not authorized to delete this note');

        await db
          .delete(activityItems)
          .where(and(eq(activityItems.id, activityId), eq(activityItems.teamId, member.teamId)));
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete note';
      console.error('deleteActivity error:', err);
      return fail(500, { error: message });
    }
  },

  editActivity: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const form = await request.formData();
    const activityId = form.get('activityId') as string;
    const content = form.get('content') as string;

    if (!activityId) return fail(400, { error: 'Activity ID is required' });
    if (!content?.trim()) return fail(400, { error: 'Content is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const member = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, locals.user!.id),
        });
        if (!member) throw new Error('Team member not found');

        // Only allow editing own notes
        const item = await db.query.activityItems.findFirst({
          where: and(
            eq(activityItems.id, activityId),
            eq(activityItems.teamId, member.teamId),
          ),
        });
        if (!item) throw new Error('Activity not found');
        if (item.authorId !== member.id) throw new Error('Not authorized to edit this note');

        await db
          .update(activityItems)
          .set({ content: content.trim(), updatedAt: new Date() })
          .where(and(eq(activityItems.id, activityId), eq(activityItems.teamId, member.teamId)));
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to edit note';
      console.error('editActivity error:', err);
      return fail(500, { error: message });
    }
  },
};
