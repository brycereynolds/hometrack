ALTER TABLE "comp_listings" ADD COLUMN "property_id" text;--> statement-breakpoint
ALTER TABLE "comp_listings" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "comp_listings" ADD COLUMN "zip" text;--> statement-breakpoint
ALTER TABLE "comp_listings" ADD COLUMN "photos" jsonb;--> statement-breakpoint
ALTER TABLE "comp_listings" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "comp_listings" ADD CONSTRAINT "comp_listings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comp_listings_property_id_idx" ON "comp_listings" USING btree ("property_id");