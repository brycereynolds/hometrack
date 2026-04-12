// UI configuration constants — phase & category metadata for badges, filters, etc.

export type ListingPhase = 'pre_market' | 'active' | 'closed' | 'canceled';

export type TaskCategory =
  | 'onboarding'
  | 'improvements'
  | 'disclosures'
  | 'staging'
  | 'media'
  | 'pricing'
  | 'marketing'
  | 'showings'
  | 'offers'
  | 'escrow'
  | 'general';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ContactType = 'client' | 'agent' | 'vendor' | 'lender' | 'inspector' | 'title';

export type ActivityType =
  | 'message'
  | 'email'
  | 'note'
  | 'voice_memo'
  | 'system'
  | 'ai_insight'
  | 'phase_change'
  | 'task_complete';

export type OfferStatus = 'received' | 'reviewed' | 'countered' | 'accepted' | 'declined';

export const PHASES: Record<ListingPhase, { label: string; color: string; order: number }> = {
  pre_market: { label: 'Pre-Market', color: '#6B9FC4', order: 0 },
  active: { label: 'Active', color: '#C4704B', order: 1 },
  closed: { label: 'Closed', color: '#5E8C61', order: 2 },
  canceled: { label: 'Canceled', color: '#9C958E', order: 3 },
};

export const TASK_CATEGORIES: Record<TaskCategory, { label: string; color: string; order: number }> = {
  onboarding: { label: 'Onboarding', color: '#6B9FC4', order: 0 },
  improvements: { label: 'Improvements', color: '#7B8B6F', order: 1 },
  disclosures: { label: 'Disclosures', color: '#A0845E', order: 2 },
  staging: { label: 'Staging', color: '#9B8EB5', order: 3 },
  media: { label: 'Media', color: '#C49A3C', order: 4 },
  pricing: { label: 'Pricing', color: '#B07D4F', order: 5 },
  marketing: { label: 'Marketing', color: '#C4704B', order: 6 },
  showings: { label: 'Showings', color: '#D4956B', order: 7 },
  offers: { label: 'Offers', color: '#5B8BA5', order: 8 },
  escrow: { label: 'Escrow', color: '#5E8C61', order: 9 },
  general: { label: 'General', color: '#8B8B8B', order: 10 },
};

export const PHASE_LIST = Object.entries(PHASES)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key, value]) => ({ key: key as ListingPhase, ...value }));
