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
ALTER TABLE "files" ADD CONSTRAINT "files_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_id_team_members_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "files_team_id_idx" ON "files" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "files_listing_id_idx" ON "files" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "files_contact_id_idx" ON "files" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "files_team_category_idx" ON "files" USING btree ("team_id","category");--> statement-breakpoint
CREATE INDEX "files_uploaded_by_id_idx" ON "files" USING btree ("uploaded_by_id");