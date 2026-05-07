CREATE TABLE "field_note_action_moments" (
	"id" text PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"moment_id" text NOT NULL,
	"relevance" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "field_notes" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "field_note_frames" ADD COLUMN "public_url" text;--> statement-breakpoint
ALTER TABLE "field_note_action_moments" ADD CONSTRAINT "field_note_action_moments_action_id_field_note_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."field_note_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_action_moments" ADD CONSTRAINT "field_note_action_moments_moment_id_field_note_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."field_note_moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_note_action_moments_action_id_idx" ON "field_note_action_moments" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "field_note_action_moments_moment_id_idx" ON "field_note_action_moments" USING btree ("moment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "field_note_action_moments_action_moment_idx" ON "field_note_action_moments" USING btree ("action_id","moment_id");--> statement-breakpoint

-- ============================================================
-- RLS + Grants for field_note_action_moments
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON field_note_action_moments TO authenticated;--> statement-breakpoint
ALTER TABLE field_note_action_moments ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- field_note_action_moments: indirect via field_note_actions → field_notes.team_id
CREATE POLICY "team_member_access" ON field_note_action_moments
  FOR ALL USING (
    action_id IN (
      SELECT a.id FROM field_note_actions a
      JOIN field_notes fn ON fn.id = a.field_note_id
      WHERE fn.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );