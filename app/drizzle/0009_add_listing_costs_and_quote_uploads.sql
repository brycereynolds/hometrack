CREATE TYPE "public"."listing_cost_status" AS ENUM('estimated', 'quoted', 'committed', 'paid');--> statement-breakpoint
CREATE TABLE "listing_costs" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"task_id" text,
	"quote_id" text,
	"action_id" text,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"amount" real,
	"status" "listing_cost_status" DEFAULT 'estimated' NOT NULL,
	"receipt_path" text,
	"receipt_data" jsonb,
	"vendor_id" text,
	"paid_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "document_path" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "document_name" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "shared_with_client" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "client_review_status" text;--> statement-breakpoint
ALTER TABLE "listing_costs" ADD CONSTRAINT "listing_costs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_costs" ADD CONSTRAINT "listing_costs_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_costs" ADD CONSTRAINT "listing_costs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_costs" ADD CONSTRAINT "listing_costs_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_costs" ADD CONSTRAINT "listing_costs_action_id_field_note_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."field_note_actions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_costs" ADD CONSTRAINT "listing_costs_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listing_costs_team_id_idx" ON "listing_costs" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "listing_costs_listing_id_idx" ON "listing_costs" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "listing_costs_status_idx" ON "listing_costs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listing_costs_task_id_idx" ON "listing_costs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "listing_costs_quote_id_idx" ON "listing_costs" USING btree ("quote_id");--> statement-breakpoint

-- ============================================================
-- RLS + Grants for listing_costs
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON listing_costs TO authenticated;--> statement-breakpoint
ALTER TABLE listing_costs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "team_member_access" ON listing_costs
  FOR ALL USING (
    team_id IN (SELECT get_team_ids_for_user(auth.uid()))
  );