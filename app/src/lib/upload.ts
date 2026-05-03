import * as tus from 'tus-js-client';

export interface UploadOptions {
	file: File;
	listingId: string | null;
	noteId: string | null;
	onProgress?: (percentage: number) => void;
	onSuccess?: (result: UploadResult) => void;
	onError?: (error: Error) => void;
}

export interface UploadResult {
	storagePath: string;
}

interface UploadInitResponse {
	storagePath: string;
	bucketName: string;
	teamId: string;
	memberId: string;
	memberName: string;
}

/**
 * Upload a file via TUS resumable protocol, proxied through our SvelteKit server.
 *
 * Flow:
 * 1. Call /api/field-media/init to get storage path + team info
 * 2. tus-js-client uploads in 6MB chunks to /api/field-media/tus (our proxy)
 * 3. Our proxy forwards each chunk to Supabase Storage's TUS endpoint
 * 4. On success, call /api/field-media/complete to create DB records
 *
 * Benefits:
 * - Service role key stays on the server
 * - No CORS issues (browser talks to same origin)
 * - Resumable: survives network interruptions
 * - Chunked: 6MB per request, no memory pressure
 * - No file size limit (up to Supabase Storage's configured max)
 */
export async function startUpload(options: UploadOptions): Promise<tus.Upload> {
	const { file, listingId, noteId, onProgress, onSuccess, onError } = options;

	// Step 1: Get storage path and team info from server
	let initData: UploadInitResponse;
	try {
		const res = await fetch('/api/field-media/init', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				fileName: file.name,
				listingId: listingId || null,
				contentType: file.type,
			}),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: 'Failed to initialize upload' }));
			throw new Error(err.error ?? `Init failed (${res.status})`);
		}

		initData = await res.json();
	} catch (err) {
		const error = err instanceof Error ? err : new Error('Failed to initialize upload');
		onError?.(error);
		// Return a dummy upload object so the caller has something
		return new tus.Upload(file, {});
	}

	const { storagePath, bucketName, teamId, memberId, memberName } = initData;

	// Step 2: Start TUS upload through our proxy
	const upload = new tus.Upload(file, {
		endpoint: '/api/field-media/tus',
		retryDelays: [0, 3000, 5000, 10000, 20000],
		chunkSize: 6 * 1024 * 1024, // 6MB chunks
		uploadDataDuringCreation: true,
		removeFingerprintOnSuccess: true,
		metadata: {
			bucketName,
			objectName: storagePath,
			contentType: file.type,
			cacheControl: '3600',
		},
		onError: (error) => {
			console.error('[Upload] TUS error:', error);
			onError?.(error instanceof Error ? error : new Error(String(error)));
		},
		onProgress: (bytesUploaded, bytesTotal) => {
			const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
			onProgress?.(percentage);
		},
		onSuccess: async () => {
			console.log('[Upload] TUS complete:', storagePath);

			// Step 3: Create DB records
			try {
				const completeRes = await fetch('/api/field-media/complete', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						noteId,
						storagePath,
						listingId: listingId || null,
						fileName: file.name,
						fileSize: file.size,
						contentType: file.type,
						teamId,
						memberId,
						memberName,
					}),
				});

				if (!completeRes.ok) {
					const errBody = await completeRes.json().catch(() => ({}));
					throw new Error(errBody.error || `Failed to finalize (${completeRes.status})`);
				}

				onSuccess?.({ storagePath });
			} catch (err) {
				console.error('[Upload] Complete failed:', err);
				onError?.(err instanceof Error ? err : new Error('Failed to save record'));
			}
		},
	});

	// Check for previous uploads to resume
	const previousUploads = await upload.findPreviousUploads();
	if (previousUploads.length > 0) {
		console.log('[Upload] Resuming previous upload');
		upload.resumeFromPreviousUpload(previousUploads[0]);
	}

	upload.start();
	return upload;
}
