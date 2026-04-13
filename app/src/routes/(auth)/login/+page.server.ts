import { fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const supabaseUrl = env.SUPABASE_URL ?? '';
		const supabaseAnonKey = env.SUPABASE_ANON_KEY ?? '';

		if (!supabaseUrl || !supabaseAnonKey) {
			return fail(500, { error: 'Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env', email });
		}

		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});

		const { data, error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(400, { error: error.message, email });
		}

		cookies.set('sb-access-token', data.session.access_token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: data.session.expires_in,
		});

		cookies.set('sb-refresh-token', data.session.refresh_token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});

		throw redirect(303, '/');
	},
};
