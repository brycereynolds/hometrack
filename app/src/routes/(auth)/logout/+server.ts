import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('sb-access-token', { path: '/' });
	cookies.delete('sb-refresh-token', { path: '/' });
	throw redirect(303, '/login');
};
