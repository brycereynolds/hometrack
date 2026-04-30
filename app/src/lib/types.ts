// Shared types derived from Drizzle schema — used by components for prop typing.
// These represent what DB queries return via InferSelectModel.

import type { InferSelectModel } from 'drizzle-orm';
import type {
  listings,
  contacts,
  tasks,
  activityItems,
  aiInsights,
  showings,
  offers,
  vendors,
  quotes,
  quoteLineItems,
  documents,
  compSales,
  financialBudgets,
  financialCategories,
  marketingAssets,
  integrations,
  workflowTemplates,
  teamMembers,
  properties,
  fieldNoteMoments,
  fieldNoteFrames,
  fieldNoteActions,
} from '$lib/server/db/schema/index.js';

// ─── Base DB types ──────────────────────────────────────────────────────────

export type Listing = InferSelectModel<typeof listings>;
export type Property = InferSelectModel<typeof properties>;
export type Contact = InferSelectModel<typeof contacts>;
export type Task = InferSelectModel<typeof tasks>;
export type ActivityItem = InferSelectModel<typeof activityItems>;
export type AIInsight = InferSelectModel<typeof aiInsights>;
export type Showing = InferSelectModel<typeof showings>;
export type Offer = InferSelectModel<typeof offers>;
export type Vendor = InferSelectModel<typeof vendors>;
export type Quote = InferSelectModel<typeof quotes>;
export type QuoteLineItem = InferSelectModel<typeof quoteLineItems>;
export type Document = InferSelectModel<typeof documents>;
export type CompSale = InferSelectModel<typeof compSales>;
export type FinancialBudget = InferSelectModel<typeof financialBudgets>;
export type FinancialCategory = InferSelectModel<typeof financialCategories>;
export type MarketingAsset = InferSelectModel<typeof marketingAssets>;
export type Integration = InferSelectModel<typeof integrations>;
export type WorkflowTemplate = InferSelectModel<typeof workflowTemplates>;
export type TeamMember = InferSelectModel<typeof teamMembers>;

// ─── Types with joined relations (what load functions return) ───────────────

export type ListingWithRelations = Listing & {
  property: Property;
  agent: TeamMember | null;
  client: Contact | null;
};

export type TaskWithRelations = Task & {
  assignee: TeamMember | null;
  listing: Listing | null;
};

export type QuoteWithLineItems = Quote & {
  lineItems: QuoteLineItem[];
};

export type FinancialSummary = FinancialBudget & {
  categories: FinancialCategory[];
};

// ─── Field note types ────────────────────────────────────────────────────────

export type FieldNoteMoment = InferSelectModel<typeof fieldNoteMoments>;
export type FieldNoteFrame = InferSelectModel<typeof fieldNoteFrames>;
export type FieldNoteAction = InferSelectModel<typeof fieldNoteActions>;

/** Moment with its best frame relation loaded. */
export type MomentWithFrame = FieldNoteMoment & {
  bestFrame: FieldNoteFrame | null;
};

/** Action with its source moment (and that moment's best frame). */
export type ActionWithSourceMoment = FieldNoteAction & {
  sourceMoment?: MomentWithFrame | null;
};

// ─── Listing shorthand (property only, no agent/client) ──────────────────────

export type ListingWithProperty = Listing & {
  property: Property;
};

// ─── Search area (stored in listings.searchArea JSONB) ───────────────────────

export type RadiusSearchArea = {
  type: 'radius';
  lat: number;
  lng: number;
  radius: number;
};

export type PolygonSearchArea = {
  type: 'polygon';
  coordinates: [number, number][];
};

export type SearchArea = RadiusSearchArea | PolygonSearchArea;
