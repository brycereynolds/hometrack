/**
 * Test script for diagnosing file upload issues.
 *
 * Tests:
 * 1. List files in the field-media bucket (check if old uploads exist)
 * 2. Standard upload via Supabase JS client
 * 3. Verify the uploaded file exists
 * 4. TUS resumable upload
 * 5. Verify TUS-uploaded file exists
 *
 * Usage: npx tsx scripts/test-upload.ts
 * (Run from the app/ directory, or set env vars manually)
 */

import { createClient } from '@supabase/supabase-js';
import * as tus from 'tus-js-client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from app/.env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
	const envContent = fs.readFileSync(envPath, 'utf-8');
	for (const line of envContent.split('\n')) {
		const match = line.match(/^([A-Z_]+)=(.*)$/);
		if (match && !process.env[match[1]]) {
			process.env[match[1]] = match[2];
		}
	}
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'field-media';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

console.log(`\n=== Upload Test Script ===`);
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Bucket: ${BUCKET}\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { autoRefreshToken: false, persistSession: false },
});

// Create a small test file (a 1x1 PNG pixel)
const PNG_PIXEL = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
	'base64'
);

async function test1_listBucket() {
	console.log('--- Test 1: List files in bucket ---');
	try {
		// List root level
		const { data: rootFiles, error: rootError } = await supabase.storage
			.from(BUCKET)
			.list('', { limit: 20 });

		if (rootError) {
			console.error(`  FAIL: Could not list bucket root: ${rootError.message}`);
			return;
		}

		console.log(`  Root level items: ${rootFiles?.length ?? 0}`);
		for (const item of rootFiles ?? []) {
			const isFolder = item.id === null;
			console.log(`    ${isFolder ? '[DIR]' : '[FILE]'} ${item.name} ${item.metadata ? `(${JSON.stringify(item.metadata)})` : ''}`);

			// If it's a folder (teamId), list its contents
			if (isFolder) {
				const { data: subFiles, error: subError } = await supabase.storage
					.from(BUCKET)
					.list(item.name, { limit: 10 });

				if (!subError && subFiles) {
					for (const sub of subFiles) {
						const subIsFolder = sub.id === null;
						console.log(`      ${subIsFolder ? '[DIR]' : '[FILE]'} ${item.name}/${sub.name}`);

						if (subIsFolder) {
							const { data: deepFiles } = await supabase.storage
								.from(BUCKET)
								.list(`${item.name}/${sub.name}`, { limit: 5 });
							for (const deep of deepFiles ?? []) {
								console.log(`        [FILE] ${item.name}/${sub.name}/${deep.name} (${deep.metadata?.size ?? '?'} bytes)`);
							}
						}
					}
				}
			}
		}
		console.log('  PASS: Bucket listing succeeded\n');
	} catch (err) {
		console.error(`  FAIL: ${err}\n`);
	}
}

async function test2_standardUpload(): Promise<string | null> {
	console.log('--- Test 2: Standard upload via Supabase JS ---');
	const storagePath = `_test/standard-upload-${Date.now()}.png`;
	try {
		const { data, error } = await supabase.storage
			.from(BUCKET)
			.upload(storagePath, PNG_PIXEL, {
				contentType: 'image/png',
				upsert: false,
			});

		if (error) {
			console.error(`  FAIL: Upload error: ${error.message}`);
			return null;
		}

		console.log(`  PASS: Uploaded to ${data.path}`);
		return storagePath;
	} catch (err) {
		console.error(`  FAIL: ${err}\n`);
		return null;
	}
}

async function test3_verifyExists(storagePath: string | null) {
	console.log('--- Test 3: Verify standard upload exists ---');
	if (!storagePath) {
		console.log('  SKIP: No file to verify (previous upload failed)\n');
		return;
	}

	try {
		// Try downloading the file
		const { data, error } = await supabase.storage
			.from(BUCKET)
			.download(storagePath);

		if (error) {
			console.error(`  FAIL: Download error: ${error.message}`);
			return;
		}

		const size = data?.size ?? 0;
		console.log(`  PASS: File exists and is ${size} bytes\n`);
	} catch (err) {
		console.error(`  FAIL: ${err}\n`);
	}
}

async function test4_tusUpload(): Promise<string | null> {
	console.log('--- Test 4: TUS resumable upload ---');
	const storagePath = `_test/tus-upload-${Date.now()}.png`;

	return new Promise((resolve) => {
		try {
			const upload = new tus.Upload(Buffer.from(PNG_PIXEL) as any, {
				endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
				retryDelays: [0, 1000, 3000],
				headers: {
					authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
					'x-upsert': 'false',
				},
				uploadDataDuringCreation: true,
				removeFingerprintOnSuccess: true,
				metadata: {
					bucketName: BUCKET,
					objectName: storagePath,
					contentType: 'image/png',
					cacheControl: '3600',
				},
				uploadSize: PNG_PIXEL.length,
				onError: (error) => {
					console.error(`  FAIL: TUS error: ${error.message}`);
					// Try to extract more detail
					if ('originalResponse' in error) {
						const resp = (error as any).originalResponse;
						console.error(`  Response status: ${resp?.getStatus?.()}`);
						console.error(`  Response body: ${resp?.getBody?.()}`);
					}
					if ('originalRequest' in error) {
						const req = (error as any).originalRequest;
						console.error(`  Request URL: ${req?.getURL?.()}`);
						console.error(`  Request method: ${req?.getMethod?.()}`);
					}
					resolve(null);
				},
				onProgress: (bytesUploaded, bytesTotal) => {
					console.log(`  Progress: ${bytesUploaded}/${bytesTotal}`);
				},
				onSuccess: () => {
					console.log(`  PASS: TUS upload complete: ${storagePath}\n`);
					resolve(storagePath);
				},
			});

			// For Node.js tus-js-client, we need to use a readable stream or buffer
			// The library should handle Buffer directly
			upload.start();
		} catch (err) {
			console.error(`  FAIL: ${err}\n`);
			resolve(null);
		}
	});
}

async function test5_verifyTusUpload(storagePath: string | null) {
	console.log('--- Test 5: Verify TUS upload exists ---');
	if (!storagePath) {
		console.log('  SKIP: No TUS file to verify (previous upload failed)\n');
		return;
	}

	try {
		const { data, error } = await supabase.storage
			.from(BUCKET)
			.download(storagePath);

		if (error) {
			console.error(`  FAIL: Download error: ${error.message}`);
			return;
		}

		const size = data?.size ?? 0;
		console.log(`  PASS: TUS file exists and is ${size} bytes\n`);
	} catch (err) {
		console.error(`  FAIL: ${err}\n`);
	}
}

async function cleanup(paths: (string | null)[]) {
	console.log('--- Cleanup: Removing test files ---');
	const validPaths = paths.filter(Boolean) as string[];
	if (validPaths.length === 0) {
		console.log('  No files to clean up\n');
		return;
	}

	const { data, error } = await supabase.storage
		.from(BUCKET)
		.remove(validPaths);

	if (error) {
		console.error(`  Warning: Cleanup failed: ${error.message}`);
	} else {
		console.log(`  Cleaned up ${data?.length ?? 0} test files\n`);
	}
}

async function main() {
	await test1_listBucket();
	const stdPath = await test2_standardUpload();
	await test3_verifyExists(stdPath);
	const tusPath = await test4_tusUpload();
	await test5_verifyTusUpload(tusPath);
	await cleanup([stdPath, tusPath]);

	console.log('=== All tests complete ===\n');
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
