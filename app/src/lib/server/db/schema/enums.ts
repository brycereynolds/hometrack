import { pgEnum } from 'drizzle-orm/pg-core';

export const listingPhaseEnum = pgEnum('listing_phase', [
  'pre_market',
  'active',
  'closed',
  'canceled',
]);

export const taskCategoryEnum = pgEnum('task_category', [
  'onboarding',
  'improvements',
  'disclosures',
  'staging',
  'media',
  'pricing',
  'marketing',
  'showings',
  'offers',
  'escrow',
  'general',
]);

export const taskStatusEnum = pgEnum('task_status', [
  'todo',
  'in_progress',
  'done',
  'overdue',
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const contactTypeEnum = pgEnum('contact_type', [
  'client',
  'agent',
  'vendor',
  'lender',
  'inspector',
  'title',
]);

export const activityTypeEnum = pgEnum('activity_type', [
  'message',
  'email',
  'note',
  'voice_memo',
  'system',
  'ai_insight',
  'phase_change',
  'task_complete',
]);

export const aiInsightTypeEnum = pgEnum('ai_insight_type', [
  'connection',
  'anomaly',
  'recommendation',
  'warning',
]);

export const offerStatusEnum = pgEnum('offer_status', [
  'received',
  'reviewed',
  'countered',
  'accepted',
  'declined',
]);

export const documentCategoryEnum = pgEnum('document_category', [
  'disclosures',
  'inspection',
  'title',
  'contracts',
  'marketing',
  'photos',
  'other',
]);

export const documentStatusEnum = pgEnum('document_status', [
  'draft',
  'pending_signature',
  'signed',
  'complete',
  'expired',
]);

export const interestedLevelEnum = pgEnum('interested_level', [
  'very',
  'somewhat',
  'not',
]);

export const teamMemberRoleEnum = pgEnum('team_member_role', [
  'admin',
  'listing_agent',
  'tc',
  'marketing',
  'staging_lead',
]);

export const marketingAssetTypeEnum = pgEnum('marketing_asset_type', [
  'photo',
  'video',
  'floorplan',
  'brochure',
  'social_post',
  'virtual_tour',
]);

export const marketingAssetStatusEnum = pgEnum('marketing_asset_status', [
  'scheduled',
  'in_production',
  'complete',
  'published',
]);

export const quoteStatusEnum = pgEnum('quote_status', [
  'requested',
  'received',
  'approved',
  'declined',
]);

export const integrationStatusEnum = pgEnum('integration_status', [
  'connected',
  'disconnected',
  'error',
]);

export const noteTagEnum = pgEnum('note_tag', [
  'showing',
  'vendor',
  'client',
  'general',
]);

export const fieldNoteMediaTypeEnum = pgEnum('field_note_media_type', [
  'video',
  'voice_memo',
  'text',
  'photo',
]);

export const fieldNoteStatusEnum = pgEnum('field_note_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const fieldNoteActionStatusEnum = pgEnum('field_note_action_status', [
  'suggested',
  'accepted',
  'dismissed',
  'task_created',
]);

export const listingCostStatusEnum = pgEnum('listing_cost_status', [
  'estimated',
  'quoted',
  'committed',
  'paid',
]);

export const integrationCategoryEnum = pgEnum('integration_category', [
  'email',
  'calendar',
  'documents',
  'mls',
  'marketing',
  'financial',
  'communication',
]);
