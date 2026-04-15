import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const key = url.searchParams.get('key');
	const expectedKey = env.PREVIEW_ACCESS_KEY ?? 'hometrack2026';

	if (!key) {
		return { valid: false, message: 'No access key provided.' };
	}

	if (key !== expectedKey) {
		return { valid: false, message: 'Invalid access key.' };
	}

	return { valid: true };
};
