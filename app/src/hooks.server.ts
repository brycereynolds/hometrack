import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Extract access token from cookie or Authorization header
	const accessToken =
		event.cookies.get('sb-access-token') ??
		event.request.headers.get('Authorization')?.replace('Bearer ', '');

	const supabaseUrl = env.SUPABASE_URL ?? '';
	const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? '';

	if (accessToken && supabaseUrl && supabaseServiceKey) {
		try {
			const supabase = createClient(supabaseUrl, supabaseServiceKey, {
				auth: { autoRefreshToken: false, persistSession: false }
			});

			const {
				data: { user },
				error
			} = await supabase.auth.getUser(accessToken);

			if (user && !error) {
				event.locals.user = {
					id: user.id,
					email: user.email!,
					role: user.role ?? 'authenticated'
				};
				event.locals.accessToken = accessToken;
			}
		} catch {
			// Invalid token — continue without auth context
		}
	}

	return resolve(event);
};
