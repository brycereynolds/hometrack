import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
	GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.S3_ENDPOINT!;
const bucket = process.env.S3_BUCKET!;
const region = process.env.S3_REGION ?? 'auto';

const s3 = new S3Client({
	endpoint,
	region,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID!,
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
	},
	forcePathStyle: false, // virtual-hosted-style
});

/**
 * Build an S3 key following the multi-tenant convention:
 *   {teamId}/{listingId}/{filename}
 * or {teamId}/general/{filename} when no listing is associated.
 */
export function buildKey(teamId: string, filename: string, listingId?: string): string {
	const segment = listingId ?? 'general';
	return `${teamId}/${segment}/${filename}`;
}

/** Upload a file buffer to S3. */
export async function uploadFile(
	key: string,
	buffer: Buffer | Uint8Array,
	contentType: string,
): Promise<void> {
	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: buffer,
			ContentType: contentType,
		}),
	);
}

/** Generate a presigned download URL. */
export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
	return awsGetSignedUrl(
		s3,
		new GetObjectCommand({ Bucket: bucket, Key: key }),
		{ expiresIn },
	);
}

/** Delete a single object from S3. */
export async function deleteFile(key: string): Promise<void> {
	await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** List objects under a prefix (e.g. a team or listing folder). */
export async function listFiles(prefix: string): Promise<{ key: string; size: number; lastModified: Date | undefined }[]> {
	const result = await s3.send(
		new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
	);
	return (result.Contents ?? []).map((obj) => ({
		key: obj.Key!,
		size: obj.Size ?? 0,
		lastModified: obj.LastModified,
	}));
}
