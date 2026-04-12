# HomeTrack Changelog

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
- Migration: `drizzle/0004_rls_policies.sql`

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

## What's Left

### Immediate Next Steps
1. **Fix DATABASE_URL** — Change to `supabase_admin` user and `postgres` database
2. **Register domain** — Choose from top candidates and register via Cloudflare
3. **Deploy to Railway** — Connect SvelteKit app with correct env vars
4. **Create first GoTrue user** — Link to team_members for dev testing

### Future Work
- Real-time updates (Supabase Realtime — broadcasts Drizzle writes via WAL)
- MLS/IDX integration for comp data
- Email/calendar sync (Google Workspace, Outlook)
- DocuSign integration for e-signatures
- AI layer (Anthropic Claude API for insights, comp narratives, action extraction)
- Full-text search (PostgreSQL tsvector or Typesense)
- Audit logging table
- Token refresh logic in hooks (refresh token → new access token)
