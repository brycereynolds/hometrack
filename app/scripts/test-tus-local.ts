/**
 * Test TUS uploads through the local SvelteKit proxy.
 *
 * Simulates what the browser's tus-js-client does:
 * 1. POST /api/field-media/init — get storage path
 * 2. POST /api/field-media/tus — TUS creation with Upload-Length header
 * 3. PATCH /api/field-media/tus/<id> — send chunks
 *
 * Usage: npx tsx scripts/test-tus-local.ts
 * Requires dev server running at localhost:5173
 */

import 'dotenv/config';

const DEV_SERVER = process.env.DEV_SERVER_URL || 'http://localhost:5173';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SEED_EMAIL = process.env.SEED_USER_EMAIL!;
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getAuthToken(): Promise<string> {
	console.log('Getting auth token...');
	const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
		method: 'POST',
		headers: {
			'apikey': SUPABASE_ANON_KEY,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email: SEED_EMAIL, password: SEED_PASSWORD }),
	});
	if (!res.ok) {
		throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
	}
	const data = await res.json();
	console.log('  Got token, expires in', data.expires_in, 'seconds');
	return data.access_token;
}

function base64Encode(str: string): string {
	return Buffer.from(str).toString('base64');
}

// ---- Test 1: Check what Supabase Storage reports as its max size ----
async function testStorageMaxSize() {
	console.log('\n--- Test: Supabase Storage TUS-Max-Size ---');
	const res = await fetch(`${SUPABASE_URL}/storage/v1/upload/resumable`, {
		method: 'OPTIONS',
		headers: { 'Tus-Resumable': '1.0.0' },
	});
	const tusMaxSize = res.headers.get('tus-max-size');
	const tusVersion = res.headers.get('tus-version');
	const tusExtension = res.headers.get('tus-extension');
	console.log(`  tus-max-size: ${tusMaxSize} (${Math.round(Number(tusMaxSize) / 1024 / 1024)}MB)`);
	console.log(`  tus-version: ${tusVersion}`);
	console.log(`  tus-extension: ${tusExtension}`);
	return Number(tusMaxSize);
}

// ---- Test 2: Direct TUS creation to Supabase at various sizes ----
async function testDirectTUSCreation(sizeBytes: number, label: string): Promise<boolean> {
	console.log(`\n--- Test: Direct TUS creation (${label}, ${sizeBytes} bytes) ---`);
	const storagePath = `_test/direct-${Date.now()}.bin`;
	const metadata = [
		`bucketName ${base64Encode('field-media')}`,
		`objectName ${base64Encode(storagePath)}`,
		`contentType ${base64Encode('application/octet-stream')}`,
		`cacheControl ${base64Encode('3600')}`,
	].join(',');

	const res = await fetch(`${SUPABASE_URL}/storage/v1/upload/resumable`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
			'Tus-Resumable': '1.0.0',
			'Upload-Length': String(sizeBytes),
			'Upload-Metadata': metadata,
		},
	});

	const body = await res.text();
	console.log(`  Status: ${res.status}`);
	if (!res.ok) {
		console.log(`  Body: ${body}`);
	} else {
		console.log(`  Location: ${res.headers.get('location')}`);
	}
	return res.ok;
}

// ---- Test 3: TUS creation through our proxy ----
async function testProxyTUSCreation(token: string, sizeBytes: number, label: string): Promise<string | null> {
	console.log(`\n--- Test: Proxy TUS creation (${label}, ${sizeBytes} bytes) ---`);
	const storagePath = `_test/proxy-${Date.now()}.bin`;
	const metadata = [
		`bucketName ${base64Encode('field-media')}`,
		`objectName ${base64Encode(storagePath)}`,
		`contentType ${base64Encode('application/octet-stream')}`,
		`cacheControl ${base64Encode('3600')}`,
	].join(',');

	console.log(`  POST ${DEV_SERVER}/api/field-media/tus`);
	console.log(`  Upload-Length: ${sizeBytes}`);
	console.log(`  Upload-Metadata: ${metadata}`);

	const res = await fetch(`${DEV_SERVER}/api/field-media/tus`, {
		method: 'POST',
		headers: {
			'Tus-Resumable': '1.0.0',
			'Upload-Length': String(sizeBytes),
			'Upload-Metadata': metadata,
			'Cookie': `sb-access-token=${token}`,
		},
	});

	const body = await res.text();
	console.log(`  Response status: ${res.status}`);
	console.log(`  Response body: ${body || '(empty)'}`);

	// Log all response headers
	const headers: Record<string, string> = {};
	res.headers.forEach((v, k) => { headers[k] = v; });
	console.log(`  Response headers:`, JSON.stringify(headers, null, 4));

	if (res.ok) {
		const location = res.headers.get('location');
		console.log(`  Location: ${location}`);
		return location;
	}
	return null;
}

// ---- Test 4: Full TUS upload through proxy (creation + chunks) ----
async function testFullProxyUpload(token: string, sizeBytes: number, chunkSize: number): Promise<boolean> {
	console.log(`\n--- Test: Full proxy upload (${Math.round(sizeBytes / 1024 / 1024)}MB, ${Math.round(chunkSize / 1024 / 1024)}MB chunks) ---`);

	// Step 1: init
	console.log('  Step 1: Init...');
	const initRes = await fetch(`${DEV_SERVER}/api/field-media/init`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Cookie': `sb-access-token=${token}`,
		},
		body: JSON.stringify({
			fileName: 'test-video.mp4',
			listingId: null,
			contentType: 'video/mp4',
		}),
	});

	if (!initRes.ok) {
		const err = await initRes.text();
		console.error(`  Init failed: ${initRes.status} ${err}`);
		return false;
	}

	const initData = await initRes.json();
	console.log(`  Init OK: storagePath=${initData.storagePath}, bucket=${initData.bucketName}`);

	// Step 2: TUS creation POST
	console.log('  Step 2: TUS creation...');
	const metadata = [
		`bucketName ${base64Encode(initData.bucketName)}`,
		`objectName ${base64Encode(initData.storagePath)}`,
		`contentType ${base64Encode('video/mp4')}`,
		`cacheControl ${base64Encode('3600')}`,
	].join(',');

	// With uploadDataDuringCreation, tus-js-client sends first chunk in POST body
	const firstChunk = Buffer.alloc(Math.min(chunkSize, sizeBytes), 0x42);

	const createRes = await fetch(`${DEV_SERVER}/api/field-media/tus`, {
		method: 'POST',
		headers: {
			'Tus-Resumable': '1.0.0',
			'Upload-Length': String(sizeBytes),
			'Upload-Metadata': metadata,
			'Content-Type': 'application/offset+octet-stream',
			'Content-Length': String(firstChunk.length),
			'Upload-Offset': '0',
			'Cookie': `sb-access-token=${token}`,
		},
		body: firstChunk,
	});

	const createBody = await createRes.text();
	console.log(`  TUS creation: ${createRes.status}`);
	if (createBody) console.log(`  Body: ${createBody}`);

	if (!createRes.ok) {
		console.error(`  TUS creation failed!`);
		// Log all headers for debugging
		const headers: Record<string, string> = {};
		createRes.headers.forEach((v, k) => { headers[k] = v; });
		console.log(`  Response headers:`, JSON.stringify(headers, null, 4));
		return false;
	}

	const location = createRes.headers.get('location');
	const uploadOffset = Number(createRes.headers.get('upload-offset') || '0');
	console.log(`  Location: ${location}`);
	console.log(`  Upload-Offset after creation: ${uploadOffset}`);

	if (!location) {
		console.error('  No Location header returned!');
		return false;
	}

	// Step 3: Send remaining chunks via PATCH
	let offset = uploadOffset || firstChunk.length;
	let chunkNum = 1;

	while (offset < sizeBytes) {
		const remaining = sizeBytes - offset;
		const thisChunkSize = Math.min(chunkSize, remaining);
		const chunk = Buffer.alloc(thisChunkSize, 0x42);
		chunkNum++;

		console.log(`  Step 3: PATCH chunk ${chunkNum} (offset=${offset}, size=${thisChunkSize})...`);

		const patchRes = await fetch(`${DEV_SERVER}${location}`, {
			method: 'PATCH',
			headers: {
				'Tus-Resumable': '1.0.0',
				'Upload-Offset': String(offset),
				'Content-Type': 'application/offset+octet-stream',
				'Content-Length': String(thisChunkSize),
				'Cookie': `sb-access-token=${token}`,
			},
			body: chunk,
		});

		if (!patchRes.ok) {
			const errText = await patchRes.text();
			console.error(`  PATCH failed: ${patchRes.status} ${errText}`);
			return false;
		}

		const newOffset = Number(patchRes.headers.get('upload-offset') || '0');
		console.log(`  PATCH OK: new offset=${newOffset}`);
		offset = newOffset || (offset + thisChunkSize);
	}

	console.log(`  Upload complete! Total: ${offset} bytes`);
	return true;
}

async function main() {
	console.log('=== TUS Local Proxy Test ===');
	console.log(`Dev server: ${DEV_SERVER}`);
	console.log(`Supabase URL: ${SUPABASE_URL}`);

	// Check dev server is running
	try {
		const ping = await fetch(`${DEV_SERVER}/api/field-media/tus`, { method: 'OPTIONS' });
		console.log(`Dev server reachable: ${ping.status}`);
	} catch (err) {
		console.error(`Dev server not reachable at ${DEV_SERVER}. Start it first!`);
		process.exit(1);
	}

	// Test 1: What does Storage say its max is?
	const maxSize = await testStorageMaxSize();

	// Test 2: Direct TUS creation at boundary sizes
	const test10MB = await testDirectTUSCreation(10 * 1024 * 1024, '10MB');
	const test500MB = await testDirectTUSCreation(500 * 1024 * 1024, '500MB');
	const test943MB = await testDirectTUSCreation(943 * 1000 * 1000, '943MB (user file)');

	// Test 3: Through proxy
	const token = await getAuthToken();

	const proxy10MB = await testProxyTUSCreation(token, 10 * 1024 * 1024, '10MB');
	const proxy943MB = await testProxyTUSCreation(token, 943 * 1000 * 1000, '943MB');

	// Test 4: Full upload with small file (12MB = 2 chunks)
	if (proxy10MB) {
		console.log('\n--- Proxy accepts 10MB, testing full upload ---');
		const fullOk = await testFullProxyUpload(token, 12 * 1024 * 1024, 6 * 1024 * 1024);
		if (fullOk) {
			console.log('\n  PASS: Full TUS upload through proxy works for small files!');
		}
	}

	// Summary
	console.log('\n\n=== Summary ===');
	console.log(`Supabase Storage tus-max-size: ${maxSize} bytes (${Math.round(maxSize / 1024 / 1024)}MB)`);
	console.log(`Direct 10MB:  ${test10MB ? 'PASS' : 'FAIL'}`);
	console.log(`Direct 500MB: ${test500MB ? 'PASS' : 'FAIL'}`);
	console.log(`Direct 943MB: ${test943MB ? 'PASS' : 'FAIL'}`);
	console.log(`Proxy 10MB:   ${proxy10MB ? 'PASS' : 'FAIL'}`);
	console.log(`Proxy 943MB:  ${proxy943MB ? 'PASS' : 'FAIL'}`);

	if (!test943MB) {
		console.log('\n=== Root Cause ===');
		console.log(`Supabase Storage rejects files > ${Math.round(maxSize / 1024 / 1024)}MB.`);
		console.log('UPLOAD_FILE_SIZE_LIMIT env var is not taking effect.');
		console.log('The Storage service needs to be restarted on Railway,');
		console.log('or the env var name may need to be FILE_SIZE_LIMIT instead.');
	}

	console.log('\n=== Done ===');
}

main().catch((err) => {
	console.error('Fatal:', err);
	process.exit(1);
});
