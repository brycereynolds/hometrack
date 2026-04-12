import { fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import type { Actions } from './$types';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const passwordConfirm = formData.get('password_confirm') as string;

		if (!email || !password || !passwordConfirm) {
			return fail(400, { error: 'All fields are required', email });
		}

		if (password !== passwordConfirm) {
			return fail(400, { error: 'Passwords do not match', email });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters', email });
		}

		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});

		const { data, error } = await supabase.auth.signUp({ email, password });

		if (error) {
			return fail(400, { error: error.message, email });
		}

		if (!data.session) {
			// Email confirmation required
			return { success: true, email, message: 'Check your email to confirm your account.' };
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
