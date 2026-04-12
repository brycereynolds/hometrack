import { createClient } from '@supabase/supabase-js';
import type { Handle } from '@sveltejs/kit';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const handle: Handle = async ({ event, resolve }) => {
	// Extract access token from cookie or Authorization header
	const accessToken =
		event.cookies.get('sb-access-token') ??
		event.request.headers.get('Authorization')?.replace('Bearer ', '');

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
