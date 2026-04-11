-- Migration: Pipeline redesign from 9 phases to 4-stage model
-- Old phases: onboarding, improvement, staging, content, marketing, showings, offers, contract, closing
-- New phases: pre_market, active, closed, canceled
-- Idempotent: safe to run multiple times without error

-- Step 1: Create the new task_category enum
DO $$ BEGIN
  CREATE TYPE "public"."task_category" AS ENUM('onboarding', 'improvements', 'disclosures', 'staging', 'media', 'pricing', 'marketing', 'showings', 'offers', 'escrow', 'general');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

-- Step 2: Add new columns to listings (IF NOT EXISTS)
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "under_contract" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "listing_agreement_date" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "close_date" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "cancel_reason" text;--> statement-breakpoint

-- Step 3: Add task_category column to tasks
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "task_category" "task_category";--> statement-breakpoint

-- Step 4: Add task_category column to workflow_templates
ALTER TABLE "workflow_templates" ADD COLUMN IF NOT EXISTS "task_category" "task_category";--> statement-breakpoint

-- Step 5: Map old task phases to new task categories (safe: UPDATE with WHERE is idempotent)
UPDATE "tasks" SET "task_category" = 'onboarding' WHERE "task_category" IS NULL AND "phase"::text = 'onboarding';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'improvements' WHERE "task_category" IS NULL AND "phase"::text = 'improvement';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'staging' WHERE "task_category" IS NULL AND "phase"::text = 'staging';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'media' WHERE "task_category" IS NULL AND "phase"::text = 'content';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'marketing' WHERE "task_category" IS NULL AND "phase"::text = 'marketing';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'showings' WHERE "task_category" IS NULL AND "phase"::text = 'showings';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'offers' WHERE "task_category" IS NULL AND "phase"::text = 'offers';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'escrow' WHERE "task_category" IS NULL AND "phase"::text = 'contract';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'escrow' WHERE "task_category" IS NULL AND "phase"::text = 'closing';--> statement-breakpoint

-- Step 6: Map old workflow template phases to new task categories
UPDATE "workflow_templates" SET "task_category" = 'onboarding' WHERE "task_category" IS NULL AND "phase"::text = 'onboarding';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'improvements' WHERE "task_category" IS NULL AND "phase"::text = 'improvement';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'staging' WHERE "task_category" IS NULL AND "phase"::text = 'staging';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'media' WHERE "task_category" IS NULL AND "phase"::text = 'content';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'marketing' WHERE "task_category" IS NULL AND "phase"::text = 'marketing';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'showings' WHERE "task_category" IS NULL AND "phase"::text = 'showings';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'offers' WHERE "task_category" IS NULL AND "phase"::text = 'offers';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'escrow' WHERE "task_category" IS NULL AND "phase"::text = 'contract';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'escrow' WHERE "task_category" IS NULL AND "phase"::text = 'closing';--> statement-breakpoint

-- Step 7: Set underContract for listings in 'contract' phase before migrating
UPDATE "listings" SET "under_contract" = true WHERE "phase"::text = 'contract' AND "under_contract" = false;--> statement-breakpoint

-- Steps 8-12: Enum migration (listing_phase old -> new)
-- This block is wrapped in a DO block that checks if migration is needed
DO $$
BEGIN
  -- Check if the old enum values still exist (i.e., migration hasn't run yet)
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'listing_phase' AND e.enumlabel = 'onboarding'
  ) THEN
    -- Step 8: Rename the old enum and create the new one
    ALTER TYPE "public"."listing_phase" RENAME TO "listing_phase_old";
    CREATE TYPE "public"."listing_phase" AS ENUM('pre_market', 'active', 'closed', 'canceled');

    -- Step 9: Migrate listing phases - add temp column, populate, swap
    ALTER TABLE "listings" ALTER COLUMN "phase" DROP DEFAULT;
    ALTER TABLE "listings" ALTER COLUMN "phase" DROP NOT NULL;
    ALTER TABLE "listings" ADD COLUMN "phase_new" "public"."listing_phase";

    UPDATE "listings" SET "phase_new" = 'pre_market' WHERE "phase"::text IN ('onboarding', 'improvement', 'staging', 'content');
    UPDATE "listings" SET "phase_new" = 'active' WHERE "phase"::text IN ('marketing', 'showings', 'offers', 'contract');
    UPDATE "listings" SET "phase_new" = 'closed' WHERE "phase"::text = 'closing';

    ALTER TABLE "listings" DROP COLUMN "phase";
    ALTER TABLE "listings" RENAME COLUMN "phase_new" TO "phase";
    ALTER TABLE "listings" ALTER COLUMN "phase" SET DEFAULT 'pre_market';
    ALTER TABLE "listings" ALTER COLUMN "phase" SET NOT NULL;

    -- Step 10: Migrate task phase column
    ALTER TABLE "tasks" ALTER COLUMN "phase" TYPE text;
    ALTER TABLE "tasks" ADD COLUMN "phase_new" "public"."listing_phase";

    UPDATE "tasks" SET "phase_new" = 'pre_market' WHERE "phase" IN ('onboarding', 'improvement', 'staging', 'content');
    UPDATE "tasks" SET "phase_new" = 'active' WHERE "phase" IN ('marketing', 'showings', 'offers', 'contract');
    UPDATE "tasks" SET "phase_new" = 'closed' WHERE "phase" = 'closing';

    ALTER TABLE "tasks" DROP COLUMN "phase";
    ALTER TABLE "tasks" RENAME COLUMN "phase_new" TO "phase";

    -- Step 11: Migrate workflow_templates phase column
    ALTER TABLE "workflow_templates" ALTER COLUMN "phase" TYPE text;
    ALTER TABLE "workflow_templates" ADD COLUMN "phase_new" "public"."listing_phase" NOT NULL DEFAULT 'pre_market';

    UPDATE "workflow_templates" SET "phase_new" = 'pre_market' WHERE "phase" IN ('onboarding', 'improvement', 'staging', 'content');
    UPDATE "workflow_templates" SET "phase_new" = 'active' WHERE "phase" IN ('marketing', 'showings', 'offers', 'contract');
    UPDATE "workflow_templates" SET "phase_new" = 'closed' WHERE "phase" = 'closing';

    ALTER TABLE "workflow_templates" DROP COLUMN "phase";
    ALTER TABLE "workflow_templates" RENAME COLUMN "phase_new" TO "phase";
    ALTER TABLE "workflow_templates" ALTER COLUMN "phase" DROP DEFAULT;

    -- Step 12: Drop the old enum
    DROP TYPE "public"."listing_phase_old";
  END IF;
END $$;--> statement-breakpoint

-- Step 13: Recreate indexes that reference the phase column (IF NOT EXISTS)
DROP INDEX IF EXISTS "listings_team_phase_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_team_phase_idx" ON "listings" USING btree ("team_id","phase");--> statement-breakpoint
DROP INDEX IF EXISTS "workflow_templates_team_phase_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_templates_team_phase_idx" ON "workflow_templates" USING btree ("team_id","phase");
