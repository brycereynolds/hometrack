# HomeTrack — Real Estate Back-Office Platform
## Product Specification & Information Architecture
*hometrack.co · v0.1 · April 2026*

> **Implementation status:** An interactive frontend mockup (48 pages) has been built using SvelteKit, Svelte 5, shadcn-svelte, Tailwind CSS v4, Chart.js, and Leaflet.js. All pages render with mock data — no backend, database, or API integrations exist yet. The mockup covers the full navigation structure described in this spec. See Section 5.0 for a complete page inventory and Section 7 for the technical stack.

---

## 1. Product Vision

A multi-tenant SaaS platform purpose-built for boutique real estate teams, replacing fragmented spreadsheets, text threads, and ad-hoc workflows with a unified operating system for the entire listing lifecycle. The platform treats the **listing as a project**, the **team's natural communication patterns as first-class data**, and layers AI-powered intelligence on top to surface insights, connections, and operational awareness that no individual team member could maintain alone.

This is not a CRM with a task list bolted on. It is the operational backbone for high-touch, high-performance teams who deliver a premium client experience and need tooling that matches their sophistication.

---

## 2. Core Design Principles

- **Process-first, not content-factory.** These are boutique teams. They write their own copy, style their own photography direction, and build personal relationships. The platform manages the *process* around that work — it never tries to replace the craft.
- **Meet teams where they communicate.** Don't force a new messaging silo. Ingest, thread, and surface conversations from wherever they naturally happen — SMS, email, in-app — and make sense of them within the context of the right listing.
- **Unified data model unlocks intelligence.** Vendor costs, showing attendance, Zillow views, client conversations, and comp data all live in one graph. That's what makes AI features genuinely useful rather than gimmicky.
- **Relationship graph as competitive advantage.** The best agents maintain a mental map of who's looking for what across the entire agent network. The platform externalizes and augments that map.
- **Multi-surface adaptability.** Desktop for deep work, mobile for field notes and voice memos, client portal for transparency. Same data, right interface for the context.

---

## 3. User Roles

| Role | Description |
|------|-------------|
| **Team Admin** | Manages team settings, billing, member roles, integration connections |
| **Listing Agent** | Owns client relationships, manages listings end-to-end, primary external communicator |
| **Design / Staging Lead** | Manages improvement projects, vendor relationships, staging plans, visual presentation |
| **Transaction Coordinator** | Handles disclosures, document flow, compliance checklists, closing logistics |
| **Marketing Coordinator** | Manages content production pipeline, photography scheduling, social/advertising assets |
| **Client** (external) | Views progress, approves decisions, communicates with team, accesses documents |
| **External Agent** (limited) | Receives shared listing info, submits offers, communicates on active deals |

---

## 4. Full Feature Set

### 4.1 Listing Lifecycle & Project Management

The listing is the atomic unit. Every feature orbits it.

**Pipeline & Phase Management**
- Visual pipeline board (Kanban or timeline) showing all active listings by phase
- Configurable lifecycle phases with default template: Onboarding → Improvement Planning → Staging & Prep → Content Production → Active Marketing → Showings & Open Houses → Offers & Negotiation → Under Contract → Closing
- Phase transition rules and gates (e.g., cannot move to Active Marketing until photography is marked complete and client has approved listing copy)
- Multi-pipeline support for different property types (residential, commercial, rental, new construction)

**Task Engine**
- Phase-aware task templates: when a listing enters a phase, the relevant task set is auto-generated
- Task assignment by role or individual team member
- Dependencies between tasks (staging photos can't be scheduled until staging is complete)
- Due date management with calendar integration
- Recurring task support for ongoing activities (weekly client updates, monthly market snapshots)
- Subtask nesting for complex activities (e.g., "Coordinate Staging" breaks into vendor selection, scheduling, client approval, day-of logistics)

**Automation & Triggers**
- Rule-based automations: "When phase changes to X, create tasks Y and Z, notify client, update portal"
- Time-based triggers: "If task is overdue by 2 days, escalate to team admin"
- Conditional logic: "If listing price > $2M, add luxury marketing task set"
- Webhook support for custom integrations via Composio or direct API

**Team Workload & Capacity**
- Team dashboard showing each member's active task load across all listings
- Capacity warnings when a team member is over-allocated
- Workload balancing suggestions

---

### 4.2 Communication Hub

**Unified Activity Feed (per listing)**
- Chronological feed of all communication touchpoints: emails, SMS/texts, in-app messages, notes, voicemails
- AI-powered threading: automatically associates inbound communications with the correct listing based on content, participants, and context
- Action item extraction: AI identifies commitments, deadlines, and follow-up needs from conversation content ("Contractor said quote will be ready by Friday" → auto-creates a follow-up task for Friday)
- Unanswered message flagging: "Client asked about timeline 3 days ago — no response logged"
- Sentiment and urgency signals on client communications

**In-App Messaging & Client Threads**
- Web-based threaded messaging accessible via client portal (no app install required for clients)
- Push notification and SMS alert options for new messages (client receives SMS saying "You have a new message from [Agent] — tap to view")
- Rich media support: photos, documents, voice memos inline in threads
- Read receipts and delivery confirmation
- Message templates for common communications (showing feedback summaries, status updates, next-steps outlines) — templates as starting points, not auto-sends

**Email Integration**
- Gmail and Outlook sync via API
- Automatic association of emails to listings based on participants and content
- Send email from within platform with listing context attached
- Email thread view within the listing's activity feed
- Shared team inbox option for listing-specific email addresses (e.g., 123-main-st@teamname.hometrack.co)

**SMS Integration (Phase 2 — after market validation)**
- Twilio-powered SMS sync for team group chats
- Opt-in consent management per client and per conversation
- Two-way SMS from within platform
- Carrier compliance and state recording law adherence
- Fallback: in Phase 1, the in-app messaging with SMS notifications serves as the primary channel, with full SMS thread ingestion as a follow-on feature after testing with pilot clients

**Voice Memo & Field Notes**
- Mobile-optimized voice memo capture
- Auto-transcription with AI summarization
- Tag to listing, contact, or vendor
- Quick-capture text notes with photo attachment
- Voice memos surface in the listing's activity feed alongside all other communication

---

### 4.3 Relationship & Agent Network Intelligence

**Contact & Relationship Management**
- Contact profiles for clients, agents, vendors, inspectors, lenders, title officers
- Relationship history: every interaction, transaction, and note across all listings
- Contact tagging and segmentation (buyer agent, luxury specialist, first-time buyer advocate, etc.)

**Agent Network Graph**
- Log interactions with external agents: what they're looking for, their buyer profiles, market focus areas
- Voice memo and quick-note capture: "Talked to Sarah Kim at open house — she has a buyer looking for 4BR in Los Gatos under $2.5M, needs good schools"
- AI-powered connection surfacing: "You have a new listing that matches what Sarah Kim's buyer is looking for (logged 3 weeks ago)"
- Proactive alerts when new listings match logged agent/buyer needs
- Network activity timeline: when did you last interact with each agent, what was discussed

**Knowledge Graph & Connection Engine**
- Cross-listing pattern recognition: surfaces connections between active listings, logged buyer needs, agent relationships, and market data
- "Who's looking for what" dashboard: filterable view of all logged buyer needs from agent network
- Relationship strength scoring based on interaction frequency and recency
- Suggested introductions and matchmaking between buyers/agents and listings

---

### 4.4 Vendor & Financial Management

**Vendor Directory**
- Team-wide vendor database: contractors, stagers, photographers, inspectors, handypeople, landscapers
- Vendor profiles with contact info, specialties, service area, and availability
- Historical performance data: average response time, cost history, quality ratings, reliability score
- Vendor categorization and tagging

**Quote & Proposal Management**
- Request quotes from multiple vendors for a given scope of work
- Side-by-side quote comparison with cost breakdown
- Quote approval workflow: agent reviews → client approves (via portal) → vendor confirmed
- Quote versioning and negotiation tracking
- Auto-generated scope of work documents from structured input

**Cost Tracking & Budget Management**
- Per-listing budget with line items for all improvement, staging, marketing, and transaction costs
- Real-time spend tracking against budget
- Invoice capture and association to line items
- Rolling cost summaries across all active listings
- Historical cost analysis: "What did we spend on staging across our last 20 listings?"
- Client-facing cost summary view in portal (what they've approved, what's been spent, what's outstanding)

**Financial Reporting**
- Per-listing P&L: total investment vs. final sale price
- ROI analysis on improvements: "Staging cost $8K, estimated price lift $25K"
- Team-level financial dashboard: total active listing investment, projected commission revenue, expense trends
- Export to QuickBooks or Xero for bookkeeping

---

### 4.5 Document Management & Transaction Hub

**Document Store**
- Per-listing document repository organized by category: disclosures, inspection reports, title documents, contracts, addenda, marketing materials, photos
- Version control with change tracking
- Document tagging, search, and filtering
- Drag-and-drop upload with auto-categorization suggestions
- Bulk upload support for large document packages

**Disclosure & Compliance Management**
- Jurisdiction-specific disclosure checklists (California TDS, SPQ, NHD, etc.)
- Disclosure completion tracking: which forms are done, which are outstanding
- Automated reminders for missing or expiring documents
- Disclosure package assembly: one-click compilation of all required documents for buyer review

**E-Signature Integration**
- DocuSign and/or dotloop integration for sending, signing, and tracking documents
- Signature status tracking within the listing view
- Countersignature routing and deadline management
- Signed document auto-filing back to the document store

**Offer Management**
- Structured offer intake: price, terms, contingencies, timeline, buyer qualification
- Side-by-side offer comparison matrix
- Counter-offer tracking and versioning
- Offer status pipeline: received → reviewed → countered → accepted/declined
- Client-facing offer summary in portal for collaborative decision-making

---

### 4.6 Market Intelligence & Analytics

**Comp Analysis Engine**
- Pull comparable sales data via MLS/IDX feeds and public data APIs
- AI-generated comp narratives: "Based on 6 comparable sales within 0.5 miles in the last 90 days, the suggested list price range is $X–$Y. Key adjustments: +$30K for renovated kitchen, -$15K for smaller lot."
- Adjustable comp parameters: radius, time window, property characteristics
- Comp package generation for client presentations
- Historical comp trend analysis

**Listing Performance Dashboard**
- Zillow/Redfin/Realtor.com view and save data aggregation
- Showing request volume and trend
- Open house attendance tracking with conversion metrics (attendees → follow-up → offer)
- Days on market benchmarking against comparable properties
- Price change impact analysis: "Views increased 40% in the 48 hours after the price adjustment"

**AI-Powered Insights**
- Pricing recommendations based on comp analysis + real-time showing/view data + market velocity
- Optimal timing suggestions: "Based on seasonal patterns and current inventory, listing in the next 2 weeks positions you ahead of 4 comparable properties coming to market"
- Interest decay detection: "Showing volume has dropped 30% week-over-week — consider a price adjustment or refreshed marketing"
- Open house ROI analysis: "Properties where you hold a second open house sell 12% faster on average based on your team's historical data"
- Weekly market intelligence digest: AI-summarized local market trends relevant to active listings

**Team Performance Analytics**
- Listings closed, average days on market, list-to-sale price ratio
- Team member contribution and workload distribution
- Client satisfaction tracking (based on communication responsiveness, milestone delivery)
- Revenue forecasting based on pipeline and historical close rates
- Year-over-year performance comparison

---

### 4.7 Client Portal

**Progress & Transparency**
- Client-facing dashboard showing their listing's current phase, upcoming milestones, and recent activity
- Visual timeline of completed and upcoming steps
- Photo and video gallery of their property (staging progress, final photography, marketing materials)
- Real-time status of key milestones: "Photography: Complete ✓ | MLS Listing: Scheduled for Thursday"

**Approvals & Decisions**
- In-portal approval workflows: client can approve vendor quotes, marketing copy, pricing decisions, offer responses
- Side-by-side comparison views for multi-option decisions (e.g., 3 staging quotes, multiple offers)
- Decision history with timestamps

**Communication**
- Threaded messaging with the team (with SMS/push notification alerts)
- Document sharing and e-signature initiation
- Scheduled update posts from the team (weekly summaries, showing feedback, market updates)

**Access & Security**
- Secure login with magic link (no password required for clients)
- Granular permission control: what documents and data each client can see
- Activity logging for compliance

---

### 4.8 Mobile Experience

**Field-Optimized Capture**
- Voice memo recording with one-tap listing association
- Quick note capture with voice-to-text
- Photo capture with auto-tagging to listing
- Business card scanning for contact capture
- Open house check-in (digital sign-in sheet with contact capture)

**On-the-Go Management**
- Task list with quick-complete actions
- Push notifications for approvals, messages, and escalations
- Showing feedback capture immediately after appointments
- Agent network note capture: log conversations with other agents in real-time

**Offline Support**
- Core features available offline with sync on reconnect
- Offline voice memo and photo capture
- Cached listing data for reference during showings

---

### 4.9 Integrations & API Layer

**Core Integrations (via direct API + Composio)**
- MLS/IDX: Listing data, comp data, market statistics
- Zillow/Redfin/Realtor.com: View counts, save counts, traffic analytics
- Google Workspace: Gmail sync, Calendar sync, Drive document access
- Microsoft 365: Outlook sync, Calendar, OneDrive
- DocuSign / dotloop: E-signature workflows
- QuickBooks / Xero: Financial data sync
- Twilio: SMS messaging (Phase 2)
- Social media APIs: Facebook, Instagram, LinkedIn for posting and analytics
- Canva: Marketing material templates (optional)
- Calendly / scheduling tools: Showing and appointment scheduling

**Integration Architecture**
- Composio as the primary agent-layer integration framework for broad API connectivity
- Webhook-based event system for real-time data flow
- OAuth-based authentication for all third-party connections
- Per-team integration configuration (each team connects their own accounts)
- Integration health monitoring and failure alerts

**Open API**
- RESTful API for custom integrations
- Webhook subscriptions for listing events, task changes, and communication
- API key management with scoped permissions

---

### 4.10 Multi-Tenant & Administration

**Team Management**
- Team creation and member invitation
- Role-based access control (admin, agent, coordinator, viewer)
- Custom role creation with granular permissions
- Team-level settings: default phases, task templates, notification preferences, branding

**Brokerage-Level Features (future)**
- Brokerage umbrella account with multiple team workspaces
- Cross-team reporting and benchmarking
- Brokerage-wide vendor directory
- Compliance oversight and audit trail

**White-Labeling**
- Custom branding on client portal (team logo, colors)
- Custom domain for client portal (portal.teamname.com)
- Branded email notifications

**Data & Security**
- SOC 2 compliance target
- End-to-end encryption for documents and messages
- Role-based data access with audit logging
- Data export and portability
- GDPR/CCPA compliance for client data handling
- Automated data retention policies

---

## 5. Information Architecture

### 5.0 Mockup Implementation Status

The interactive mockup contains 48 pages across 4 route groups (plus a root redirect), using SvelteKit's route group layout system. All pages render with mock data (no backend); the data layer lives in `$lib/data/mock-data.ts`. 17 shared components and 20 shadcn-svelte UI primitives provide the design system foundation.

**Route Groups & Pages Built:**

**(app) — Main Application (40 pages)**

| Route | Page |
|-------|------|
| `/dashboard` | Dashboard — pipeline overview, stat cards, task list (filterable: today/overdue/upcoming), recent activity feed, AI alerts (dismissable), team workload chart (Chart.js), upcoming showings |
| `/listings` | Pipeline board — Kanban view of all listings by phase, search/filter, view-mode switcher (board/list/map) |
| `/listings/list` | Listings list view — tabular listing directory with sorting and filters |
| `/listings/map` | Listings map view — Leaflet.js interactive map with listing markers and popups |
| `/listings/new` | New listing form — multi-step listing creation |
| `/listings/[id]` | Listing detail overview — property details, phase status, key dates, team assignments, quick stats |
| `/listings/[id]/activity` | Listing activity feed — chronological feed of messages, emails, notes, voice memos, system events |
| `/listings/[id]/tasks` | Listing tasks — phase-organized task list with status, priority, assignee, subtasks |
| `/listings/[id]/documents` | Listing documents — categorized document store with upload/share |
| `/listings/[id]/financials` | Listing financials — budget, quotes, expenses, P&L summary |
| `/listings/[id]/marketing` | Listing marketing — content assets, social posts, advertising metrics |
| `/listings/[id]/showings` | Listing showings — scheduling, attendance, feedback |
| `/listings/[id]/offers` | Listing offers — offer pipeline with comparison matrix |
| `/listings/[id]/analytics` | Listing analytics — views, saves, showing trends, comp data |
| `/listings/[id]/portal-settings` | Client portal settings — what the client sees, approval queue configuration |
| `/contacts` | All contacts — searchable directory with type filters |
| `/contacts/clients` | Clients — active and past clients with listing history |
| `/contacts/agents` | Agent network — external agents with relationship data |
| `/contacts/agents/intelligence` | Agent network intelligence — "Who's looking for what" view, AI connection suggestions, buyer need matching |
| `/contacts/[id]` | Contact detail — profile, interaction timeline, associated listings, notes |
| `/vendors` | Vendor directory — searchable with category filters, star ratings, performance data |
| `/vendors/[id]` | Vendor detail — profile, specialties, quote history, reliability scores |
| `/vendors/quotes` | Quote management — quote comparison and approval workflows |
| `/analytics` | Analytics overview — pipeline value chart (Chart.js), aggregate metrics, market overview |
| `/analytics/listings` | Listing performance — aggregate view/save/showing data across listings |
| `/analytics/team` | Team performance — productivity metrics, revenue tracking |
| `/analytics/insights` | AI insights — proactive recommendations and pattern detection |
| `/settings` | Team management — member list with roles, invite flow |
| `/settings/integrations` | Integration connections — OAuth connection cards |
| `/settings/workflows` | Workflow configuration — phases, task templates, automations |
| `/settings/notifications` | Notification preferences |
| `/settings/billing` | Billing and subscription |
| `/settings/branding` | Client portal branding — logo, colors, custom domain |
| `/settings/data` | Data management and exports |
| `/mobile/voice-memo` | Mobile voice memo capture — recording UI with listing association |
| `/mobile/field-notes` | Mobile field notes — quick-capture text notes with photo attachment |
| `/mobile/open-house` | Mobile open house check-in — digital sign-in sheet with contact capture |
| `/mobile/quick-task` | Mobile quick task — task completion with one-tap actions |
| `/mobile/showing-feedback` | Mobile showing feedback — post-showing feedback capture |
| `/preview` | Design system preview — showcases all shared components (PageHeader, MetricCard, PhaseBadge, StatusBadge, ListingCard, ContactCard, ActivityFeedItem, AIInsightCard, EmptyState, DataTable, ListingDetailTabs, Breadcrumbs) |

**(auth) — Authentication (3 pages)**

| Route | Page |
|-------|------|
| `/login` | Magic link login — email input, sends magic link (no password) |
| `/invite` | Invalid invitation — error state for missing/expired invite links |
| `/invite/[token]` | Team invitation acceptance — accept invite flow with token validation |

**(portal) — Client Portal (4 pages)**

| Route | Page |
|-------|------|
| `/[team]` | Client portal dashboard — listing phase status, visual timeline, milestones, photo gallery, showing data |
| `/[team]/approvals` | Client approvals — vendor quote approvals, pricing decisions, offer responses |
| `/[team]/documents` | Client documents — shared document viewing and e-signature |
| `/[team]/messages` | Client messages — threaded messaging with the team |

**Shared Components (17):**
`AppLayout`, `AuthLayout`, `PortalLayout`, `Sidebar`, `MobileBottomNav`, `PageHeader`, `Breadcrumbs`, `MetricCard`, `ListingCard`, `ContactCard`, `PhaseBadge`, `StatusBadge`, `ActivityFeedItem`, `AIInsightCard`, `EmptyState`, `DataTable`, `ListingDetailTabs`

**shadcn-svelte UI Primitives (20):**
avatar, badge, button, calendar, card, checkbox, command, dialog, dropdown-menu, input, input-group, popover, select, separator, sheet, sidebar, skeleton, table, tabs, textarea, tooltip

---

### 5.1 Primary Navigation Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  GLOBAL NAV                                                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │Dashboard │Listings  │Contacts  │Vendors   │Analytics │Settings│ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Navigation Map

**Dashboard (Home)**
- Pipeline overview: all active listings by phase
- My tasks: prioritized task list for current user
- Recent activity feed: latest communications, task completions, client actions
- AI alerts: surfaced insights, connection suggestions, overdue flags
- Quick actions: new listing, new contact, new note

**Listings**
- Pipeline board view (Kanban by phase)
- List view with filters and sorting
- Map view (listings plotted geographically)
- → Individual Listing Detail
  - Overview: property details, phase status, key dates, team assignments
  - Activity Feed: unified chronological feed of all communications and events
  - Tasks: phase-organized task list with status
  - Documents: categorized document store with upload/share
  - Financials: budget, quotes, expenses, P&L
  - Marketing: content assets, social posts, advertising metrics
  - Showings & Open Houses: scheduling, attendance, feedback
  - Offers: offer pipeline with comparison
  - Analytics: views, saves, showing trends, comp data
  - Client Portal Settings: what the client sees, approval queue

**Contacts**
- All contacts: searchable directory with filters by type
- Clients: active and past clients with listing history
- Agent Network: external agents with relationship data and logged needs
  - → Agent Network Intelligence: "Who's looking for what" view
  - → Connection suggestions
- → Contact Detail
  - Profile and contact info
  - Interaction timeline across all listings
  - Associated listings and transactions
  - Notes and voice memos
  - Relationship scoring

**Vendors**
- Vendor directory with category filters
- Performance rankings
- → Vendor Detail
  - Profile, specialties, service area
  - Quote history and cost trends
  - Reliability and quality scores
  - Active and past projects

**Analytics**
- Market Intelligence: comp analysis, market trends, pricing tools
- Listing Performance: aggregate view/save/showing data across listings
- Team Performance: productivity metrics, revenue tracking, forecasting
- AI Insights: proactive recommendations and pattern detection
- Custom Reports: configurable report builder

**Settings**
- Team management and roles
- Integration connections (Composio hub)
- Workflow configuration: phases, task templates, automations
- Notification preferences
- Billing and subscription
- Client portal branding
- Data management and exports

### 5.3 Data Model (Simplified)

```
Team (tenant)
 ├── Members (users with roles)
 ├── Listings (projects)
 │    ├── Phase / Status
 │    ├── Tasks
 │    │    ├── Assignments
 │    │    └── Subtasks
 │    ├── Activity Feed
 │    │    ├── Messages (in-app)
 │    │    ├── Emails (synced)
 │    │    ├── SMS (synced, Phase 2)
 │    │    ├── Notes & Voice Memos
 │    │    └── System Events
 │    ├── Documents
 │    │    ├── Disclosures
 │    │    ├── Contracts
 │    │    ├── Inspection Reports
 │    │    └── Marketing Assets
 │    ├── Financials
 │    │    ├── Budget
 │    │    ├── Quotes
 │    │    ├── Invoices / Expenses
 │    │    └── P&L Summary
 │    ├── Showings & Open Houses
 │    │    ├── Attendees
 │    │    ├── Feedback
 │    │    └── Conversion Tracking
 │    ├── Offers
 │    │    ├── Offer Details
 │    │    ├── Counter History
 │    │    └── Status
 │    ├── Market Data
 │    │    ├── Comps
 │    │    ├── View / Save Analytics
 │    │    └── AI Insights
 │    └── Client Portal Config
 ├── Contacts
 │    ├── Clients
 │    ├── External Agents
 │    │    └── Logged Buyer Needs
 │    ├── Vendors
 │    └── Other (lenders, title, etc.)
 ├── Vendor Directory
 ├── Integrations (per-team OAuth tokens)
 ├── Workflow Templates
 └── Settings & Branding
```

### 5.4 AI Layer Architecture

The AI layer is not a separate module — it is woven throughout the platform, operating on the unified data model.

**Ingestion & Understanding**
- Communication threading engine: classifies and associates inbound messages to listings
- Voice memo transcription and summarization
- Action item extraction from all communication channels
- Contact and entity recognition in messages

**Analysis & Pattern Detection**
- Comp analysis engine: pulls MLS data, applies adjustments, generates narratives
- Market velocity calculation from aggregated view/save/showing data
- Team performance pattern detection across historical listings
- Cost and ROI analysis across staging/improvement investments

**Surfacing & Recommendation**
- Connection engine: matches agent network logged needs against active/upcoming listings
- Pricing intelligence: synthesizes comps, showing data, view trends, and market velocity
- Task prioritization: recommends daily focus based on deadlines, client responsiveness, and listing urgency
- Anomaly detection: flags unusual patterns (sudden drop in views, vendor non-responsiveness, stale tasks)

**The AI does not:**
- Write listing copy or marketing content
- Auto-send communications to clients
- Make decisions — it surfaces information and recommends, the agent decides

---

## 6. Phasing & Prioritization (Suggested)

**Phase 1 — Foundation (Months 1–4)**
- Listing lifecycle and project management (pipeline, tasks, phases)
- In-app messaging with client portal and SMS/push notifications
- Document store with basic categorization
- Vendor directory and quote management
- Contact management
- Basic cost tracking per listing
- Google Workspace integration (email sync, calendar)

**Phase 2 — Intelligence (Months 4–7)**
- Market data integrations (MLS/IDX, Zillow/Redfin view data)
- Comp analysis engine with AI narratives
- Listing performance dashboards (views, saves, showings)
- Offer management and comparison
- Disclosure and compliance checklists
- DocuSign integration
- Mobile voice memo and field note capture

**Phase 3 — Network & Insights (Months 7–10)**
- Agent network graph and relationship intelligence
- AI connection surfacing ("This listing matches what Agent X is looking for")
- Email/SMS threading and ingestion (with consent framework)
- AI action item extraction from communications
- Advanced analytics: team performance, financial reporting, ROI analysis
- QuickBooks integration

**Phase 4 — Scale (Months 10–14)**
- Full SMS ingestion via Twilio (after compliance framework)
- Brokerage-level multi-team accounts
- White-labeling and custom domains
- Open API and webhook system
- Advanced AI: pricing recommendations, optimal timing, anomaly detection
- Offline mobile support

---

## 7. Technical Stack

### 7.1 Frontend Mockup (Current Implementation)

The interactive UI mockup has been built with the following stack:

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit (^2.57.0) with Svelte 5 (^5.55.2, runes mode) |
| Language | TypeScript (^6.0.2) |
| Build Tool | Vite (^8.0.7) |
| Styling | Tailwind CSS v4 (^4.2.2) with `@tailwindcss/vite` plugin |
| Component Library | shadcn-svelte (nova style, stone base color) via bits-ui (^2.17.3) |
| Charts | Chart.js (^4.5.1) |
| Maps | Leaflet.js (^1.9.4) |
| Icons | lucide-svelte (^1.0.1) and @lucide/svelte (^1.8.0) |
| Utilities | clsx, tailwind-merge, tailwind-variants, @internationalized/date |
| Adapter | @sveltejs/adapter-auto |

### 7.2 Design System

| Token | Value |
|-------|-------|
| Primary color | Terracotta — `oklch(0.58 0.12 45)` / #C4704B |
| Secondary color | Sage green — `oklch(0.58 0.06 145)` / #7B8B6F |
| Accent color | Warm coral — `oklch(0.70 0.10 55)` / #D4956B |
| Heading typeface | DM Serif Display |
| Body typeface | Inter |
| Mono typeface | JetBrains Mono |
| Color format | oklch (with hex fallback comments) |
| Background | Warm off-white — `oklch(0.985 0.005 80)` / #FDFBF7 |
| Card background | `oklch(0.97 0.007 75)` / #F7F4EE |
| Border | Warm-toned — `oklch(0.90 0.01 70)` / #E5E0D8 |
| Dark mode | Full dark mode palette defined with warm dark tones |
| Border radius | sm: 0.25rem, md: 0.5rem, lg: 0.75rem, xl: 1rem |

The design system also includes:
- Pipeline phase colors (9 distinct oklch colors for each lifecycle phase)
- Status colors: success (green), warning (gold), error (red), info (teal) — each with subtle background variants
- Extended tokens for background-secondary, background-tertiary, foreground-secondary, foreground-muted, border-strong, border-subtle, primary-hover, primary-subtle, secondary-hover, secondary-subtle, accent-subtle
- Chart palette: terracotta, sage, coral, teal, gold
- Sidebar tokens matching the overall warm palette
- Custom utility classes: `.scrollbar-none`, `.pb-safe` (safe area for mobile bottom nav)

### 7.3 Production Stack (Planned)

| Layer | Candidate Technologies |
|-------|----------------------|
| Backend | Node.js or Python (FastAPI), event-driven architecture |
| Database | PostgreSQL (relational core), Redis (caching/real-time) |
| Search | Elasticsearch or Typesense (full-text across documents and communications) |
| AI/ML | Anthropic Claude API (narratives, summarization, extraction), vector DB for semantic search |
| Integrations | Composio (agent-layer API orchestration), direct OAuth for core integrations |
| File Storage | S3-compatible object storage |
| Real-time | WebSockets for live updates, push notifications |
| Auth | Auth0 or Clerk (multi-tenant, magic links for clients) |
| Infrastructure | AWS or GCP, containerized (Docker/K8s) |
