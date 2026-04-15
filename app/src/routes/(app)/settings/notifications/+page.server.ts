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
    const prefsJson = formData.get('prefs') as string;
    const quietHoursEnabled = formData.get('quietHoursEnabled') === 'true';
    const quietStart = (formData.get('quietStart') as string) || '22:00';
    const quietEnd = (formData.get('quietEnd') as string) || '07:00';
    const digestFrequency = (formData.get('digestFrequency') as string) || 'realtime';

    if (!teamId) return fail(400, { error: 'Team context missing' });

    let prefs: unknown;
    try {
      prefs = prefsJson ? JSON.parse(prefsJson) : {};
    } catch {
      return fail(400, { error: 'Invalid notification preferences' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const team = await db.query.teams.findFirst({
          where: eq(teams.id, teamId),
        });

        const existingSettings = (team?.settings as Record<string, unknown>) ?? {};

        await db
          .update(teams)
          .set({
            settings: {
              ...existingSettings,
              notifications: {
                prefs,
                quietHours: { enabled: quietHoursEnabled, start: quietStart, end: quietEnd },
                digestFrequency,
              },
            },
            updatedAt: new Date(),
          })
          .where(eq(teams.id, teamId));
      });
      return { success: true };
    } catch (e) {
      console.error('Save notifications error:', e);
      return fail(500, { error: 'Failed to save notification preferences' });
    }
  },
};
