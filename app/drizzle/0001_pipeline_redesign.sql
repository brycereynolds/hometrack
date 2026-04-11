-- Migration: Pipeline redesign from 9 phases to 4-stage model
-- Old phases: onboarding, improvement, staging, content, marketing, showings, offers, contract, closing
-- New phases: pre_market, active, closed, canceled

-- Step 1: Create the new task_category enum
CREATE TYPE "public"."task_category" AS ENUM('onboarding', 'improvements', 'disclosures', 'staging', 'media', 'pricing', 'marketing', 'showings', 'offers', 'escrow', 'general');--> statement-breakpoint

-- Step 2: Add new columns to listings
ALTER TABLE "listings" ADD COLUMN "under_contract" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "listing_agreement_date" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "close_date" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "cancel_reason" text;--> statement-breakpoint

-- Step 3: Add task_category column to tasks
ALTER TABLE "tasks" ADD COLUMN "task_category" "task_category";--> statement-breakpoint

-- Step 4: Add task_category column to workflow_templates
ALTER TABLE "workflow_templates" ADD COLUMN "task_category" "task_category";--> statement-breakpoint

-- Step 5: Map old task phases to new task categories
UPDATE "tasks" SET "task_category" = 'onboarding' WHERE "phase" = 'onboarding';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'improvements' WHERE "phase" = 'improvement';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'staging' WHERE "phase" = 'staging';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'media' WHERE "phase" = 'content';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'marketing' WHERE "phase" = 'marketing';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'showings' WHERE "phase" = 'showings';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'offers' WHERE "phase" = 'offers';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'escrow' WHERE "phase" = 'contract';--> statement-breakpoint
UPDATE "tasks" SET "task_category" = 'escrow' WHERE "phase" = 'closing';--> statement-breakpoint

-- Step 6: Map old workflow template phases to new task categories
UPDATE "workflow_templates" SET "task_category" = 'onboarding' WHERE "phase" = 'onboarding';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'improvements' WHERE "phase" = 'improvement';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'staging' WHERE "phase" = 'staging';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'media' WHERE "phase" = 'content';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'marketing' WHERE "phase" = 'marketing';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'showings' WHERE "phase" = 'showings';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'offers' WHERE "phase" = 'offers';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'escrow' WHERE "phase" = 'contract';--> statement-breakpoint
UPDATE "workflow_templates" SET "task_category" = 'escrow' WHERE "phase" = 'closing';--> statement-breakpoint

-- Step 7: Set underContract for listings in 'contract' phase before migrating
UPDATE "listings" SET "under_contract" = true WHERE "phase" = 'contract';--> statement-breakpoint

-- Step 8: Rename the old enum and create the new one, then migrate data
-- We need to: create new enum, update columns, drop old enum
ALTER TYPE "public"."listing_phase" RENAME TO "listing_phase_old";--> statement-breakpoint
CREATE TYPE "public"."listing_phase" AS ENUM('pre_market', 'active', 'closed', 'canceled');--> statement-breakpoint

-- Step 9: Migrate listing phases - add temp column, populate, swap
ALTER TABLE "listings" ALTER COLUMN "phase" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "phase" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "phase_new" "public"."listing_phase";--> statement-breakpoint

UPDATE "listings" SET "phase_new" = 'pre_market' WHERE "phase"::text IN ('onboarding', 'improvement', 'staging', 'content');--> statement-breakpoint
UPDATE "listings" SET "phase_new" = 'active' WHERE "phase"::text IN ('marketing', 'showings', 'offers', 'contract');--> statement-breakpoint
UPDATE "listings" SET "phase_new" = 'closed' WHERE "phase"::text = 'closing';--> statement-breakpoint

ALTER TABLE "listings" DROP COLUMN "phase";--> statement-breakpoint
ALTER TABLE "listings" RENAME COLUMN "phase_new" TO "phase";--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "phase" SET DEFAULT 'pre_market';--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "phase" SET NOT NULL;--> statement-breakpoint

-- Step 10: Migrate task phase column
ALTER TABLE "tasks" ALTER COLUMN "phase" TYPE text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "phase_new" "public"."listing_phase";--> statement-breakpoint

UPDATE "tasks" SET "phase_new" = 'pre_market' WHERE "phase" IN ('onboarding', 'improvement', 'staging', 'content');--> statement-breakpoint
UPDATE "tasks" SET "phase_new" = 'active' WHERE "phase" IN ('marketing', 'showings', 'offers', 'contract');--> statement-breakpoint
UPDATE "tasks" SET "phase_new" = 'closed' WHERE "phase" = 'closing';--> statement-breakpoint

ALTER TABLE "tasks" DROP COLUMN "phase";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "phase_new" TO "phase";--> statement-breakpoint

-- Step 11: Migrate workflow_templates phase column
ALTER TABLE "workflow_templates" ALTER COLUMN "phase" TYPE text;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD COLUMN "phase_new" "public"."listing_phase" NOT NULL DEFAULT 'pre_market';--> statement-breakpoint

UPDATE "workflow_templates" SET "phase_new" = 'pre_market' WHERE "phase" IN ('onboarding', 'improvement', 'staging', 'content');--> statement-breakpoint
UPDATE "workflow_templates" SET "phase_new" = 'active' WHERE "phase" IN ('marketing', 'showings', 'offers', 'contract');--> statement-breakpoint
UPDATE "workflow_templates" SET "phase_new" = 'closed' WHERE "phase" = 'closing';--> statement-breakpoint

ALTER TABLE "workflow_templates" DROP COLUMN "phase";--> statement-breakpoint
ALTER TABLE "workflow_templates" RENAME COLUMN "phase_new" TO "phase";--> statement-breakpoint
ALTER TABLE "workflow_templates" ALTER COLUMN "phase" DROP DEFAULT;--> statement-breakpoint

-- Step 12: Drop the old enum
DROP TYPE "public"."listing_phase_old";--> statement-breakpoint

-- Step 13: Recreate indexes that reference the phase column
DROP INDEX IF EXISTS "listings_team_phase_idx";--> statement-breakpoint
CREATE INDEX "listings_team_phase_idx" ON "listings" USING btree ("team_id","phase");--> statement-breakpoint
DROP INDEX IF EXISTS "workflow_templates_team_phase_idx";--> statement-breakpoint
CREATE INDEX "workflow_templates_team_phase_idx" ON "workflow_templates" USING btree ("team_id","phase");
