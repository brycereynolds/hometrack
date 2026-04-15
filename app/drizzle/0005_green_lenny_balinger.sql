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
ALTER TABLE "listings" ADD COLUMN "property_id" text;--> statement-breakpoint
ALTER TABLE "external_listings" ADD CONSTRAINT "external_listings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_listings" ADD CONSTRAINT "external_listings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_preferences" ADD CONSTRAINT "buyer_preferences_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "buyer_preferences_is_active_idx" ON "buyer_preferences" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listings_property_id_idx" ON "listings" USING btree ("property_id");