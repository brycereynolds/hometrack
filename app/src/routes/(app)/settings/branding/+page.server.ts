import type { Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { teams } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  save: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const teamId = formData.get('teamId') as string;
    const primaryColor = (formData.get('primaryColor') as string)?.trim() || '#C4704B';
    const customDomain = (formData.get('customDomain') as string)?.trim() || '';
    const welcomeMessage = (formData.get('welcomeMessage') as string)?.trim() || '';

    if (!teamId) return fail(400, { error: 'Team context missing' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Fetch existing settings to merge
        const team = await db.query.teams.findFirst({
          where: eq(teams.id, teamId),
        });

        const existingSettings = (team?.settings as Record<string, unknown>) ?? {};

        await db
          .update(teams)
          .set({
            settings: {
              ...existingSettings,
              branding: { primaryColor, customDomain, welcomeMessage },
            },
            updatedAt: new Date(),
          })
          .where(eq(teams.id, teamId));
      });
      return { success: true };
    } catch (e) {
      console.error('Save branding error:', e);
      return fail(500, { error: 'Failed to save branding settings' });
    }
  },
};
