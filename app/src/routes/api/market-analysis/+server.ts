import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { marketAnalyses, compListings, listings, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { startMarketAnalysisWorkflow } from '$lib/server/temporal.js';

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { listingId, searchParams, prompt } = body;

  if (!listingId) {
    return json({ error: 'Missing listingId' }, { status: 400 });
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const member = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, locals.user!.id),
      });
      if (!member) throw new Error('Team member not found');

      const listing = await db.query.listings.findFirst({
        where: and(eq(listings.id, listingId), eq(listings.teamId, member.teamId)),
        with: { property: true },
      });
      if (!listing) throw new Error('Listing not found');

      // Check for an existing pending/processing analysis — prevent duplicates
      const existing = await db.query.marketAnalyses.findFirst({
        where: and(
          eq(marketAnalyses.listingId, listingId),
          inArray(marketAnalyses.status, ['pending', 'processing']),
        ),
      });
      if (existing) {
        return { id: existing.id, workflowId: existing.workflowId, alreadyRunning: true };
      }

      const analysisId = crypto.randomUUID();
      await db.insert(marketAnalyses).values({
        id: analysisId,
        listingId,
        status: 'pending',
        searchParams: searchParams ?? null,
      });

      const workflow = await startMarketAnalysisWorkflow({
        analysisId,
        listingId,
        teamId: member.teamId,
        address: listing.property.address,
        city: listing.property.city,
        state: listing.property.state,
        zip: listing.property.zip,
        lat: listing.property.lat,
        lng: listing.property.lng,
        beds: listing.property.beds,
        baths: listing.property.baths,
        sqft: listing.property.sqft,
        propertyType: listing.property.propertyType,
        searchParams: searchParams ?? {},
        prompt: prompt || undefined,
      });

      if (workflow) {
        await db
          .update(marketAnalyses)
          .set({ workflowId: workflow.workflowId, status: 'processing', updatedAt: new Date() })
          .where(eq(marketAnalyses.id, analysisId));
      }

      return { id: analysisId, workflowId: workflow?.workflowId ?? null };
    });

    return json({ success: true, ...result });
  } catch (err) {
    console.error('Market analysis error:', err);
    return json({ error: 'Failed to start market analysis' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const listingId = url.searchParams.get('listingId');
  if (!listingId) {
    return json({ error: 'Missing listingId' }, { status: 400 });
  }

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const analyses = await db
        .select()
        .from(marketAnalyses)
        .where(eq(marketAnalyses.listingId, listingId))
        .orderBy(desc(marketAnalyses.createdAt));

      let comps: any[] = [];
      if (analyses.length > 0) {
        comps = await db.query.compListings.findMany({
          where: eq(compListings.marketAnalysisId, analyses[0].id),
          with: { property: true },
        });
      }

      return { analyses, comps };
    });

    return json(result);
  } catch (err) {
    console.error('Market analysis fetch error:', err);
    return json({ error: 'Failed to fetch analyses' }, { status: 500 });
  }
};
