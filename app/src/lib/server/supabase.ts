import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

/**
 * Server-side Supabase client using the service_role key.
 * Bypasses RLS — use for admin operations (e.g., storage management, user creation).
 * NEVER expose this client or its key to the browser.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

/**
 * Create a Supabase client scoped to a user's JWT.
 * RLS policies apply — use in request handlers where user context is available.
 */
export function createSupabaseClient(accessToken: string) {
	return createClient(supabaseUrl, anonKey, {
		global: {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

/**
 * Anon key for client-side initialization (auth flows, public queries).
 * Safe to expose to the browser.
 */
export { supabaseUrl, anonKey };
