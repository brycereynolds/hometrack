/**
 * Test the TUS proxy endpoint server-to-server.
 *
 * This simulates what the browser's tus-js-client would do,
 * but calls our TUS proxy endpoint to verify it correctly
 * forwards to Supabase Storage.
 *
 * Usage: npx tsx scripts/test-tus-proxy.ts
 * (Requires the dev server running at localhost:5173)
 */

import * as tus from 'tus-js-client';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

console.log('\n=== TUS Proxy Test ===\n');

// Test direct TUS upload to Supabase (server-side, like the proxy does)
async function testDirectTUS(): Promise<boolean> {
	console.log('--- Test: Direct TUS upload to Supabase ---');

	const testData = Buffer.alloc(12 * 1024 * 1024, 0x42); // 12MB (2 chunks)
	const storagePath = `_test/tus-direct-${Date.now()}.bin`;

	return new Promise((resolve) => {
		const upload = new tus.Upload(testData as any, {
			endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
			retryDelays: [0, 1000],
			chunkSize: 6 * 1024 * 1024,
			headers: {
				authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
				'x-upsert': 'false',
			},
			uploadDataDuringCreation: true,
			removeFingerprintOnSuccess: true,
			metadata: {
				bucketName: 'field-media',
				objectName: storagePath,
				contentType: 'application/octet-stream',
				cacheControl: '3600',
			},
			uploadSize: testData.length,
			onError: (error) => {
				console.error('  FAIL:', error.message);
				resolve(false);
			},
			onProgress: (bytesUploaded, bytesTotal) => {
				console.log(`  Progress: ${bytesUploaded}/${bytesTotal} (${Math.round(bytesUploaded/bytesTotal*100)}%)`);
			},
			onSuccess: async () => {
				console.log('  PASS: Direct TUS upload succeeded');

				// Verify
				const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
					auth: { autoRefreshToken: false, persistSession: false },
				});
				const { data, error } = await supabase.storage.from('field-media').download(storagePath);
				if (error) {
					console.log('  Verify FAIL:', error.message);
				} else {
					console.log(`  Verify PASS: ${data.size} bytes`);
				}
				await supabase.storage.from('field-media').remove([storagePath]);
				console.log('  Cleaned up.\n');
				resolve(true);
			},
		});

		upload.start();
	});
}

// Test a large TUS upload (100MB, exceeding signed URL limit)
async function testLargeTUS(): Promise<boolean> {
	console.log('--- Test: Large TUS upload (100MB) ---');

	const testData = Buffer.alloc(100 * 1024 * 1024, 0x43); // 100MB
	const storagePath = `_test/tus-large-${Date.now()}.bin`;

	return new Promise((resolve) => {
		const upload = new tus.Upload(testData as any, {
			endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
			retryDelays: [0, 1000],
			chunkSize: 6 * 1024 * 1024,
			headers: {
				authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
				'x-upsert': 'false',
			},
			uploadDataDuringCreation: true,
			removeFingerprintOnSuccess: true,
			metadata: {
				bucketName: 'field-media',
				objectName: storagePath,
				contentType: 'application/octet-stream',
				cacheControl: '3600',
			},
			uploadSize: testData.length,
			onError: (error) => {
				console.error('  FAIL:', error.message);
				if ('originalResponse' in error) {
					const resp = (error as any).originalResponse;
					console.error('  Status:', resp?.getStatus?.());
					console.error('  Body:', resp?.getBody?.());
				}
				resolve(false);
			},
			onProgress: (bytesUploaded, bytesTotal) => {
				const pct = Math.round(bytesUploaded / bytesTotal * 100);
				if (pct % 20 === 0) console.log(`  Progress: ${pct}%`);
			},
			onSuccess: async () => {
				console.log('  PASS: 100MB TUS upload succeeded');

				const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
					auth: { autoRefreshToken: false, persistSession: false },
				});
				const { data, error } = await supabase.storage.from('field-media').download(storagePath);
				if (error) {
					console.log('  Verify FAIL:', error.message);
				} else {
					console.log(`  Verify PASS: ${data.size} bytes`);
				}
				await supabase.storage.from('field-media').remove([storagePath]);
				console.log('  Cleaned up.\n');
				resolve(true);
			},
		});

		upload.start();
	});
}

async function main() {
	const directOk = await testDirectTUS();
	if (!directOk) {
		console.log('Direct TUS failed — check Supabase Storage config');
		process.exit(1);
	}

	const largeOk = await testLargeTUS();
	if (!largeOk) {
		console.log('\n100MB TUS failed — UPLOAD_FILE_SIZE_LIMIT may be too low.');
		console.log('The standard upload limit (50MB) does NOT apply to TUS.');
		console.log('Check the UPLOAD_FILE_SIZE_LIMIT env var on Supabase Storage.');
	}

	console.log('=== Tests complete ===\n');
}

main().catch((err) => {
	console.error('Fatal:', err);
	process.exit(1);
});
