ALTER TABLE "tasks" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "task_id" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quotes_task_id_idx" ON "quotes" USING btree ("task_id");