import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/db/index.js';
import { documents } from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getSignedUrl } from '$lib/server/storage.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const doc = await adminDb.query.documents.findFirst({
    where: eq(documents.id, params.id),
  });

  if (!doc) {
    throw error(404, 'Document not found');
  }

  if (!doc.fileUrl) {
    throw error(404, 'No file associated with this document');
  }

  const signedUrl = await getSignedUrl(doc.fileUrl);
  return json({ url: signedUrl });
};
