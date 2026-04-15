CREATE TYPE "public"."market_analysis_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
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
	"source" text NOT NULL,
	"external_id" text,
	"address" text,
	"city" text,
	"price" real,
	"price_per_sqft" real,
	"beds" integer,
	"baths" real,
	"sqft" integer,
	"lot_sqft" integer,
	"year_built" integer,
	"sold_date" timestamp,
	"days_on_market" integer,
	"status" text,
	"distance_miles" real,
	"lat" real,
	"lng" real,
	"photo_url" text,
	"adjustments" jsonb,
	"property_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "analysis_schedules" ADD CONSTRAINT "analysis_schedules_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comp_listings" ADD CONSTRAINT "comp_listings_market_analysis_id_market_analyses_id_fk" FOREIGN KEY ("market_analysis_id") REFERENCES "public"."market_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_analyses" ADD CONSTRAINT "market_analyses_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_schedules_listing_id_idx" ON "analysis_schedules" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "comp_listings_analysis_id_idx" ON "comp_listings" USING btree ("market_analysis_id");--> statement-breakpoint
CREATE INDEX "market_analyses_listing_id_idx" ON "market_analyses" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "market_analyses_status_idx" ON "market_analyses" USING btree ("status");