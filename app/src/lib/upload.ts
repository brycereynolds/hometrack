import * as tus from 'tus-js-client';

export interface TUSUploadOptions {
	file: File;
	bucketName: string;
	storagePath: string;
	supabaseUrl: string;
	authToken: string;
	onProgress?: (percentage: number) => void;
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

/**
 * Start a resumable TUS upload to Supabase Storage.
 *
 * Uses the TUS protocol endpoint at /storage/v1/upload/resumable which
 * supports the higher UPLOAD_FILE_SIZE_LIMIT (up to 10GB) instead of
 * the standard 50MB limit on signed URL PUT uploads.
 *
 * Automatically resumes interrupted uploads when possible.
 */
export function startTUSUpload(options: TUSUploadOptions): tus.Upload {
	const { file, bucketName, storagePath, supabaseUrl, authToken, onProgress, onSuccess, onError } =
		options;

	const upload = new tus.Upload(file, {
		endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
		retryDelays: [0, 1000, 3000, 5000, 10000],
		chunkSize: 6 * 1024 * 1024, // 6MB chunks
		headers: {
			authorization: `Bearer ${authToken}`,
			'x-upsert': 'false',
		},
		uploadDataDuringCreation: true,
		removeFingerprintOnSuccess: true,
		metadata: {
			bucketName,
			objectName: storagePath,
			contentType: file.type,
			cacheControl: '3600',
		},
		onError: (error) => {
			console.error('[TUS] Upload failed:', error);
			onError?.(error instanceof Error ? error : new Error(String(error)));
		},
		onProgress: (bytesUploaded, bytesTotal) => {
			const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
			onProgress?.(percentage);
		},
		onSuccess: () => {
			console.log('[TUS] Upload complete:', storagePath);
			onSuccess?.();
		},
	});

	// Check for previous uploads to resume
	upload.findPreviousUploads().then((previousUploads) => {
		if (previousUploads.length > 0) {
			console.log('[TUS] Resuming previous upload');
			upload.resumeFromPreviousUpload(previousUploads[0]);
		}
		upload.start();
	});

	return upload;
}
