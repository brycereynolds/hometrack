import type { PageServerLoad, Actions } from './$types';
import { getContactById, getContactListings, getContactActivity, getBuyerPreferences } from '$lib/server/db/queries/contacts.js';
import { withRLS } from '$lib/server/db/index.js';
import { contacts, activityItems, buyerPreferences } from '$lib/server/db/schema/index.js';
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
      const [contact, contactListings, activity, prefs] = await Promise.all([
        getContactById(team.id, params.id, db),
        getContactListings(team.id, params.id, db),
        getContactActivity(team.id, db),
        getBuyerPreferences(params.id, db),
      ]);
      return { contact, listings: contactListings, activity, buyerPreferences: prefs };
    });

    if (!result.contact) {
      throw error(404, 'Contact not found');
    }

    return {
      contact: result.contact,
      listings: result.listings,
      activity: result.activity,
      buyerPreferences: result.buyerPreferences ?? null,
    };
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) throw e;
    return { contact: null, listings: [], activity: [], buyerPreferences: null };
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

  saveBuyerPreferences: async ({ request, locals, params }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const existingId = (formData.get('existingId') as string) || '';

    const preferredAreasRaw = (formData.get('preferredAreas') as string)?.trim() ?? '';
    const preferredAreas = preferredAreasRaw
      ? preferredAreasRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const propertyTypeKeys = ['single_family', 'condo', 'townhome', 'multi_family', 'land', 'other'];
    const preferredPropertyTypes = propertyTypeKeys.filter((k) => formData.get(`propertyType_${k}`) === 'on');

    const parseNum = (key: string) => {
      const v = (formData.get(key) as string)?.trim();
      if (!v) return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    const values = {
      contactId: params.id,
      lookingForType: (formData.get('lookingForType') as string) || 'buy',
      isActive: true,
      preferredBedsMin: parseNum('bedsMin'),
      preferredBedsMax: parseNum('bedsMax'),
      preferredBathsMin: parseNum('bathsMin'),
      preferredBathsMax: null,
      preferredSqftMin: parseNum('sqftMin'),
      preferredSqftMax: parseNum('sqftMax'),
      preferredPriceMin: parseNum('priceMin'),
      preferredPriceMax: parseNum('priceMax'),
      preferredAreas: preferredAreas.length > 0 ? preferredAreas : null,
      preferredPropertyTypes: preferredPropertyTypes.length > 0 ? preferredPropertyTypes : null,
      preferredFeatures: null,
      notes: (formData.get('notes') as string)?.trim() || null,
      updatedAt: new Date(),
    };

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        if (existingId) {
          // Update existing
          await db
            .update(buyerPreferences)
            .set(values)
            .where(eq(buyerPreferences.id, existingId));
        } else {
          // Insert new
          await db.insert(buyerPreferences).values({
            id: nanoid(),
            ...values,
          });
        }
      });
      return { success: true };
    } catch (e) {
      console.error('Save buyer preferences error:', e);
      return fail(500, { error: 'Failed to save buyer preferences' });
    }
  },
};
