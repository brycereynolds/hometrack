import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Extract access token from cookie or Authorization header
	const accessToken =
		event.cookies.get('sb-access-token') ??
		event.request.headers.get('Authorization')?.replace('Bearer ', '');

	const refreshToken = event.cookies.get('sb-refresh-token');

	const supabaseUrl = env.SUPABASE_URL ?? '';
	const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? '';

	if (supabaseUrl && supabaseServiceKey) {
		try {
			const supabase = createClient(supabaseUrl, supabaseServiceKey, {
				auth: { autoRefreshToken: false, persistSession: false }
			});

			let user = null;

			// Try verifying the access token first
			if (accessToken) {
				const { data, error } = await supabase.auth.getUser(accessToken);
				if (data.user && !error) {
					user = data.user;
					event.locals.accessToken = accessToken;
				}
			}

			// If access token is missing or invalid, attempt refresh
			if (!user && refreshToken) {
				const { data: refreshData, error: refreshError } =
					await supabase.auth.refreshSession({ refresh_token: refreshToken });

				if (refreshData.session && !refreshError) {
					user = refreshData.session.user;
					event.locals.accessToken = refreshData.session.access_token;

					// Set refreshed tokens as cookies
					const isSecure = env.NODE_ENV === 'production';
					const baseCookieOpts = {
						path: '/',
						httpOnly: true,
						secure: isSecure,
						sameSite: 'lax' as const,
					};

					event.cookies.set('sb-access-token', refreshData.session.access_token, {
						...baseCookieOpts,
						maxAge: 60 * 60 * 24 * 7 // 7 days
					});
					event.cookies.set('sb-refresh-token', refreshData.session.refresh_token, {
						...baseCookieOpts,
						maxAge: 60 * 60 * 24 * 30 // 30 days
					});
				}
			}

			if (user) {
				event.locals.user = {
					id: user.id,
					email: user.email!,
					role: user.role ?? 'authenticated'
				};
			}
		} catch {
			// Invalid token — continue without auth context
		}
	}

	return resolve(event);
};
