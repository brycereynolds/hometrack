import type { PageServerLoad, Actions } from './$types';
import { getContactById, getContactListings, getContactActivity } from '$lib/server/db/queries/contacts.js';
import { withRLS } from '$lib/server/db/index.js';
import { contacts, activityItems } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    throw error(401, 'Not authenticated');
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const [contact, contactListings, activity] = await Promise.all([
        getContactById(team.id, params.id, db),
        getContactListings(team.id, params.id, db),
        getContactActivity(team.id, db),
      ]);
      return { contact, listings: contactListings, activity };
    });

    if (!result.contact) {
      throw error(404, 'Contact not found');
    }

    return {
      contact: result.contact,
      listings: result.listings,
      activity: result.activity,
    };
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) throw e;
    return { contact: null, listings: [], activity: [] };
  }
};

export const actions: Actions = {
  saveNote: async ({ request, locals, params }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const content = (formData.get('content') as string)?.trim();
    const teamId = formData.get('teamId') as string;
    const contactName = formData.get('contactName') as string;

    if (!content) return fail(400, { error: 'Note cannot be empty' });
    if (!teamId) return fail(400, { error: 'Team context missing' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Insert activity item as a note
        await db.insert(activityItems).values({
          id: nanoid(),
          teamId,
          type: 'note',
          authorName: contactName ?? 'Agent',
          content,
          timestamp: new Date(),
        });

        // Update the contact's notes and last interaction
        await db
          .update(contacts)
          .set({
            notes: content,
            lastInteraction: `Note: ${content.slice(0, 100)}`,
            lastInteractionDate: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(contacts.id, params.id), eq(contacts.teamId, teamId)));
      });
      return { success: true };
    } catch (e) {
      console.error('Save note error:', e);
      return fail(500, { error: 'Failed to save note' });
    }
  },

  logInteraction: async ({ request, locals, params }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const type = (formData.get('type') as string) || 'message';
    const content = (formData.get('content') as string)?.trim();
    const teamId = formData.get('teamId') as string;
    const authorName = formData.get('authorName') as string;

    if (!content) return fail(400, { error: 'Content is required' });
    if (!teamId) return fail(400, { error: 'Team context missing' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(activityItems).values({
          id: nanoid(),
          teamId,
          type: type as 'message' | 'email' | 'note' | 'voice_memo' | 'system' | 'ai_insight' | 'phase_change' | 'task_complete',
          authorName: authorName ?? 'Agent',
          content,
          timestamp: new Date(),
        });

        // Update contact's last interaction
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
        await db
          .update(contacts)
          .set({
            lastInteraction: `${typeLabel}: ${content.slice(0, 100)}`,
            lastInteractionDate: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(contacts.id, params.id), eq(contacts.teamId, teamId)));
      });
      return { success: true };
    } catch (e) {
      console.error('Log interaction error:', e);
      return fail(500, { error: 'Failed to log interaction' });
    }
  },
};
