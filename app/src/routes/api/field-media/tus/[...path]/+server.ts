import { json, error as httpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { teamMembers } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const SUPABASE_TUS = () => `${env.SUPABASE_URL}/storage/v1/upload/resumable`;
const OUR_TUS_BASE = '/api/field-media/tus';

/**
 * TUS protocol proxy for resumable uploads.
 *
 * Routes:
 *   POST   /api/field-media/tus         — Create upload session
 *   PATCH  /api/field-media/tus/<id>    — Upload chunk
 *   HEAD   /api/field-media/tus/<id>    — Check offset (resume)
 *   OPTIONS /api/field-media/tus/...    — TUS capability discovery
 *
 * Each chunk is ~6MB — no memory pressure on Node.
 */

async function requireAuth(locals: App.Locals) {
	if (!locals.user) throw httpError(401, 'Unauthorized');

	return withRLS(locals.user.id, 'authenticated', async (db) => {
		const member = await db.query.teamMembers.findFirst({
			where: eq(teamMembers.userId, locals.user!.id),
		});
		if (!member) throw httpError(403, 'Team member not found');
		return member;
	});
}

/** TUS headers to forward from browser request to Supabase */
const FORWARD_HEADERS = [
	'content-type',
	'upload-length',
	'upload-offset',
	'upload-metadata',
	'tus-resumable',
	'upload-concat',
	'upload-defer-length',
	'content-length',
	'x-upsert',
];

/** TUS headers to forward from Supabase response to browser */
const RESPONSE_HEADERS = [
	'tus-resumable',
	'tus-version',
	'tus-extension',
	'tus-max-size',
	'upload-offset',
	'upload-length',
	'upload-expires',
];

function proxyHeaders(request: Request): Record<string, string> {
	const h: Record<string, string> = {
		authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
	};
	for (const name of FORWARD_HEADERS) {
		const v = request.headers.get(name);
		if (v !== null) h[name] = v;
	}
	return h;
}

function proxyResponse(supaRes: Response, status: number, body: BodyInit | null = null): Response {
	const headers = new Headers();

	for (const name of RESPONSE_HEADERS) {
		const v = supaRes.headers.get(name);
		if (v !== null) headers.set(name, v);
	}

	// Rewrite Location: Supabase returns /storage/v1/upload/resumable/<id>
	// We rewrite to /api/field-media/tus/<id>
	const location = supaRes.headers.get('location');
	if (location) {
		const parts = location.split('/');
		const uploadId = parts[parts.length - 1];
		headers.set('location', `${OUR_TUS_BASE}/${uploadId}`);
	}

	return new Response(body, { status, headers });
}

/**
 * POST — Create a new TUS upload session (or upload-with-creation).
 * tus-js-client sends POST to the endpoint URL.
 */
export const POST: RequestHandler = async ({ locals, request, params }) => {
	await requireAuth(locals);

	const uploadId = params.path || '';
	const targetUrl = uploadId
		? `${SUPABASE_TUS()}/${uploadId}`
		: SUPABASE_TUS();

	const outHeaders = proxyHeaders(request);
	console.log('[TUS] POST →', targetUrl);
	console.log('[TUS] POST outgoing headers:', JSON.stringify(outHeaders, null, 2));

	try {
		const supaRes = await fetch(targetUrl, {
			method: 'POST',
			headers: outHeaders,
			body: request.body,
			// @ts-expect-error Node fetch duplex for streaming
			duplex: 'half',
		});

		const responseHeaders: Record<string, string> = {};
		supaRes.headers.forEach((v, k) => { responseHeaders[k] = v; });
		console.log('[TUS] POST response status:', supaRes.status);
		console.log('[TUS] POST response headers:', JSON.stringify(responseHeaders, null, 2));

		if (!supaRes.ok) {
			const errText = await supaRes.text();
			console.error('[TUS] POST failed body:', errText);
			if (supaRes.status === 413) {
				const uploadLength = outHeaders['upload-length'];
				console.error(`[TUS] 413 rejected — Upload-Length: ${uploadLength} bytes (${Math.round(Number(uploadLength) / 1024 / 1024)}MB). Supabase Storage tus-max-size may be too low. Restart Storage service or check UPLOAD_FILE_SIZE_LIMIT env var.`);
			}
			return json({ error: errText }, { status: supaRes.status });
		}

		const responseBody = await supaRes.text();
		return proxyResponse(supaRes, supaRes.status, responseBody || null);
	} catch (err) {
		console.error('[TUS] POST error:', err);
		return json({ error: 'TUS proxy error' }, { status: 502 });
	}
};

/**
 * PATCH — Upload a chunk of data to an existing upload session.
 * tus-js-client sends PATCH to the Location URL returned by POST.
 */
export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	await requireAuth(locals);

	const uploadId = params.path;
	if (!uploadId) {
		return json({ error: 'Missing upload ID' }, { status: 400 });
	}

	const patchUrl = `${SUPABASE_TUS()}/${uploadId}`;
	const patchHeaders = proxyHeaders(request);
	console.log('[TUS] PATCH →', patchUrl);
	console.log('[TUS] PATCH headers:', JSON.stringify({
		'upload-offset': patchHeaders['upload-offset'],
		'content-length': patchHeaders['content-length'],
		'content-type': patchHeaders['content-type'],
	}));

	try {
		const supaRes = await fetch(patchUrl, {
			method: 'PATCH',
			headers: patchHeaders,
			body: request.body,
			// @ts-expect-error Node fetch duplex for streaming
			duplex: 'half',
		});

		console.log('[TUS] PATCH response:', supaRes.status, 'offset:', supaRes.headers.get('upload-offset'));

		if (!supaRes.ok) {
			const errText = await supaRes.text();
			console.error('[TUS] PATCH failed:', supaRes.status, errText);
			return json({ error: errText }, { status: supaRes.status });
		}

		return proxyResponse(supaRes, supaRes.status, null);
	} catch (err) {
		console.error('[TUS] PATCH error:', err);
		return json({ error: 'TUS proxy error' }, { status: 502 });
	}
};

/**
 * HEAD — Check upload offset for resume.
 */
export const HEAD: RequestHandler = async ({ locals, params }) => {
	await requireAuth(locals);

	const uploadId = params.path;
	if (!uploadId) {
		return new Response(null, { status: 400 });
	}

	const headUrl = `${SUPABASE_TUS()}/${uploadId}`;
	console.log('[TUS] HEAD →', headUrl);

	try {
		const supaRes = await fetch(headUrl, {
			method: 'HEAD',
			headers: {
				authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
				'tus-resumable': '1.0.0',
			},
		});

		console.log('[TUS] HEAD response:', supaRes.status, 'offset:', supaRes.headers.get('upload-offset'), 'length:', supaRes.headers.get('upload-length'));

		if (!supaRes.ok) {
			console.error('[TUS] HEAD failed:', supaRes.status);
			return new Response(null, { status: supaRes.status });
		}

		return proxyResponse(supaRes, 200, null);
	} catch (err) {
		console.error('[TUS] HEAD error:', err);
		return new Response(null, { status: 502 });
	}
};

/**
 * OPTIONS — TUS capability discovery.
 */
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'tus-resumable': '1.0.0',
			'tus-version': '1.0.0',
			'tus-extension': 'creation,creation-with-upload,termination,concatenation',
			'tus-max-size': '10737418240',
		},
	});
};
