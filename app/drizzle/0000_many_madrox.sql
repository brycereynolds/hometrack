-- Idempotent initial schema migration
-- Safe to run multiple times without error

DO $$ BEGIN
  CREATE TYPE "public"."activity_type" AS ENUM('message', 'email', 'note', 'voice_memo', 'system', 'ai_insight', 'phase_change', 'task_complete');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."ai_insight_type" AS ENUM('connection', 'anomaly', 'recommendation', 'warning');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."contact_type" AS ENUM('client', 'agent', 'vendor', 'lender', 'inspector', 'title');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."document_category" AS ENUM('disclosures', 'inspection', 'title', 'contracts', 'marketing', 'photos', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."document_status" AS ENUM('draft', 'pending_signature', 'signed', 'complete', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."integration_category" AS ENUM('email', 'calendar', 'documents', 'mls', 'marketing', 'financial', 'communication');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."integration_status" AS ENUM('connected', 'disconnected', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."interested_level" AS ENUM('very', 'somewhat', 'not');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."listing_phase" AS ENUM('onboarding', 'improvement', 'staging', 'content', 'marketing', 'showings', 'offers', 'contract', 'closing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."marketing_asset_status" AS ENUM('scheduled', 'in_production', 'complete', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."marketing_asset_type" AS ENUM('photo', 'video', 'floorplan', 'brochure', 'social_post', 'virtual_tour');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."offer_status" AS ENUM('received', 'reviewed', 'countered', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."quote_status" AS ENUM('requested', 'received', 'approved', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."team_member_role" AS ENUM('admin', 'listing_agent', 'tc', 'marketing', 'staging_lead');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "team_member_role" NOT NULL,
	"role_label" text,
	"avatar" text,
	"initials" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
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
CREATE TABLE IF NOT EXISTS "contacts" (
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
CREATE TABLE IF NOT EXISTS "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"price" real,
	"beds" integer,
	"baths" real,
	"sqft" integer,
	"lot_sqft" integer,
	"year_built" integer,
	"property_type" text,
	"mls_number" text,
	"description" text,
	"features" jsonb,
	"photo_url" text,
	"photos" jsonb,
	"lat" real,
	"lng" real,
	"phase" "listing_phase" DEFAULT 'onboarding' NOT NULL,
	"days_in_phase" integer DEFAULT 0,
	"days_on_market" integer DEFAULT 0,
	"list_date" timestamp,
	"target_list_date" timestamp,
	"agent_id" text,
	"client_id" text,
	"tasks_done" integer DEFAULT 0,
	"tasks_total" integer DEFAULT 0,
	"documents_count" integer DEFAULT 0,
	"showings_count" integer DEFAULT 0,
	"offers_count" integer DEFAULT 0,
	"zillow_views" integer DEFAULT 0,
	"zillow_saves" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"title" text NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"assignee_id" text,
	"phase" "listing_phase",
	"due_date" timestamp,
	"is_overdue" boolean DEFAULT false,
	"subtasks" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_items" (
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
CREATE TABLE IF NOT EXISTS "ai_insights" (
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
CREATE TABLE IF NOT EXISTS "showings" (
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
CREATE TABLE IF NOT EXISTS "offers" (
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
CREATE TABLE IF NOT EXISTS "quote_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"description" text,
	"amount" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotes" (
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
CREATE TABLE IF NOT EXISTS "vendors" (
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
CREATE TABLE IF NOT EXISTS "financial_budgets" (
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
CREATE TABLE IF NOT EXISTS "financial_categories" (
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
CREATE TABLE IF NOT EXISTS "documents" (
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
CREATE TABLE IF NOT EXISTS "comp_sales" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"address" text NOT NULL,
	"city" text,
	"price" real,
	"sqft" integer,
	"price_per_sqft" real,
	"beds" integer,
	"baths" real,
	"sale_date" timestamp,
	"days_on_market" integer,
	"distance" text,
	"adjusted_value" real,
	"adjustments" jsonb,
	"photo_url" text,
	"lat" real,
	"lng" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketing_assets" (
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
CREATE TABLE IF NOT EXISTS "integrations" (
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
CREATE TABLE IF NOT EXISTS "workflow_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"phase" "listing_phase" NOT NULL,
	"task_count" integer DEFAULT 0,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_agent_id_team_members_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_client_id_contacts_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_team_members_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_author_id_team_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "showings" ADD CONSTRAINT "showings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "showings" ADD CONSTRAINT "showings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "offers" ADD CONSTRAINT "offers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "offers" ADD CONSTRAINT "offers_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "vendors" ADD CONSTRAINT "vendors_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "financial_budgets" ADD CONSTRAINT "financial_budgets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "financial_budgets" ADD CONSTRAINT "financial_budgets_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_budget_id_financial_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."financial_budgets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "documents" ADD CONSTRAINT "documents_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "documents" ADD CONSTRAINT "documents_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_team_members_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "comp_sales" ADD CONSTRAINT "comp_sales_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "marketing_assets" ADD CONSTRAINT "marketing_assets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "marketing_assets" ADD CONSTRAINT "marketing_assets_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "integrations" ADD CONSTRAINT "integrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "integrations" ADD CONSTRAINT "integrations_connected_by_id_team_members_id_fk" FOREIGN KEY ("connected_by_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_email_idx" ON "team_members" USING btree ("team_id","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_team_id_idx" ON "contacts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_team_type_idx" ON "contacts" USING btree ("team_id","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_team_id_idx" ON "listings" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_team_phase_idx" ON "listings" USING btree ("team_id","phase");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_agent_id_idx" ON "listings" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_client_id_idx" ON "listings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_mls_number_idx" ON "listings" USING btree ("mls_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_team_id_idx" ON "tasks" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_listing_id_idx" ON "tasks" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_assignee_id_idx" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_team_status_idx" ON "tasks" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_items_team_id_idx" ON "activity_items" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_items_listing_id_idx" ON "activity_items" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_items_timestamp_idx" ON "activity_items" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_items_team_type_idx" ON "activity_items" USING btree ("team_id","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_insights_team_id_idx" ON "ai_insights" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_insights_listing_id_idx" ON "ai_insights" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_insights_team_dismissed_idx" ON "ai_insights" USING btree ("team_id","dismissed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "showings_team_id_idx" ON "showings" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "showings_listing_id_idx" ON "showings" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "showings_date_idx" ON "showings" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offers_team_id_idx" ON "offers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offers_listing_id_idx" ON "offers" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offers_team_status_idx" ON "offers" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quote_line_items_quote_id_idx" ON "quote_line_items" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quotes_team_id_idx" ON "quotes" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quotes_vendor_id_idx" ON "quotes" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quotes_listing_id_idx" ON "quotes" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quotes_team_status_idx" ON "quotes" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendors_team_id_idx" ON "vendors" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendors_team_category_idx" ON "vendors" USING btree ("team_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendors_email_idx" ON "vendors" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_budgets_team_id_idx" ON "financial_budgets" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_budgets_listing_id_idx" ON "financial_budgets" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_categories_budget_id_idx" ON "financial_categories" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_team_id_idx" ON "documents" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_listing_id_idx" ON "documents" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_team_category_idx" ON "documents" USING btree ("team_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_uploaded_by_id_idx" ON "documents" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comp_sales_team_id_idx" ON "comp_sales" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comp_sales_city_idx" ON "comp_sales" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketing_assets_team_id_idx" ON "marketing_assets" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketing_assets_listing_id_idx" ON "marketing_assets" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "marketing_assets_team_type_idx" ON "marketing_assets" USING btree ("team_id","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integrations_team_id_idx" ON "integrations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integrations_team_category_idx" ON "integrations" USING btree ("team_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_templates_team_id_idx" ON "workflow_templates" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_templates_team_phase_idx" ON "workflow_templates" USING btree ("team_id","phase");
