import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

function getEnv() {
	return {
		supabaseUrl: env.SUPABASE_URL ?? '',
		serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
		anonKey: env.SUPABASE_ANON_KEY ?? '',
	};
}

/**
 * Server-side Supabase client using the service_role key.
 * Bypasses RLS — use for admin operations (e.g., storage management, user creation).
 * NEVER expose this client or its key to the browser.
 */
export function getSupabaseAdmin() {
	const { supabaseUrl, serviceRoleKey } = getEnv();
	return createClient(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

/**
 * Create a Supabase client scoped to a user's JWT.
 * RLS policies apply — use in request handlers where user context is available.
 */
export function createSupabaseClient(accessToken: string) {
	const { supabaseUrl, anonKey } = getEnv();
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
 * Get Supabase config for client-side initialization.
 */
export function getSupabaseConfig() {
	const { supabaseUrl, anonKey } = getEnv();
	return { supabaseUrl, anonKey };
}
