CREATE TYPE "public"."activity_type" AS ENUM('message', 'email', 'note', 'voice_memo', 'system', 'ai_insight', 'phase_change', 'task_complete');--> statement-breakpoint
CREATE TYPE "public"."ai_insight_type" AS ENUM('connection', 'anomaly', 'recommendation', 'warning');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('client', 'agent', 'vendor', 'lender', 'inspector', 'title');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('disclosures', 'inspection', 'title', 'contracts', 'marketing', 'photos', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'pending_signature', 'signed', 'complete', 'expired');--> statement-breakpoint
CREATE TYPE "public"."field_note_action_status" AS ENUM('suggested', 'accepted', 'dismissed', 'task_created');--> statement-breakpoint
CREATE TYPE "public"."field_note_media_type" AS ENUM('video', 'voice_memo', 'text', 'photo');--> statement-breakpoint
CREATE TYPE "public"."field_note_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."integration_category" AS ENUM('email', 'calendar', 'documents', 'mls', 'marketing', 'financial', 'communication');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."interested_level" AS ENUM('very', 'somewhat', 'not');--> statement-breakpoint
CREATE TYPE "public"."listing_phase" AS ENUM('pre_market', 'active', 'closed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."marketing_asset_status" AS ENUM('scheduled', 'in_production', 'complete', 'published');--> statement-breakpoint
CREATE TYPE "public"."marketing_asset_type" AS ENUM('photo', 'video', 'floorplan', 'brochure', 'social_post', 'virtual_tour');--> statement-breakpoint
CREATE TYPE "public"."note_tag" AS ENUM('showing', 'vendor', 'client', 'general');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('received', 'reviewed', 'countered', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('requested', 'received', 'approved', 'declined');--> statement-breakpoint
CREATE TYPE "public"."task_category" AS ENUM('onboarding', 'improvements', 'disclosures', 'staging', 'media', 'pricing', 'marketing', 'showings', 'offers', 'escrow', 'general');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('admin', 'listing_agent', 'tc', 'marketing', 'staging_lead');--> statement-breakpoint
CREATE TYPE "public"."market_analysis_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"role" "team_member_role" NOT NULL,
	"role_label" text,
	"avatar" text,
	"initials" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"domain" text,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"type" "contact_type" NOT NULL,
	"company" text,
	"avatar" text,
	"initials" text,
	"notes" text,
	"buyer_needs" text,
	"market_focus" text,
	"relationship_strength" integer,
	"last_interaction" text,
	"last_interaction_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"price" real,
	"mls_number" text,
	"description" text,
	"phase" "listing_phase" DEFAULT 'pre_market' NOT NULL,
	"under_contract" boolean DEFAULT false NOT NULL,
	"days_in_phase" integer DEFAULT 0,
	"days_on_market" integer DEFAULT 0,
	"list_date" timestamp,
	"target_list_date" timestamp,
	"listing_agreement_date" timestamp,
	"close_date" timestamp,
	"canceled_at" timestamp,
	"cancel_reason" text,
	"agent_id" text,
	"client_id" text,
	"tasks_done" integer DEFAULT 0,
	"tasks_total" integer DEFAULT 0,
	"documents_count" integer DEFAULT 0,
	"showings_count" integer DEFAULT 0,
	"offers_count" integer DEFAULT 0,
	"zillow_views" integer DEFAULT 0,
	"zillow_saves" integer DEFAULT 0,
	"portal_settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"title" text NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"assignee_id" text,
	"phase" "listing_phase",
	"task_category" "task_category",
	"due_date" timestamp,
	"is_overdue" boolean DEFAULT false,
	"subtasks" jsonb,
	"source_field_note_action_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_items" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text,
	"type" "activity_type" NOT NULL,
	"author_id" text,
	"author_name" text,
	"author_initials" text,
	"content" text,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text,
	"type" "ai_insight_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"action_label" text,
	"action_url" text,
	"dismissed" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showings" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"time" text,
	"agent_name" text,
	"agent_company" text,
	"buyer_type" text,
	"feedback" text,
	"rating" integer,
	"interested_level" "interested_level",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_name" text,
	"buyer_agent" text,
	"price" real,
	"earnest_deposit" real,
	"contingencies" jsonb,
	"close_date" timestamp,
	"financing_type" text,
	"status" "offer_status" DEFAULT 'received' NOT NULL,
	"submitted_date" timestamp,
	"expiration_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"description" text,
	"amount" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"scope" text,
	"amount" real,
	"status" "quote_status" DEFAULT 'requested' NOT NULL,
	"requested_date" timestamp,
	"received_date" timestamp,
	"valid_until" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"category" text,
	"phone" text,
	"email" text,
	"initials" text,
	"rating" real,
	"reliability_score" integer,
	"avg_response_time" text,
	"projects_completed" integer DEFAULT 0,
	"avg_cost" text,
	"service_area" text,
	"specialties" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"total_budget" real,
	"spent" real,
	"remaining" real,
	"pending_quotes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"name" text NOT NULL,
	"budgeted" real,
	"actual" real,
	"variance" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"name" text NOT NULL,
	"category" "document_category" NOT NULL,
	"uploaded_by_id" text,
	"uploaded_date" timestamp,
	"file_size" text,
	"file_size_bytes" integer,
	"file_type" text,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1,
	"file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comp_sales" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"property_id" text NOT NULL,
	"price" real,
	"price_per_sqft" real,
	"sale_date" timestamp,
	"days_on_market" integer,
	"distance" text,
	"adjusted_value" real,
	"adjustments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"type" "marketing_asset_type" NOT NULL,
	"name" text NOT NULL,
	"status" "marketing_asset_status" DEFAULT 'scheduled' NOT NULL,
	"url" text,
	"date" timestamp,
	"platform" text,
	"metrics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "integration_category" NOT NULL,
	"icon" text,
	"status" "integration_status" DEFAULT 'disconnected' NOT NULL,
	"last_sync" timestamp,
	"connected_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"phase" "listing_phase" NOT NULL,
	"task_category" "task_category",
	"task_count" integer DEFAULT 0,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" text,
	"platform" text NOT NULL,
	"event_type" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_showings" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" text,
	"date" date NOT NULL,
	"showing_count" integer DEFAULT 0 NOT NULL,
	"open_house_attendees" integer DEFAULT 0 NOT NULL,
	"feedback_score" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" text,
	"date" date NOT NULL,
	"total_value" real NOT NULL,
	"active_listings" integer NOT NULL,
	"pre_market_listings" integer NOT NULL,
	"closed_value" real DEFAULT 0 NOT NULL,
	"closed_deals" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_member_id" text,
	"period" text NOT NULL,
	"period_start" date NOT NULL,
	"active_listings" integer DEFAULT 0 NOT NULL,
	"closed_deals" integer DEFAULT 0 NOT NULL,
	"total_volume" real DEFAULT 0 NOT NULL,
	"avg_days_on_market" integer,
	"client_satisfaction" real,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"avg_completion_days" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text,
	"contact_id" text,
	"uploaded_by_id" text NOT NULL,
	"filename" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_path" text NOT NULL,
	"category" text,
	"description" text,
	"access_level" text DEFAULT 'team' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "files_storage_path_unique" UNIQUE("storage_path")
);
--> statement-breakpoint
CREATE TABLE "field_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text,
	"author_id" text NOT NULL,
	"media_type" "field_note_media_type" NOT NULL,
	"status" "field_note_status" DEFAULT 'pending' NOT NULL,
	"content_hash" text,
	"tag" "note_tag" DEFAULT 'general' NOT NULL,
	"text_content" text,
	"summary" text,
	"media_storage_path" text,
	"processed_media_path" text,
	"duration" real,
	"frame_count" integer,
	"workflow_id" text,
	"processing_started_at" timestamp,
	"processing_completed_at" timestamp,
	"processing_error" text,
	"processing_stages" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_note_transcripts" (
	"id" text PRIMARY KEY NOT NULL,
	"field_note_id" text NOT NULL,
	"raw_transcript" text,
	"raw_segments" jsonb,
	"language" text,
	"enriched_transcript" text,
	"raw_storage_path" text,
	"enriched_storage_path" text
);
--> statement-breakpoint
CREATE TABLE "field_note_frames" (
	"id" text PRIMARY KEY NOT NULL,
	"field_note_id" text NOT NULL,
	"frame_index" integer NOT NULL,
	"timestamp" real NOT NULL,
	"storage_path" text,
	"caption" text,
	"visual_description" text
);
--> statement-breakpoint
CREATE TABLE "field_note_moments" (
	"id" text PRIMARY KEY NOT NULL,
	"field_note_id" text NOT NULL,
	"moment_index" integer NOT NULL,
	"timestamp" real NOT NULL,
	"end_timestamp" real,
	"category" text,
	"description" text,
	"transcript_context" text,
	"best_frame_id" text,
	"best_frame_timestamp" real,
	"ranked_frames" jsonb,
	"scrub_start" real,
	"scrub_end" real,
	"enriched_caption" text,
	"speech_visual_relationship" text
);
--> statement-breakpoint
CREATE TABLE "field_note_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"field_note_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"priority" text,
	"status" "field_note_action_status" DEFAULT 'suggested' NOT NULL,
	"quote_needed" boolean DEFAULT false,
	"estimated_vendor_category" text,
	"source_moment_id" text,
	"source_timestamp" real,
	"source_quote" text,
	"extraction_confidence" real,
	"linked_task_id" text,
	"linked_quote_id" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"frequency" text DEFAULT 'monthly' NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_schedules_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
CREATE TABLE "comp_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"market_analysis_id" text NOT NULL,
	"property_id" text NOT NULL,
	"source" text NOT NULL,
	"external_id" text,
	"price" real,
	"price_per_sqft" real,
	"sold_date" timestamp,
	"days_on_market" integer,
	"status" text,
	"distance_miles" real,
	"adjustments" jsonb,
	"is_confirmed_comp" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"status" "market_analysis_status" DEFAULT 'pending' NOT NULL,
	"search_params" jsonb,
	"suggested_price_low" real,
	"suggested_price_high" real,
	"confidence" real,
	"ai_narrative" text,
	"comp_count" integer,
	"workflow_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" text PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"county" text,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"beds" integer,
	"baths" real,
	"baths_full" integer,
	"baths_half" integer,
	"sqft" integer,
	"lot_sqft" integer,
	"lot_size_acres" real,
	"year_built" integer,
	"property_type" text,
	"stories" integer,
	"architectural_style" text,
	"construction_materials" jsonb,
	"roof" text,
	"foundation" jsonb,
	"basement" text,
	"attic" text,
	"features" jsonb,
	"parking_spaces" integer,
	"garage_spaces" integer,
	"parking_features" jsonb,
	"lot_features" jsonb,
	"rooms_count" integer,
	"rooms" jsonb,
	"tax_assessed_value" real,
	"tax_annual_amount" real,
	"tax_year" integer,
	"parcel_number" text,
	"hoa_fee" real,
	"hoa_fee_frequency" text,
	"sewer" text,
	"water_source" text,
	"electric" text,
	"gas" text,
	"nearby_schools" jsonb,
	"elementary_school" text,
	"elementary_school_district" text,
	"middle_school" text,
	"middle_school_district" text,
	"high_school" text,
	"high_school_district" text,
	"neighborhood" text,
	"walkability_score" integer,
	"transit_score" integer,
	"bike_score" integer,
	"photos" jsonb DEFAULT '[]',
	"last_sold_price" real,
	"last_sold_date" timestamp,
	"zestimate" real,
	"rent_zestimate" real,
	"price_history" jsonb,
	"tax_history" jsonb,
	"zillow_id" bigint,
	"redfin_id" text,
	"mls_id" text,
	"zillow_data" jsonb,
	"zillow_url" text,
	"redfin_data" jsonb,
	"redfin_url" text,
	"last_synced" timestamp,
	"data_completeness_score" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "properties_parcel_number_unique" UNIQUE("parcel_number"),
	CONSTRAINT "properties_zillow_id_unique" UNIQUE("zillow_id"),
	CONSTRAINT "properties_redfin_id_unique" UNIQUE("redfin_id"),
	CONSTRAINT "properties_mls_id_unique" UNIQUE("mls_id")
);
--> statement-breakpoint
CREATE TABLE "external_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"team_id" text NOT NULL,
	"source" text NOT NULL,
	"mentioned_by" text,
	"source_url" text,
	"listed_price" real,
	"listed_date" timestamp,
	"status" text,
	"listing_agent_name" text,
	"listing_agent_email" text,
	"listing_agent_phone" text,
	"listing_agent_company" text,
	"relevance_to" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyer_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"looking_for_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"preferred_beds_min" integer,
	"preferred_beds_max" integer,
	"preferred_baths_min" real,
	"preferred_baths_max" real,
	"preferred_sqft_min" integer,
	"preferred_sqft_max" integer,
	"preferred_lot_sqft_min" integer,
	"preferred_lot_sqft_max" integer,
	"preferred_price_min" real,
	"preferred_price_max" real,
	"preferred_areas" jsonb,
	"preferred_property_types" jsonb,
	"preferred_features" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_preferences_contact_id_unique" UNIQUE("contact_id")
);
--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_agent_id_team_members_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_client_id_contacts_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_team_members_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_author_id_team_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showings" ADD CONSTRAINT "showings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showings" ADD CONSTRAINT "showings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_budgets" ADD CONSTRAINT "financial_budgets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_budgets" ADD CONSTRAINT "financial_budgets_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_budget_id_financial_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."financial_budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_team_members_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comp_sales" ADD CONSTRAINT "comp_sales_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comp_sales" ADD CONSTRAINT "comp_sales_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_assets" ADD CONSTRAINT "marketing_assets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_assets" ADD CONSTRAINT "marketing_assets_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_connected_by_id_team_members_id_fk" FOREIGN KEY ("connected_by_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_showings" ADD CONSTRAINT "analytics_showings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_metrics" ADD CONSTRAINT "pipeline_metrics_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_performance" ADD CONSTRAINT "team_performance_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_id_team_members_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_notes" ADD CONSTRAINT "field_notes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_notes" ADD CONSTRAINT "field_notes_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_notes" ADD CONSTRAINT "field_notes_author_id_team_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_transcripts" ADD CONSTRAINT "field_note_transcripts_field_note_id_field_notes_id_fk" FOREIGN KEY ("field_note_id") REFERENCES "public"."field_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_frames" ADD CONSTRAINT "field_note_frames_field_note_id_field_notes_id_fk" FOREIGN KEY ("field_note_id") REFERENCES "public"."field_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_moments" ADD CONSTRAINT "field_note_moments_field_note_id_field_notes_id_fk" FOREIGN KEY ("field_note_id") REFERENCES "public"."field_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_moments" ADD CONSTRAINT "field_note_moments_best_frame_id_field_note_frames_id_fk" FOREIGN KEY ("best_frame_id") REFERENCES "public"."field_note_frames"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_actions" ADD CONSTRAINT "field_note_actions_field_note_id_field_notes_id_fk" FOREIGN KEY ("field_note_id") REFERENCES "public"."field_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_actions" ADD CONSTRAINT "field_note_actions_source_moment_id_field_note_moments_id_fk" FOREIGN KEY ("source_moment_id") REFERENCES "public"."field_note_moments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_actions" ADD CONSTRAINT "field_note_actions_linked_quote_id_quotes_id_fk" FOREIGN KEY ("linked_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_actions" ADD CONSTRAINT "field_note_actions_reviewed_by_team_members_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_schedules" ADD CONSTRAINT "analysis_schedules_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comp_listings" ADD CONSTRAINT "comp_listings_market_analysis_id_market_analyses_id_fk" FOREIGN KEY ("market_analysis_id") REFERENCES "public"."market_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comp_listings" ADD CONSTRAINT "comp_listings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_analyses" ADD CONSTRAINT "market_analyses_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_listings" ADD CONSTRAINT "external_listings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_listings" ADD CONSTRAINT "external_listings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_preferences" ADD CONSTRAINT "buyer_preferences_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_email_idx" ON "team_members" USING btree ("team_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_user_idx" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "contacts_team_id_idx" ON "contacts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "contacts_team_type_idx" ON "contacts" USING btree ("team_id","type");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "listings_team_id_idx" ON "listings" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "listings_team_phase_idx" ON "listings" USING btree ("team_id","phase");--> statement-breakpoint
CREATE INDEX "listings_agent_id_idx" ON "listings" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "listings_client_id_idx" ON "listings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "listings_mls_number_idx" ON "listings" USING btree ("mls_number");--> statement-breakpoint
CREATE INDEX "listings_property_id_idx" ON "listings" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "tasks_team_id_idx" ON "tasks" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "tasks_listing_id_idx" ON "tasks" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "tasks_assignee_id_idx" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "tasks_team_status_idx" ON "tasks" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "activity_items_team_id_idx" ON "activity_items" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "activity_items_listing_id_idx" ON "activity_items" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "activity_items_timestamp_idx" ON "activity_items" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "activity_items_team_type_idx" ON "activity_items" USING btree ("team_id","type");--> statement-breakpoint
CREATE INDEX "ai_insights_team_id_idx" ON "ai_insights" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "ai_insights_listing_id_idx" ON "ai_insights" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "ai_insights_team_dismissed_idx" ON "ai_insights" USING btree ("team_id","dismissed");--> statement-breakpoint
CREATE INDEX "showings_team_id_idx" ON "showings" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "showings_listing_id_idx" ON "showings" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "showings_date_idx" ON "showings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "offers_team_id_idx" ON "offers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "offers_listing_id_idx" ON "offers" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "offers_team_status_idx" ON "offers" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "quote_line_items_quote_id_idx" ON "quote_line_items" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "quotes_team_id_idx" ON "quotes" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "quotes_vendor_id_idx" ON "quotes" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "quotes_listing_id_idx" ON "quotes" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "quotes_team_status_idx" ON "quotes" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "vendors_team_id_idx" ON "vendors" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "vendors_team_category_idx" ON "vendors" USING btree ("team_id","category");--> statement-breakpoint
CREATE INDEX "vendors_email_idx" ON "vendors" USING btree ("email");--> statement-breakpoint
CREATE INDEX "financial_budgets_team_id_idx" ON "financial_budgets" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "financial_budgets_listing_id_idx" ON "financial_budgets" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "financial_categories_budget_id_idx" ON "financial_categories" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "documents_team_id_idx" ON "documents" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "documents_listing_id_idx" ON "documents" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "documents_team_category_idx" ON "documents" USING btree ("team_id","category");--> statement-breakpoint
CREATE INDEX "documents_uploaded_by_id_idx" ON "documents" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE INDEX "comp_sales_team_id_idx" ON "comp_sales" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "comp_sales_property_id_idx" ON "comp_sales" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "marketing_assets_team_id_idx" ON "marketing_assets" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "marketing_assets_listing_id_idx" ON "marketing_assets" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "marketing_assets_team_type_idx" ON "marketing_assets" USING btree ("team_id","type");--> statement-breakpoint
CREATE INDEX "integrations_team_id_idx" ON "integrations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "integrations_team_category_idx" ON "integrations" USING btree ("team_id","category");--> statement-breakpoint
CREATE INDEX "workflow_templates_team_id_idx" ON "workflow_templates" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "workflow_templates_team_phase_idx" ON "workflow_templates" USING btree ("team_id","phase");--> statement-breakpoint
CREATE INDEX "analytics_events_listing_id_idx" ON "analytics_events" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "analytics_events_date_idx" ON "analytics_events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "analytics_events_listing_date_idx" ON "analytics_events" USING btree ("listing_id","date");--> statement-breakpoint
CREATE INDEX "analytics_showings_listing_id_idx" ON "analytics_showings" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "analytics_showings_date_idx" ON "analytics_showings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "pipeline_metrics_team_id_idx" ON "pipeline_metrics" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "pipeline_metrics_date_idx" ON "pipeline_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "team_performance_member_id_idx" ON "team_performance" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "team_performance_period_idx" ON "team_performance" USING btree ("period","period_start");--> statement-breakpoint
CREATE INDEX "files_team_id_idx" ON "files" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "files_listing_id_idx" ON "files" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "files_contact_id_idx" ON "files" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "files_team_category_idx" ON "files" USING btree ("team_id","category");--> statement-breakpoint
CREATE INDEX "files_uploaded_by_id_idx" ON "files" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE INDEX "field_notes_team_id_idx" ON "field_notes" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "field_notes_listing_id_idx" ON "field_notes" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "field_notes_author_id_idx" ON "field_notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "field_notes_status_idx" ON "field_notes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "field_notes_content_hash_idx" ON "field_notes" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "field_note_transcripts_field_note_id_idx" ON "field_note_transcripts" USING btree ("field_note_id");--> statement-breakpoint
CREATE INDEX "field_note_frames_field_note_id_idx" ON "field_note_frames" USING btree ("field_note_id");--> statement-breakpoint
CREATE INDEX "field_note_frames_field_note_id_frame_idx" ON "field_note_frames" USING btree ("field_note_id","frame_index");--> statement-breakpoint
CREATE INDEX "field_note_moments_field_note_id_idx" ON "field_note_moments" USING btree ("field_note_id");--> statement-breakpoint
CREATE INDEX "field_note_moments_field_note_id_moment_idx" ON "field_note_moments" USING btree ("field_note_id","moment_index");--> statement-breakpoint
CREATE INDEX "field_note_actions_field_note_id_idx" ON "field_note_actions" USING btree ("field_note_id");--> statement-breakpoint
CREATE INDEX "field_note_actions_status_idx" ON "field_note_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "field_note_actions_linked_task_id_idx" ON "field_note_actions" USING btree ("linked_task_id");--> statement-breakpoint
CREATE INDEX "analysis_schedules_listing_id_idx" ON "analysis_schedules" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "comp_listings_analysis_id_idx" ON "comp_listings" USING btree ("market_analysis_id");--> statement-breakpoint
CREATE INDEX "comp_listings_property_id_idx" ON "comp_listings" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "market_analyses_listing_id_idx" ON "market_analyses" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "market_analyses_status_idx" ON "market_analyses" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "properties_address_unique_idx" ON "properties" USING btree ("address","city","state","zip");--> statement-breakpoint
CREATE INDEX "properties_zip_idx" ON "properties" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "properties_coords_idx" ON "properties" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "properties_beds_baths_idx" ON "properties" USING btree ("beds","baths");--> statement-breakpoint
CREATE INDEX "properties_property_type_idx" ON "properties" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "properties_year_built_idx" ON "properties" USING btree ("year_built");--> statement-breakpoint
CREATE INDEX "properties_zillow_id_idx" ON "properties" USING btree ("zillow_id");--> statement-breakpoint
CREATE INDEX "properties_redfin_id_idx" ON "properties" USING btree ("redfin_id");--> statement-breakpoint
CREATE INDEX "properties_mls_id_idx" ON "properties" USING btree ("mls_id");--> statement-breakpoint
CREATE INDEX "properties_features_idx" ON "properties" USING gin ("features");--> statement-breakpoint
CREATE INDEX "external_listings_property_id_idx" ON "external_listings" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "external_listings_team_id_idx" ON "external_listings" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "external_listings_source_idx" ON "external_listings" USING btree ("source");--> statement-breakpoint
CREATE INDEX "external_listings_is_active_idx" ON "external_listings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "external_listings_status_idx" ON "external_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "buyer_preferences_contact_id_idx" ON "buyer_preferences" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "buyer_preferences_looking_for_type_idx" ON "buyer_preferences" USING btree ("looking_for_type");--> statement-breakpoint
CREATE INDEX "buyer_preferences_is_active_idx" ON "buyer_preferences" USING btree ("is_active");
-- ============================================================
-- RLS Policies
-- ============================================================

-- 1. auth.uid() helper (self-hosted Supabase may not have it)
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', TRUE), '')::uuid
$$;

-- 2. FK from team_members.user_id → auth.users(id)
ALTER TABLE team_members
  ADD CONSTRAINT team_members_user_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. RLS helper: returns all team_ids for a given auth user
CREATE OR REPLACE FUNCTION public.get_team_ids_for_user(user_uuid uuid)
RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = user_uuid
$$;

-- 4. Grant schema usage to Supabase roles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================
-- 5. Enable RLS + create policies
-- ============================================================

-- --------------------------------------------------------
-- Pattern A: Tables with direct team_id column
-- --------------------------------------------------------

-- teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON teams
  FOR ALL USING (id IN (SELECT get_team_ids_for_user(auth.uid())));

-- team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON team_members
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON listings
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON tasks
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON offers
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- showings
ALTER TABLE showings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON showings
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- activity_items
ALTER TABLE activity_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON activity_items
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- marketing_assets
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON marketing_assets
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON documents
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON vendors
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON quotes
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON contacts
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- comp_sales
ALTER TABLE comp_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON comp_sales
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON integrations
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- ai_insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON ai_insights
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON files
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- financial_budgets
ALTER TABLE financial_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON financial_budgets
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- pipeline_metrics
ALTER TABLE pipeline_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON pipeline_metrics
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- workflow_templates
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON workflow_templates
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- external_listings
ALTER TABLE external_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON external_listings
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- field_notes
ALTER TABLE field_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON field_notes
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));

-- --------------------------------------------------------
-- Pattern B: Indirect via listing_id (no team_id column)
-- --------------------------------------------------------

-- analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON analytics_events
  FOR ALL USING (
    listing_id IN (
      SELECT id FROM listings WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- analytics_showings
ALTER TABLE analytics_showings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON analytics_showings
  FOR ALL USING (
    listing_id IN (
      SELECT id FROM listings WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- market_analyses
ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON market_analyses
  FOR ALL USING (
    listing_id IN (
      SELECT l.id FROM listings l
      WHERE l.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- analysis_schedules
ALTER TABLE analysis_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON analysis_schedules
  FOR ALL USING (
    listing_id IN (
      SELECT l.id FROM listings l
      WHERE l.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- --------------------------------------------------------
-- Pattern C: Indirect via team_member_id
-- --------------------------------------------------------

-- team_performance
ALTER TABLE team_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON team_performance
  FOR ALL USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- --------------------------------------------------------
-- Pattern D: Grandchild tables (no team_id, join through parent)
-- --------------------------------------------------------

-- financial_categories (budget_id → financial_budgets.team_id)
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON financial_categories
  FOR ALL USING (
    budget_id IN (
      SELECT id FROM financial_budgets WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- quote_line_items (quote_id → quotes.team_id)
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON quote_line_items
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- comp_listings (market_analysis_id → market_analyses → listings)
ALTER TABLE comp_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON comp_listings
  FOR ALL USING (
    market_analysis_id IN (
      SELECT ma.id FROM market_analyses ma
      JOIN listings l ON ma.listing_id = l.id
      WHERE l.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- buyer_preferences (contact_id → contacts.team_id)
ALTER TABLE buyer_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON buyer_preferences
  FOR ALL USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      WHERE c.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- field_note_transcripts (field_note_id → field_notes.team_id)
ALTER TABLE field_note_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON field_note_transcripts
  FOR ALL USING (
    field_note_id IN (
      SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- field_note_frames (field_note_id → field_notes.team_id)
ALTER TABLE field_note_frames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON field_note_frames
  FOR ALL USING (
    field_note_id IN (
      SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- field_note_moments (field_note_id → field_notes.team_id)
ALTER TABLE field_note_moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON field_note_moments
  FOR ALL USING (
    field_note_id IN (
      SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- field_note_actions (field_note_id → field_notes.team_id)
ALTER TABLE field_note_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_member_access" ON field_note_actions
  FOR ALL USING (
    field_note_id IN (
      SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );

-- --------------------------------------------------------
-- Pattern E: Public data (all authenticated users)
-- --------------------------------------------------------

-- properties (public data from Zillow/Redfin)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_access" ON properties
  FOR ALL TO authenticated USING (true);

-- ============================================================
-- 6. Grant table & sequence permissions to authenticated role
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 7. Standalone index on team_members.user_id for RLS policy performance
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
