CREATE TYPE "public"."task_category" AS ENUM('onboarding', 'improvements', 'disclosures', 'staging', 'media', 'pricing', 'marketing', 'showings', 'offers', 'escrow', 'general');--> statement-breakpoint
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
ALTER TABLE "listings" ALTER COLUMN "phase" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "phase" SET DEFAULT 'pre_market'::text;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "phase" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_templates" ALTER COLUMN "phase" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."listing_phase";--> statement-breakpoint
CREATE TYPE "public"."listing_phase" AS ENUM('pre_market', 'active', 'closed', 'canceled');--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "phase" SET DEFAULT 'pre_market'::"public"."listing_phase";--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "phase" SET DATA TYPE "public"."listing_phase" USING "phase"::"public"."listing_phase";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "phase" SET DATA TYPE "public"."listing_phase" USING "phase"::"public"."listing_phase";--> statement-breakpoint
ALTER TABLE "workflow_templates" ALTER COLUMN "phase" SET DATA TYPE "public"."listing_phase" USING "phase"::"public"."listing_phase";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "under_contract" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "listing_agreement_date" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "close_date" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "task_category" "task_category";--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "task_category" "task_category";--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_showings" ADD CONSTRAINT "analytics_showings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_metrics" ADD CONSTRAINT "pipeline_metrics_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_performance" ADD CONSTRAINT "team_performance_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_listing_id_idx" ON "analytics_events" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "analytics_events_date_idx" ON "analytics_events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "analytics_events_listing_date_idx" ON "analytics_events" USING btree ("listing_id","date");--> statement-breakpoint
CREATE INDEX "analytics_showings_listing_id_idx" ON "analytics_showings" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "analytics_showings_date_idx" ON "analytics_showings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "pipeline_metrics_team_id_idx" ON "pipeline_metrics" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "pipeline_metrics_date_idx" ON "pipeline_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "team_performance_member_id_idx" ON "team_performance" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "team_performance_period_idx" ON "team_performance" USING btree ("period","period_start");