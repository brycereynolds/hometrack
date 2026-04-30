CREATE TABLE "field_note_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"field_note_id" text NOT NULL,
	"action_id" text,
	"parent_id" text,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"mentions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "field_note_comments" ADD CONSTRAINT "field_note_comments_field_note_id_field_notes_id_fk" FOREIGN KEY ("field_note_id") REFERENCES "public"."field_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_comments" ADD CONSTRAINT "field_note_comments_action_id_field_note_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."field_note_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_note_comments" ADD CONSTRAINT "field_note_comments_author_id_team_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_note_comments_field_note_id_idx" ON "field_note_comments" USING btree ("field_note_id");--> statement-breakpoint
CREATE INDEX "field_note_comments_action_id_idx" ON "field_note_comments" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "field_note_comments_parent_id_idx" ON "field_note_comments" USING btree ("parent_id");