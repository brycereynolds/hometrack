CREATE TYPE "public"."field_note_action_status" AS ENUM('suggested', 'accepted', 'dismissed', 'task_created');--> statement-breakpoint
CREATE TYPE "public"."field_note_media_type" AS ENUM('video', 'voice_memo', 'text', 'photo');--> statement-breakpoint
CREATE TYPE "public"."field_note_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."note_tag" AS ENUM('showing', 'vendor', 'client', 'general');--> statement-breakpoint
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
ALTER TABLE "tasks" ADD COLUMN "source_field_note_action_id" text;--> statement-breakpoint
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
ALTER TABLE "field_note_actions" ADD CONSTRAINT "field_note_actions_linked_task_id_tasks_id_fk" FOREIGN KEY ("linked_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_source_field_note_action_id_field_note_actions_id_fk" FOREIGN KEY ("source_field_note_action_id") REFERENCES "public"."field_note_actions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- RLS + permissions for field notes tables
ALTER TABLE field_notes ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE field_note_transcripts ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE field_note_frames ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE field_note_moments ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE field_note_actions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "team_member_access" ON field_notes FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));--> statement-breakpoint
CREATE POLICY "team_member_access" ON field_note_transcripts FOR ALL USING (field_note_id IN (SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))));--> statement-breakpoint
CREATE POLICY "team_member_access" ON field_note_frames FOR ALL USING (field_note_id IN (SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))));--> statement-breakpoint
CREATE POLICY "team_member_access" ON field_note_moments FOR ALL USING (field_note_id IN (SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))));--> statement-breakpoint
CREATE POLICY "team_member_access" ON field_note_actions FOR ALL USING (field_note_id IN (SELECT id FROM field_notes WHERE team_id IN (SELECT get_team_ids_for_user(auth.uid()))));--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;--> statement-breakpoint
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;