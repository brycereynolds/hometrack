import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
	return {
		launchMode: env.PUBLIC_LAUNCH_MODE ?? 'live'
	};
};
