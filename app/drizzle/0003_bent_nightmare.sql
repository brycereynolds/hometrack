CREATE TABLE "field_note_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"field_note_id" text NOT NULL,
	"file_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"content_type" text NOT NULL,
	"file_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "field_note_attachments" ADD CONSTRAINT "field_note_attachments_field_note_id_field_notes_id_fk" FOREIGN KEY ("field_note_id") REFERENCES "public"."field_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_note_attachments_field_note_id_idx" ON "field_note_attachments" USING btree ("field_note_id");