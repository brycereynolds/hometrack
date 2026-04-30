import type { Actions } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { teams } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase.js';

const BRANDING_BUCKET = 'documents';

export const actions: Actions = {
  save: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const teamId = formData.get('teamId') as string;
    const primaryColor = (formData.get('primaryColor') as string)?.trim() || '#C4704B';
    const customDomain = (formData.get('customDomain') as string)?.trim() || '';
    const welcomeMessage = (formData.get('welcomeMessage') as string)?.trim() || '';
    const logoUrl = (formData.get('logoUrl') as string)?.trim() || '';

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
              branding: { primaryColor, customDomain, welcomeMessage, logoUrl },
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

  uploadLogo: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const teamId = formData.get('teamId') as string;
    const file = formData.get('logo') as File;

    if (!teamId) return fail(400, { error: 'Team context missing' });
    if (!file || file.size === 0) return fail(400, { error: 'No file provided' });

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) return fail(400, { error: 'File too large. Max 2MB.' });

    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      return fail(400, { error: 'Only PNG, JPG, and SVG files are allowed.' });
    }

    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const storagePath = `${teamId}/branding/logo.${ext}`;
      const buffer = new Uint8Array(await file.arrayBuffer());

      const supabase = getSupabaseAdmin();

      // Upload with upsert to replace existing logo
      const { data, error } = await supabase.storage
        .from(BRANDING_BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) throw new Error(`Storage upload failed: ${error.message}`);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BRANDING_BUCKET)
        .getPublicUrl(storagePath);

      const logoUrl = urlData.publicUrl;

      // Save logoUrl to team branding settings
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        const team = await db.query.teams.findFirst({
          where: eq(teams.id, teamId),
        });

        const existingSettings = (team?.settings as Record<string, unknown>) ?? {};
        const existingBranding = (existingSettings.branding as Record<string, unknown>) ?? {};

        await db
          .update(teams)
          .set({
            settings: {
              ...existingSettings,
              branding: { ...existingBranding, logoUrl },
            },
            updatedAt: new Date(),
          })
          .where(eq(teams.id, teamId));
      });

      return { success: true, logoUrl };
    } catch (e) {
      console.error('Logo upload error:', e);
      return fail(500, { error: 'Failed to upload logo' });
    }
  },
};
