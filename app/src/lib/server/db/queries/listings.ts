import { eq, and, desc } from 'drizzle-orm';
import { adminDb, type AppDatabase } from '../index.js';
import {
  listings,
  activityItems,
  aiInsights,
  showings,
  offers,
  documents,
  financialBudgets,
  quotes,
  marketingAssets,
  compSales,
} from '../schema/index.js';

export async function getListings(teamId: string, db: AppDatabase = adminDb) {
  return db.query.listings.findMany({
    where: eq(listings.teamId, teamId),
    with: {
      agent: true,
      client: true,
    },
  });
}

export async function getListingById(teamId: string, id: string, db: AppDatabase = adminDb) {
  return db.query.listings.findFirst({
    where: and(eq(listings.teamId, teamId), eq(listings.id, id)),
    with: {
      agent: true,
      client: true,
    },
  });
}

export async function getListingsByPhase(teamId: string, db: AppDatabase = adminDb) {
  const all = await getListings(teamId, db);
  const grouped: Record<string, typeof all> = {};
  for (const listing of all) {
    const phase = listing.phase;
    if (!grouped[phase]) grouped[phase] = [];
    grouped[phase].push(listing);
  }
  return grouped;
}

export async function getActivityByListing(teamId: string, listingId: string, db: AppDatabase = adminDb) {
  return db.query.activityItems.findMany({
    where: and(eq(activityItems.teamId, teamId), eq(activityItems.listingId, listingId)),
    orderBy: desc(activityItems.timestamp),
  });
}

export async function getInsightsByListing(teamId: string, listingId: string, db: AppDatabase = adminDb) {
  return db.query.aiInsights.findMany({
    where: and(eq(aiInsights.teamId, teamId), eq(aiInsights.listingId, listingId)),
    orderBy: desc(aiInsights.timestamp),
  });
}

export async function getShowingsByListing(teamId: string, listingId: string, db: AppDatabase = adminDb) {
  return db.query.showings.findMany({
    where: and(eq(showings.teamId, teamId), eq(showings.listingId, listingId)),
    orderBy: desc(showings.date),
  });
}

export async function getOffersByListing(teamId: string, listingId: string, db: AppDatabase = adminDb) {
  return db.query.offers.findMany({
    where: and(eq(offers.teamId, teamId), eq(offers.listingId, listingId)),
  });
}

export async function getDocumentsByListing(teamId: string, listingId: string, db: AppDatabase = adminDb) {
  return db.query.documents.findMany({
    where: and(eq(documents.teamId, teamId), eq(documents.listingId, listingId)),
    with: {
      uploadedBy: true,
    },
  });
}

export async function getFinancialsByListing(teamId: string, listingId: string, db: AppDatabase = adminDb) {
  return db.query.financialBudgets.findFirst({
    where: and(eq(financialBudgets.teamId, teamId), eq(financialBudgets.listingId, listingId)),
    with: {
      categories: true,
    },
  });
}

export async function getQuotesByListing(teamId: string, listingId: string, db: AppDatabase = adminDb) {
  return db.query.quotes.findMany({
    where: and(eq(quotes.teamId, teamId), eq(quotes.listingId, listingId)),
    with: {
      vendor: true,
      lineItems: true,
    },
  });
}

export async function getMarketingByListing(teamId: string, listingId: string, db: AppDatabase = adminDb) {
  return db.query.marketingAssets.findMany({
    where: and(eq(marketingAssets.teamId, teamId), eq(marketingAssets.listingId, listingId)),
  });
}

export async function getCompSales(teamId: string, db: AppDatabase = adminDb) {
  return db.query.compSales.findMany({
    where: eq(compSales.teamId, teamId),
  });
}
