import { supabaseAdmin } from './supabase.js';

const BUCKET = 'documents';

/**
 * Build a storage path following the multi-tenant convention:
 *   {teamId}/{listingId}/{filename}
 * or {teamId}/general/{filename} when no listing is associated.
 */
export function buildStoragePath(teamId: string, filename: string, listingId?: string): string {
	const segment = listingId ?? 'general';
	return `${teamId}/${segment}/${filename}`;
}

/** Upload a file buffer to Supabase Storage. */
export async function uploadFile(
	path: string,
	buffer: Buffer | Uint8Array,
	contentType: string,
): Promise<{ path: string }> {
	const { data, error } = await supabaseAdmin.storage
		.from(BUCKET)
		.upload(path, buffer, {
			contentType,
			upsert: false,
		});

	if (error) throw new Error(`Storage upload failed: ${error.message}`);
	return { path: data.path };
}

/** Generate a signed download URL (default 1 hour). */
export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
	const { data, error } = await supabaseAdmin.storage
		.from(BUCKET)
		.createSignedUrl(path, expiresIn);

	if (error) throw new Error(`Signed URL failed: ${error.message}`);
	return data.signedUrl;
}

/** Delete a single file from Supabase Storage. */
export async function deleteFile(path: string): Promise<void> {
	const { error } = await supabaseAdmin.storage
		.from(BUCKET)
		.remove([path]);

	if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

/** List files under a path prefix (e.g. a team or listing folder). */
export async function listFiles(prefix: string): Promise<{ name: string; size: number; createdAt: string }[]> {
	// Supabase Storage list requires the folder path and optional search
	const parts = prefix.split('/');
	const folder = parts.join('/');

	const { data, error } = await supabaseAdmin.storage
		.from(BUCKET)
		.list(folder);

	if (error) throw new Error(`Storage list failed: ${error.message}`);
	return (data ?? []).map((file) => ({
		name: `${folder}/${file.name}`,
		size: file.metadata?.size ?? 0,
		createdAt: file.created_at,
	}));
}
