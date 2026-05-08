import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { quotes } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { getSignedUrl } from '$lib/server/storage.js';

export const GET: RequestHandler = async ({ params, locals, url }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const teamId = url.searchParams.get('teamId');
  if (!teamId) throw error(400, 'teamId required');

  const quote = await withRLS(locals.user.id, 'authenticated', async (db) => {
    return db.query.quotes.findFirst({
      where: and(eq(quotes.id, params.id), eq(quotes.teamId, teamId)),
    });
  });

  if (!quote) throw error(404, 'Quote not found');
  if (!quote.documentPath) throw error(404, 'No document attached to this quote');

  const signedUrl = await getSignedUrl(quote.documentPath);
  return json({ url: signedUrl, name: quote.documentName });
};
