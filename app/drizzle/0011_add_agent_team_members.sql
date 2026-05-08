ALTER TABLE "integrations" ADD COLUMN "config" jsonb;--> statement-breakpoint
ALTER TYPE "public"."team_member_role" ADD VALUE 'agent';--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "is_agent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "agent_type" text;