# HomeTrack Changelog

## 2026-05-03 — Video Processing Pipeline End-to-End

### Upload & Storage
- Fixed TUS proxy logging (removed per-chunk spam, kept start/complete/error)
- Fixed double `field-media/` prefix in storage path sent to Temporal workflow
- Fixed Supabase Storage env vars on dev environment (was uploading to wrong Kong)
- Confirmed storage stack works: TUS → Kong → Storage Service → MinIO (S3)

### Temporal Video Processing Pipeline
- Full 9-step pipeline working end-to-end: download → extract audio → extract frames → transcribe → key moments → vision correlation → enriched transcript → insights → save results
- Frames uploaded to Supabase Storage (not base64 in Temporal payload — was hitting 2MB limit)
- `correlate_frames` downloads frames from storage for Claude vision API
- All Anthropic calls routed through TokenTap with workflow ID as trace/session
- All models updated to `claude-sonnet-4-6`
- Pydantic models accept camelCase via aliases (`populate_by_name=True`)
- Retry policy: max 3 attempts per activity
- `fieldNoteId` metadata lookup handles both camelCase and snake_case

### Processing Stages
- New `update_processing_stage` activity writes granular stage updates to `field_notes.processing_stages` jsonb
- 7 stages: Preparing media → Extracting audio & frames → Transcribing speech → Identifying key moments → Matching visuals → Generating insights → Finalizing
- UI shows single progress bar with active step name, step count, and percentage
- Page server checks Temporal workflow status on poll — auto-detects cancelled/failed workflows

### Retry Processing
- "Retry" button on failed notes — resets status, deletes old child records (transcripts, frames, moments, actions), re-triggers workflow
- `/api/field-notes/[noteId]/retry` endpoint with proper cleanup

### Note Detail Page
- Video player: skeleton loader while signed URL loads, capped at 500px height
- Signed URL fetched once (no re-fetch on poll), video doesn't flash during polling
- Frame images use signed URLs via `/api/field-notes/{id}/frames` endpoint
- Enriched transcript rendered as HTML via `marked()` (was showing raw markdown)
- Failed state: soft muted banner instead of alarming red

### Bug Fixes
- `transcribe.py`: `seg.start` not `seg["start"]` (OpenAI returns objects, not dicts)
- `download_media.py`: hardcoded bucket to `field-media` (was parsing first path segment as bucket)
- `save_results.py`: uses frame storage paths directly (no base64 decoding)
- TokenTap base_url: removed `/v1` suffix (Python SDK adds it automatically)
- Workflow status check covers both `pending` and `processing` status

## 2026-04-30 — Map Search, Notes Consolidation, AI Chat, Upload Infrastructure

### Map Search Features
- Draggable radius circle with "Move Radius" toggle button (pan-first by default)
- Polygon drawing mode with leaflet-draw and point-in-polygon filtering
- `searchArea` JSONB column on listings — persisted and restored on page load
- Analysis modal adapts to search mode (radius slider vs polygon info)

### Notes System Consolidation
- Top-level `/notes` page showing all notes across all listings with filters
- Standalone `/notes/[noteId]` detail page for unattached notes
- "Notes" added to sidebar navigation
- CaptureModal: removed tags (AI handles categorization), allows attachment-only saves
- Post-save success state with "View Details" / "Capture Another" buttons
- `field_note_attachments` table — one note can have many files
- `field_note_comments` table — threaded comments with @mentions
- Processing status banner with 4-stage progress bar and auto-polling
- Attachment display on detail pages with file type icons and sizes
- Mobile field notes page modernized (drag-and-drop, signed URL uploads, card-style attachments)
- PDF support added to file picker and server validation

### AI Chat Agent
- `/chat` page with streaming responses via Token Tap LLM proxy
- Floating chat FAB (bottom-right) on every page
- Chat history with conversation list dropdown
- System prompt built with full team context
- Read-only agent (no tool use yet — won't hallucinate actions)
- `chat_conversations` + `chat_messages` tables
- Token Tap tracing: one trace per conversation

### Upload Infrastructure
- Direct client uploads via signed URLs (bypasses SvelteKit server)
- TUS resumable uploads implemented (6MB chunks, auto-retry, resume)
- Upload progress bar with real-time percentage
- Navigation guard during uploads (beforeNavigate + beforeunload)
- `BODY_SIZE_LIMIT=10GB` for adapter-node
- Storage buckets created: field-media (10GB), voice-memos (500MB), documents (50MB)

### Type Safety
- Fixed all 89 svelte-check errors → 0 errors, 0 warnings
- Central `$lib/types.ts` with composite types (no `as any` scattered)
- `WithoutChildrenOrChild` types for shadcn-svelte v5

### Responsive & UX
- Tab breakpoint md→lg on listing detail pages
- CaptureModal widened to sm:max-w-lg
- Attachment preview redesigned as card rows
- Landing page: real avatars + "thousands of real estate teams"
- Drag-and-drop on CaptureModal (whole dialog is drop target)

### Known Issues (Carried Forward)
- TUS uploads not yet confirmed working end-to-end (auth/CORS issue suspected)
- CaptureModal positioning may be broken (appears at bottom of window)
- Auto-navigation fires before uploads complete
- Supabase Studio doesn't show nested folders in bucket browser (files ARE there)
- `UPLOAD_FILE_SIZE_LIMIT_STANDARD` env var may not be taking effect on Storage service

---

## 2026-04-10 — Initial Build

### Frontend Mockup (Complete)

Built a 49-page interactive SvelteKit application showcasing the full HomeTrack product vision.

**Tech Stack:**
- SvelteKit 2.57 with Svelte 5 (runes mode)
- shadcn-svelte (nova style, stone base) via bits-ui
- Tailwind CSS v4 with oklch color system
- Chart.js for analytics and financial charts
- Leaflet.js for interactive map views
- lucide-svelte for icons

**Design System:**
- Terracotta primary (#C4704B), sage secondary (#7B8B6F)
- DM Serif Display headings, Inter body text
- Warm off-white backgrounds with full dark mode support
- 9 pipeline phase colors, status badge system

**Pages Built (49 total):**

| Route Group | Pages | Highlights |
|---|---|---|
| Dashboard | 1 | Pipeline overview, task list, activity feed, AI alerts, team workload chart |
| Listings | 15 | Pipeline board (Kanban), list view, map view (Leaflet), new listing wizard, detail view with 10 tabs (overview, activity, tasks, documents, financials, marketing, showings, offers, analytics, portal settings) |
| Contacts | 5 | All contacts, clients, agent network, agent intelligence, contact detail |
| Vendors | 3 | Directory, vendor detail with cost charts, quote management |
| Analytics | 4 | Overview with pipeline charts, listing performance, team metrics, AI insights |
| Settings | 7 | Team, integrations, workflows, notifications, billing, branding, data management |
| Mobile | 5 | Voice memo, field notes, showing feedback, open house check-in, quick task |
| Portal | 4 | Client dashboard, approvals, documents, messages |
| Auth | 5 | Email/password login, signup, invite flow, invite acceptance, logout |
| Other | 1 | Design system preview |

**Shared Components (17):** AppLayout, AuthLayout, PortalLayout, Sidebar, MobileBottomNav, PageHeader, Breadcrumbs, MetricCard, ListingCard, ContactCard, PhaseBadge, StatusBadge, ActivityFeedItem, AIInsightCard, EmptyState, DataTable, ListingDetailTabs

**Mock Data:** 8 listings with real Unsplash photos and Bay Area coordinates, 12 contacts, 12 tasks, 6 vendors, 5 offers, 5 showings, 10 marketing assets, 8 integrations, 10 workflow templates, time-series chart data.

---

### Database Schema (Complete)

Added Drizzle ORM with full PostgreSQL schema matching the frontend data model.

**19 Tables** (later expanded to 24 with analytics and files tables — see 2026-04-11 entries)**:**
- Core: `teams`, `team_members`
- Listings: `listings`, `tasks`, `activity_items`, `documents`, `showings`, `offers`, `marketing_assets`
- People: `contacts`
- Vendors: `vendors`, `quotes`, `quote_line_items`
- Financials: `financial_budgets`, `financial_categories`
- Intelligence: `ai_insights`, `comp_sales`
- Config: `integrations`, `workflow_templates`

**17 Enum Types:** listing_phase, task_category, task_status, task_priority, contact_type, activity_type, ai_insight_type, offer_status, document_category, document_status, interested_level, team_member_role, marketing_asset_type, marketing_asset_status, quote_status, integration_status, integration_category

**Key Design Decisions:**
- UUID primary keys on all tables
- Multi-tenant via `teamId` on every table with composite indexes
- Cascade delete for parent-child relationships
- JSONB for semi-structured data (photos, subtasks, contingencies, metrics)
- `createdAt`/`updatedAt` timestamps on all tables
- Switched to `@sveltejs/adapter-node` for Railway deployment

**Migration:** `drizzle/0000_many_madrox.sql` generated and ready to run.

---

### Data Access Layer (Complete)

- **Seed script** (`src/lib/server/db/seed.ts`) — Maps all mock data into database inserts with proper FK references and ID mapping. Run with `npm run db:seed`.
- **Query layer** (`src/lib/server/db/queries/`) — Typed query functions: team, listings (with agent/client relations), contacts (with type filtering), tasks (with overdue detection), dashboard (aggregated pipeline value, activity, insights)
- **Server load functions** — `+layout.server.ts` for team context, `+page.server.ts` for dashboard, listings, contacts, listing detail. All gracefully fall back to null/empty when no DB connected.

---

## 2026-04-11 — Pipeline Redesign, Supabase Integration, UI Overhaul

### Pipeline Redesign

- Replaced 9-stage pipeline with 4 stages: Pre-Market, Active, Closed, Canceled
- Tasks within stages are parallel attributes, not sequential gates
- "Under Contract" is a boolean badge on Active listings, not a column
- Database schema migration (`0001_pipeline_redesign.sql`)
- Responsive Kanban board: 4 columns desktop, 2x2 tablet, tabbed mobile
- Drag-and-drop for phase changes and reordering via svelte-dnd-action

### UI Improvements

- Removed all "AI" labels from UI (30 edits, 16 files)
- Fixed 16 UI bugs (white-on-white buttons, missing modals, calendar styling, nav issues)
- Added Cmd+K command palette using shadcn-svelte Command component
- My Tasks widget: merged Today/Upcoming, added calendar and reminder actions
- Added voice memo, quick note, add contact, add vendor modals

### Data Layer

- Expanded workflow templates: 10 → 13 templates, 118 realistic tasks
- Added 4 analytics tables (events, showings, pipeline metrics, team performance)
- Removed all hardcoded time-series data from mock-data.ts
- Added files table with storage path and access levels
- Comprehensive seed script with production guard and truncate-before-insert

### Infrastructure

- Created dev branch with GitHub Flow branching model
- Added `db:reset` script (push schema + seed)
- Supabase integration: client utilities, storage layer (`@supabase/supabase-js`)
- Self-hosted Supabase deployed on Railway (Postgres, Auth, Storage, Realtime, Studio, Kong)
- Google OAuth configured on GoTrue
- Postmark SMTP configured for magic links
- Kong API gateway with basic auth for Studio access

### Domain Search

- Domain scout tool updated with Cloudflare-supported TLDs
- 200+ domain combinations checked across multiple strategies
- Top candidates identified: Norlo, Sulva, Kova, Nolva, Fova (warm/premium vibe)

---

## 2026-04-11 — Drizzle + Supabase RLS for Multi-Tenant Security

### Authentication

- Created `hooks.server.ts` — extracts JWT from `sb-access-token` cookie or `Authorization` header, verifies via GoTrue `getUser()`, populates `event.locals.user`
- Extended `App.Locals` with typed `user` and `accessToken` properties
- Login/signup pages with email/password via GoTrue (`(auth)/login`, `(auth)/signup`)
- Logout endpoint clears cookies and redirects (`(auth)/logout`)
- Cookie strategy: `httpOnly`, `secure`, `sameSite=lax` for access and refresh tokens

### Row-Level Security (RLS)

- Added `userId` column to `team_members` linking GoTrue `auth.users` to team membership
- Created `get_team_ids_for_user()` SECURITY DEFINER function for RLS policy lookups
- RLS enabled on all 24 tables with policies using `auth.uid()`:
  - Pattern A: 19 tables with direct `team_id` column
  - Pattern B: 3 tables via parent FK (analytics → listings, team_performance → team_members)
  - Pattern C: 2 grandchild tables (financial_categories → budgets, quote_line_items → quotes)
- Migration: `drizzle/0001_rls_policies.sql` (clean regeneration from single schema migration)

### Dual Drizzle Clients

- `adminDb` — bypasses RLS, used for seeding, migrations, background jobs
- `withRLS(userId, role, fn)` — wraps queries in a transaction that sets Postgres session variables (`request.jwt.claim.sub`, `SET LOCAL ROLE authenticated`) so RLS policies apply
- `prepare: false` on RLS connection (required for `SET LOCAL ROLE` in transaction mode)
- All 6 query files accept optional `db` parameter (defaults to `adminDb` for backward compat)

### Route Handler Updates

- Root layout now requires auth, redirects to `/login` if unauthenticated
- All 10 route handlers wrapped in `withRLS()` for RLS-enforced queries
- Fixed 5 routes that bypassed `parent()` for team context (analytics, showings)
- Added `"start": "node build"` to package.json for Railway deployment

### Architecture Decision

Using Drizzle + Supabase together (not one or the other):
- **Drizzle** for type-safe server-side data queries with RLS enforcement
- **Supabase JS client** for Storage (file uploads), Auth (GoTrue), and Realtime (planned)
- RLS is belt-and-suspenders: app-level `teamId` filtering + database-level policy enforcement

---

## 2026-04-13 — Mock Data Removal, Security Hardening, Dev Workflow

### Mock Data Removal
- Deleted `mock-data.ts` (3,892 lines) — all 49 pages now query the database
- Created 28 new `+page.server.ts` load functions across all route groups
- Added 11 new Drizzle query functions (listings detail, contacts)
- Shared modules: `config.ts` (constants), `types.ts` (Drizzle-inferred), `utils.ts` (formatters)
- Shared components accept data via props instead of importing mock arrays

### Security Hardening
- `withRLS()` validates userId (non-empty) and role (whitelist: authenticated/anon)
- `auth.uid()` returns NULL on missing JWT (not all-zeros UUID)
- `team_members.user_id` changed from `text` to `uuid` — proper FK to `auth.users`
- Logout endpoint changed from GET to POST
- Standalone index on `team_members.user_id` for RLS query performance
- Graceful error handling for missing Supabase env vars in auth routes
- SvelteKit `$env/dynamic/private` for env vars (not `process.env`)

### Dev Workflow
- `db:wipe` — drops public + drizzle schemas (refuses in production)
- `db:reset` — wipe → migrate → seed (full 0→1 cycle)
- `db:seed` auto-creates GoTrue user from `SEED_USER_EMAIL`/`SEED_USER_PASSWORD` env vars
- All db scripts use `node --env-file=.env` for consistent env loading
- Clean migration regeneration: `0000_common_riptide.sql` (schema) + `0001_rls_policies.sql` (RLS)
- Demo org: Reynolds Realty with admin user Bryce Reynolds

### Fixes
- Fixed favicon.ico routing to portal `[team]` catch-all
- Fixed `drizzle.config.ts` env loading for migrations
- Expanded seed data: all 8 listings have financials, documents, showings, marketing

---

## 2026-04-14 — End-to-End Product Build

### Core CRUD (Phase 1-2)
- Create/edit listings, tasks, contacts, vendors, offers, showings
- Task status toggle, subtask toggle, kanban drag-and-drop persistence
- Document upload via Supabase Storage
- Quote approve/decline flow
- Activity note posting

### Mobile & Field Capture
- Voice memo recording with MediaRecorder API + Supabase Storage upload
- Field notes with photo/video attachments
- Showing feedback persistence
- Open house digital check-in + tablet view with QR codes
- Quick task status toggles on mobile

### Intelligence Pipeline
- Temporal worker (Python) with 9-stage video processing pipeline
- Frame extraction, Whisper transcription, speaker diarization
- Claude vision frame-moment correlation with scrub windows
- AI insight extraction (action items, observations, decisions, quotes)
- Media-type-aware processing (video vs voice vs text)

### Field Notes System
- 5 new database tables (field_notes, transcripts, frames, moments, actions)
- Field notes tab in listing detail with list + detail views
- Processing status polling with stage-aware labels
- Action item lifecycle (suggested → accepted → task created)
- Video player with frame gallery

### UX Infrastructure
- Toast notification system (svelte-sonner)
- Custom error pages (404, 500)
- Page transition loading indicator
- Unified Command Palette (Cmd+K) with search + quick actions
- Voice memo + quick note modals from any page
- Floating voice button (FAB) on every page
- Autocomplete/combobox component replacing native selects
- Global search (listings, contacts, vendors, tasks, team members)
- HTTPS local dev via mkcert

### Communications
- Twilio SMS integration
- Postmark email integration
- Portal invite emails with branded HTML template
- Phase change notifications (email + SMS based on settings)

### Client Portal
- Portal settings persist to database (sections, document sharing, notifications)
- Portal pages respect saved settings (hide/show sections, filter documents)
- Branding preview shows single-property client view
- Approval workflow (approve/decline offers + quotes)
- Document viewer with signed URL downloads

### Marketing Landing Page
- Single-scroll marketing page at root route
- Hero, features, how it works, pricing, testimonial, footer
- Pricing: Free ($0) / Starter ($99) / Professional ($299)
- Scroll animations, fully responsive

### Settings
- All settings persist: branding, notifications, workflows, portal
- Team invite + remove member
- Create custom workflow
- Billing page aligned with landing pricing
- "Coming Soon" badges on unbuilt features (Stripe, exports, API keys)

### Auth & Security
- GoTrue login/signup with token refresh (30-day sessions)
- RLS on all 29 tables (24 original + 5 field notes)
- withRLS() role whitelist + userId validation
- Cookie security (environment-aware secure flag)

### Infrastructure
- Turbo workspace (npm run dev starts app + temporal worker)
- db:wipe / db:reset / db:seed with production guards
- Seed user auto-creation from env vars

---

## 2026-04-15 — Real Property Data, Market Analysis, Listings Intelligence

### Real Property Data
- Integrated Zillow API data for all 13 properties (70-column `properties` schema)
- Properties table: construction materials, heating/cooling, roof, parking, HOA, tax history, Zestimate
- 11 listings linked to 13 properties with real addresses, photos, and coordinates
- 2 external listings for buyer matching
- 3 buyer preference profiles with search criteria

### Market Analysis Pipeline
- Temporal workflow `MarketAnalysis` with 4 activities: geocode, search comps, analyze market, save results
- `market_analyses`, `comp_listings`, `analysis_schedules` tables
- Listings Intelligence tab with interactive comp map (Leaflet)
- Comp search by radius, property type, and date range

### Communications
- Twilio SMS integration for showing reminders and phase change notifications
- Postmark email integration for portal invites and branded notifications
- Phase change notification preferences (email + SMS per contact)

### Security
- RLS policies on all 35 tables (added 6 new-table policies in `0007_rls_new_tables.sql`)
- Grants for `authenticated` role on properties, buyer_preferences, external_listings, market_analyses, analysis_schedules, comp_listings

### Team
- Renamed demo org to XYZ Realty
- All dead buttons fixed or marked "Coming Soon"

### Audit
- 5 full audit loops completed (build, db:reset, dev server, Python syntax, RLS)
- Launch gate checklist for production deployment

---

## What's Left

### Immediate Next Steps
1. **Deploy to Railway** — Set env vars, verify build + start
2. **Register domain** — Choose from top candidates and register via Cloudflare

### Future Work
- Real-time updates (Supabase Realtime — broadcasts Drizzle writes via WAL)
- Token refresh logic in hooks (refresh token → new access token)
- MLS/IDX integration for comp data
- Email/calendar sync (Google Workspace, Outlook)
- DocuSign integration for e-signatures
- AI layer (Anthropic Claude API for insights, comp narratives, action extraction)
- Full-text search (PostgreSQL tsvector or Typesense)
- Audit logging table
