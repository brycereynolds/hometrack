# HomeTrack Information Architecture
## Complete Page Inventory, Navigation, and Page Specifications
*hometrack.co -- v0.1 -- April 2026*
*SvelteKit + shadcn-svelte + Tailwind CSS*

---

## Table of Contents

1. [SvelteKit Route Map](#1-sveltekit-route-map)
2. [Navigation Structure](#2-navigation-structure)
3. [Page-by-Page Specifications](#3-page-by-page-specifications)
4. [Key User Flows](#4-key-user-flows)
5. [Auth & Permissions](#5-auth--permissions)
6. [Mobile Strategy](#6-mobile-strategy)

---

## 1. SvelteKit Route Map

### Full Directory Structure

```
src/routes/
|
|-- +layout.svelte                          # Root layout (auth gate, theme provider)
|-- +page.svelte                            # Redirect -> /dashboard or /login
|
|-- (auth)/                                 # Auth group layout (centered, no sidebar)
|   |-- login/
|   |   +-- +page.svelte                    # Magic link login
|   |-- invite/
|   |   +-- [token]/
|   |       +-- +page.svelte                # Invite accept + profile setup
|
|-- (app)/                                  # Authenticated app layout (sidebar + topbar)
|   |-- +layout.svelte                      # App shell: sidebar, topbar, breadcrumbs, mobile nav
|   |
|   |-- dashboard/
|   |   +-- +page.svelte                    # [P01] Dashboard / Home
|   |
|   |-- listings/
|   |   |-- +page.svelte                    # [P02] Listings Pipeline Board (default)
|   |   |-- list/
|   |   |   +-- +page.svelte                # [P03] Listings List View
|   |   |-- map/
|   |   |   +-- +page.svelte                # [P04] Listings Map View
|   |   |-- new/
|   |   |   +-- +page.svelte                # [P05] New Listing Wizard
|   |   +-- [listingId]/
|   |       |-- +layout.svelte              # Listing detail layout (header + tab nav)
|   |       |-- +page.svelte                # [P06] Listing Overview (default tab)
|   |       |-- activity/
|   |       |   +-- +page.svelte            # [P07] Activity Feed
|   |       |-- tasks/
|   |       |   +-- +page.svelte            # [P08] Tasks
|   |       |-- documents/
|   |       |   +-- +page.svelte            # [P09] Documents
|   |       |-- financials/
|   |       |   +-- +page.svelte            # [P10] Financials
|   |       |-- marketing/
|   |       |   +-- +page.svelte            # [P11] Marketing
|   |       |-- showings/
|   |       |   +-- +page.svelte            # [P12] Showings & Open Houses
|   |       |-- offers/
|   |       |   +-- +page.svelte            # [P13] Offers
|   |       |-- analytics/
|   |       |   +-- +page.svelte            # [P14] Listing Analytics
|   |       +-- portal-settings/
|   |           +-- +page.svelte            # [P15] Client Portal Settings
|   |
|   |-- contacts/
|   |   |-- +page.svelte                    # [P16] All Contacts
|   |   |-- clients/
|   |   |   +-- +page.svelte                # [P17] Clients
|   |   |-- agents/
|   |   |   |-- +page.svelte                # [P18] Agent Network
|   |   |   +-- intelligence/
|   |   |       +-- +page.svelte            # [P19] Agent Network Intelligence
|   |   +-- [contactId]/
|   |       +-- +page.svelte                # [P20] Contact Detail
|   |
|   |-- vendors/
|   |   |-- +page.svelte                    # [P21] Vendor Directory
|   |   |-- [vendorId]/
|   |   |   +-- +page.svelte                # [P22] Vendor Detail
|   |   +-- quotes/
|   |       +-- +page.svelte                # [P23] Quote Management
|   |
|   |-- analytics/
|   |   |-- +page.svelte                    # [P24] Analytics Overview / Market Intelligence
|   |   |-- listings/
|   |   |   +-- +page.svelte                # [P25] Listing Performance
|   |   |-- team/
|   |   |   +-- +page.svelte                # [P26] Team Performance
|   |   +-- insights/
|   |       +-- +page.svelte                # [P27] AI Insights
|   |
|   |-- settings/
|   |   |-- +page.svelte                    # [P28] Settings Overview / Team Management
|   |   |-- integrations/
|   |   |   +-- +page.svelte                # [P29] Integrations
|   |   |-- workflows/
|   |   |   +-- +page.svelte                # [P30] Workflows & Automations
|   |   |-- notifications/
|   |   |   +-- +page.svelte                # [P31] Notification Preferences
|   |   |-- billing/
|   |   |   +-- +page.svelte                # [P32] Billing & Subscription
|   |   |-- branding/
|   |   |   +-- +page.svelte                # [P33] Client Portal Branding
|   |   +-- data/
|   |       +-- +page.svelte                # [P34] Data Management & Exports
|   |
|   +-- mobile/                             # Mobile-optimized dedicated views
|       |-- voice-memo/
|       |   +-- +page.svelte                # [P35] Voice Memo Capture
|       |-- field-notes/
|       |   +-- +page.svelte                # [P36] Field Notes
|       |-- showing-feedback/
|       |   +-- +page.svelte                # [P37] Showing Feedback
|       |-- open-house/
|       |   +-- +page.svelte                # [P38] Open House Check-In
|       +-- quick-task/
|           +-- +page.svelte                # [P39] Quick Task Completion
|
+-- (portal)/                               # Client Portal (separate layout, separate auth)
    |-- +layout.svelte                      # Portal shell: branded header, portal nav, footer
    |-- +page.svelte                        # [P40] Portal Dashboard
    |-- approvals/
    |   +-- +page.svelte                    # [P41] Portal Approvals
    |-- messages/
    |   +-- +page.svelte                    # [P42] Portal Messages
    +-- documents/
        +-- +page.svelte                    # [P43] Portal Documents
```

**Total: 43 pages/views** (2 auth + 34 app + 5 mobile + 2 portal dedicated + 43rd is portal dashboard)

---

## 2. Navigation Structure

### 2.1 Global Sidebar Navigation (Desktop)

The sidebar is the primary navigation for the authenticated app. It is collapsible to icons-only mode.

```
+---------------------------------------+
|  [HomeTrack logo / Team name]         |
|  [Collapse toggle]                     |
+---------------------------------------+
|                                        |
|  * Dashboard              [home icon]  |
|                                        |
|  * Listings               [building]   |
|    (badge: active count)               |
|                                        |
|  * Contacts               [users]      |
|                                        |
|  * Vendors                [toolbox]    |
|                                        |
|  * Analytics              [bar-chart]  |
|                                        |
+---------------------------------------+
|  QUICK ACTIONS                         |
|  [+] New Listing                       |
|  [mic] Voice Memo                      |
|  [note] Quick Note                     |
+---------------------------------------+
|                                        |
|  AI ALERTS (collapsible)               |
|  - "Sarah Kim's buyer matches..."      |
|  - "Showing volume down 30%..."        |
|                                        |
+---------------------------------------+
|  [user avatar] Profile                 |
|  [gear] Settings                       |
|  [?] Help                              |
+---------------------------------------+
```

### 2.2 Mobile Bottom Navigation

Five-item bottom tab bar, always visible on mobile:

```
+----------+----------+----------+----------+----------+
| Dashboard| Listings | Capture  | Contacts | More     |
| [home]   | [grid]   | [+ mic]  | [users]  | [menu]   |
+----------+----------+----------+----------+----------+
```

- **Capture** (center, prominent): Opens a modal/sheet with quick-capture options: Voice Memo, Field Note, Photo, Showing Feedback, Open House Check-In.
- **More**: Slides up a sheet with Vendors, Analytics, Settings links.

### 2.3 Breadcrumb Pattern

Displayed in the topbar area below the page title on desktop; hidden on mobile (use back arrow instead).

```
Dashboard
Listings > Pipeline Board
Listings > 123 Main St > Overview
Listings > 123 Main St > Tasks
Contacts > Agent Network > Sarah Kim
Vendors > ABC Staging Co
Analytics > Team Performance
Settings > Integrations
```

### 2.4 Client Portal Navigation

Horizontal top nav within branded portal layout (no sidebar):

```
+---------------------------------------------------------------+
|  [Team Logo]  [Team Name] Client Portal                       |
+---------------------------------------------------------------+
|  Dashboard  |  Approvals (3)  |  Messages (1)  |  Documents   |
+---------------------------------------------------------------+
```

Mobile: same items as horizontal scrollable tabs.

### 2.5 Listing Detail Tab Navigation

Horizontal tab bar within the listing detail layout:

```
Overview | Activity | Tasks | Documents | Financials | Marketing | Showings | Offers | Analytics | Portal
```

Mobile: horizontally scrollable tab bar. Active tab is always visible.

---

## 3. Page-by-Page Specifications

---

### P01 -- Dashboard / Home
**Route:** `/(app)/dashboard`

**Layout Pattern:** Full-width with a 3-column grid on desktop (pipeline left, tasks center, activity right). Stacks vertically on mobile (tasks first, then pipeline summary, then activity).

**Key Components:**
- Pipeline summary cards (listing count per phase, clickable)
- My Tasks list (filterable: today, overdue, upcoming) with quick-complete checkboxes
- Recent Activity feed (latest 20 items across all listings)
- AI Alerts panel (connection suggestions, anomalies, overdue flags)
- Quick Actions bar (New Listing, New Contact, Voice Memo, Quick Note)
- Team workload mini-chart (bar chart showing task distribution per member)

**Data Displayed:**
- All active listings grouped by lifecycle phase (count + miniature cards)
- Current user's assigned tasks with due dates, listing association, priority
- Cross-listing activity stream: messages, task completions, client actions, system events
- AI-generated alerts: buyer-listing matches, interest decay, unanswered messages, overdue tasks
- Today's calendar (upcoming showings, meetings, deadlines)

**Actions Available:**
- Click listing card to navigate to listing detail
- Complete task inline (checkbox)
- Snooze/dismiss AI alert
- Quick-create: listing, contact, note, voice memo
- Filter tasks by date range or listing
- Click activity item to navigate to source

**Empty State:**
Illustration of a house with a "Welcome to HomeTrack" message. Guided setup checklist: (1) Invite team members, (2) Connect integrations, (3) Create your first listing. Each item links to the relevant settings or creation page.

**AI Surfaces Here:**
- AI Alerts panel: proactive connection suggestions ("New listing matches Sarah Kim's buyer"), anomaly flags ("Showing volume dropped 30% on 456 Oak Ave"), overdue communication warnings ("Client asked about timeline 3 days ago -- no response")
- Task prioritization: AI reorders tasks by urgency + impact
- Daily digest summary (expandable card): "3 listings need attention today"

**Mobile Considerations:**
- Tasks list is the primary view (swipeable to complete)
- Pipeline shown as a horizontal scroll of phase chips with counts
- Activity feed is a scrollable card list
- Quick-capture FAB (floating action button) for voice memo / note
- AI alerts as a dismissible banner at top

---

### P02 -- Listings Pipeline Board
**Route:** `/(app)/listings`

**Layout Pattern:** Full-width Kanban board with horizontal scroll. Each column is a lifecycle phase. Cards represent individual listings.

**Key Components:**
- Phase columns (configurable): Onboarding, Improvement Planning, Staging & Prep, Content Production, Active Marketing, Showings & Open Houses, Offers & Negotiation, Under Contract, Closing
- Listing cards within each column showing: property photo thumbnail, address, price, listing agent, days in phase, next task due, key metric (e.g., showing count for Active Marketing phase)
- Drag-and-drop to move listings between phases (with gate validation)
- Filter bar: listing agent, property type, price range, date range
- View toggle: Board | List | Map
- Pipeline type selector (if multi-pipeline: Residential, Commercial, Rental)
- Search bar for quick listing lookup

**Data Displayed:**
- All active listings organized by current lifecycle phase
- Per-listing: address, photo, list price, assigned agent, days in current phase, overdue task count (red badge), upcoming milestone
- Phase column header: count of listings, aggregate stats

**Actions Available:**
- Drag listing card to new phase (triggers phase transition rules)
- Click card to open listing detail
- Click "+" on a column to create listing directly in that phase
- Toggle between Board / List / Map views
- Filter and search
- Bulk select listings for batch operations (e.g., reassign agent)

**Empty State:**
Empty Kanban board with ghost cards. "No active listings yet. Create your first listing to see your pipeline come to life." CTA button: "Create Listing."

**AI Surfaces Here:**
- Phase gate warnings: "Cannot move to Active Marketing -- photography task incomplete"
- Suggested phase transitions: "This listing has been in Staging & Prep for 14 days. Staging is marked complete. Move to Content Production?"
- Stale listing flags: amber border on cards that haven't had activity in X days

**Mobile Considerations:**
- Horizontal scrollable columns with snap behavior
- Simplified cards (address, price, phase indicator dot, overdue badge)
- Pull-down to refresh
- Tap card for detail; long-press for quick actions (move phase, assign)
- Bottom sheet for filters

---

### P03 -- Listings List View
**Route:** `/(app)/listings/list`

**Layout Pattern:** Data table with sortable columns, filter sidebar/drawer.

**Key Components:**
- Data table with columns: Photo, Address, Price, Phase, Agent, Days on Market, Next Task, Last Activity, Status indicators
- Sortable column headers
- Filter panel (collapsible sidebar or drawer): phase, agent, price range, property type, status, date ranges
- Bulk action toolbar (appears on multi-select): reassign, change phase, export
- Pagination or infinite scroll
- View toggle: Board | List | Map

**Data Displayed:**
- Tabular view of all listings with key metadata
- Inline status indicators (colored dots/pills for phase, overdue badges)
- Sortable by any column

**Actions Available:**
- Click row to navigate to listing detail
- Sort by column
- Multi-select with checkboxes for bulk actions
- Filter by any dimension
- Export filtered results to CSV
- Toggle views

**Empty State:**
Empty table with header row visible. "No listings match your filters." or "Create your first listing to get started."

**AI Surfaces Here:**
- Highlighted rows for listings needing attention (AI-detected anomalies)
- Sortable "AI Priority" column ranking listings by urgency

**Mobile Considerations:**
- Card list instead of table (each card = one listing row)
- Swipe actions: quick-call client, navigate to detail
- Sticky filter chips at top
- Pull-to-refresh

---

### P04 -- Listings Map View
**Route:** `/(app)/listings/map`

**Layout Pattern:** Full-viewport interactive map with a collapsible listing panel on the left (desktop) or bottom sheet (mobile).

**Key Components:**
- Interactive map (Mapbox or Google Maps) with listing pins
- Pin color/icon coded by phase or status
- Listing panel/sheet: scrollable list of listings shown on map
- Filter bar: same filters as list view
- Search bar with address autocomplete
- View toggle: Board | List | Map

**Data Displayed:**
- Listing locations plotted on map with phase-colored pins
- Pin popup on hover/tap: address, photo, price, phase, days on market
- Listing panel: summary cards matching visible map area

**Actions Available:**
- Click pin to see popup; click popup to navigate to listing detail
- Pan/zoom map; listing panel updates to show visible listings
- Filter by phase, agent, price range
- Toggle between map types (street, satellite)
- Draw area to filter listings geographically

**Empty State:**
Map centered on team's primary market area. "No listings to display. Create a listing with an address to see it on the map."

**AI Surfaces Here:**
- Comp overlay: toggle to show recent comparable sales as lighter pins
- Heatmap overlay: showing demand/interest density based on logged agent network buyer needs

**Mobile Considerations:**
- Full-screen map with bottom sheet for listing cards
- Bottom sheet has three snap points: peek (1 card), half, full
- Large tap targets on pins
- Current location button for agents in the field

---

### P05 -- New Listing Wizard
**Route:** `/(app)/listings/new`

**Layout Pattern:** Multi-step wizard/stepper form. Centered content area (max-width ~720px). Step progress indicator at top.

**Key Components:**
- Step progress bar (horizontal stepper)
- Step 1: Property Details (address with autocomplete, property type, beds/baths/sqft, lot size, year built)
- Step 2: Pricing (target list price, client expectations, price range notes)
- Step 3: Client Assignment (select existing client contact or create new)
- Step 4: Team Assignment (assign roles: listing agent, TC, marketing coord, staging lead)
- Step 5: Pipeline & Phase (select pipeline type, starting phase, target list date)
- Step 6: Review & Create (summary of all inputs)
- Auto-save on each step transition

**Data Displayed:**
- Address auto-populated data from public records (if available via integration)
- Client contact search/autocomplete
- Team member list with roles
- Pipeline phase options

**Actions Available:**
- Navigate between steps (back/next)
- Save as draft at any step
- Create contact inline (modal) if client doesn't exist
- Submit to create listing
- Skip optional steps

**Empty State:**
N/A (this is a creation flow). If no team members exist to assign, prompt to invite team members first.

**AI Surfaces Here:**
- Address autocomplete pulls public record data to pre-fill property details
- Pricing suggestion: "Based on recent comps, suggested list price range: $X-$Y"
- Auto-suggest team assignments based on past similar listings and current workload

**Mobile Considerations:**
- Single-column form, one step at a time
- Large input fields, optimized for thumb entry
- Address autocomplete with GPS-based suggestions
- Camera button for quick property photo capture
- Voice input option for notes fields

---

### P06 -- Listing Detail: Overview
**Route:** `/(app)/listings/[listingId]`

**Layout Pattern:** Listing detail shell with hero header (property photo, address, price, phase badge, key dates) + horizontal tab navigation. Overview tab shows a 2-column summary grid on desktop, single column on mobile.

**Key Components:**
- Hero header: property photo (carousel if multiple), full address, list price, current phase badge, days on market, MLS number
- Phase progress bar (visual timeline of lifecycle phases, current highlighted)
- Property details card: beds, baths, sqft, lot, year built, property type, special features
- Key dates card: listed date, target dates, next milestone
- Team assignments card: assigned members with roles, clickable to contact
- Client info card: client name, contact info, portal status
- Recent activity mini-feed (last 5 items)
- Quick stats row: total tasks (done/total), documents count, showing count, offer count
- Action buttons: Edit Details, Change Phase, Share with Client

**Data Displayed:**
- Complete property metadata
- Current lifecycle phase with visual progress
- Assigned team members and their roles
- Client info and portal access status
- Summary metrics from all sub-sections (tasks, docs, showings, offers)
- Last 5 activity items

**Actions Available:**
- Edit property details (inline or modal)
- Change listing phase (with gate validation)
- Navigate to any tab for detail
- Contact team members (email, in-app message)
- Share listing with client (invite to portal)
- Archive or delete listing
- Print/export listing summary

**Empty State:**
Only partially applicable -- the overview always shows property details. If no activity yet: "No activity recorded. Start by creating tasks or sending a message."

**AI Surfaces Here:**
- Phase recommendation: "This listing is ready to move to Content Production based on completed tasks"
- Key insight card: "Showing interest is 40% above average for this price point"
- Risk flag: "3 overdue tasks may delay your target list date"

**Mobile Considerations:**
- Hero header with swipeable photo carousel
- Collapsible sections (property details, team, client)
- Sticky tab bar below header
- Quick-action buttons pinned at bottom (Call Client, Add Note, Change Phase)

---

### P07 -- Listing Detail: Activity Feed
**Route:** `/(app)/listings/[listingId]/activity`

**Layout Pattern:** Single-column chronological feed with a compose bar at top. Filters above the feed.

**Key Components:**
- Compose bar: text input with rich media support (attach photo, document, voice memo), mention team members
- Filter chips: All, Messages, Emails, Notes, Voice Memos, System Events, AI Insights
- Activity items: chronological cards showing sender avatar, timestamp, content type icon, content preview
- Voice memo player inline (waveform + play button)
- Email thread expansion (collapsed by default, expand to see full thread)
- System event items (phase changes, task completions, document uploads)
- AI-extracted action items highlighted with a distinct style (amber sidebar)
- Load more / infinite scroll

**Data Displayed:**
- All communications associated with this listing: in-app messages, synced emails, SMS (Phase 2), notes, voice memos
- System events: phase transitions, task status changes, document uploads, client portal actions
- AI-generated items: action item extractions, sentiment flags, unanswered message alerts
- Each item: author, timestamp, type icon, content, associated contacts

**Actions Available:**
- Post new message/note with attachments
- Record voice memo inline
- Reply to specific items (threaded)
- Mark AI action items as done or dismiss
- Filter by type
- Search within feed
- Pin important items to top

**Empty State:**
"No activity yet for this listing. Post a note or send a message to get started." Illustration of a chat bubble.

**AI Surfaces Here:**
- Action item extraction: "Contractor said quote will be ready by Friday" highlighted with auto-created follow-up task link
- Unanswered message flag: "Client asked about paint color 2 days ago -- no response logged"
- Sentiment indicator on client messages (neutral/positive/concerned)
- Auto-threading: emails and messages grouped by conversation topic

**Mobile Considerations:**
- Full-screen feed optimized for scrolling
- Compose bar pinned at bottom (expands to full composer)
- Voice memo capture with one-tap record
- Swipe right on item to pin, left to flag for follow-up
- Pull-to-refresh

---

### P08 -- Listing Detail: Tasks
**Route:** `/(app)/listings/[listingId]/tasks`

**Layout Pattern:** Tasks organized by lifecycle phase in collapsible sections. Toolbar at top with filters and "Add Task" button.

**Key Components:**
- Phase section headers (collapsible): each phase shows its task count and completion progress bar
- Task rows: checkbox, title, assignee avatar, due date, priority indicator, dependency icon
- Subtask expansion (indent nested under parent)
- Add Task button (opens inline form or modal)
- Filter bar: assignee, status (todo/in-progress/done/overdue), priority, due date range
- Bulk action toolbar on multi-select
- Task detail slide-over panel (click task to open): full description, comments, attachments, subtasks, history

**Data Displayed:**
- All tasks for this listing organized by lifecycle phase
- Per task: title, assignee, due date, priority (low/medium/high/urgent), status, dependency arrows
- Phase completion percentage
- Overdue tasks highlighted in red
- Upcoming tasks for current phase emphasized

**Actions Available:**
- Toggle task complete (checkbox)
- Create new task (inline or modal with: title, description, assignee, due date, priority, phase, dependencies)
- Edit task details (slide-over)
- Reorder tasks via drag-and-drop within a phase
- Set task dependencies
- Add subtasks
- Bulk complete, reassign, or reschedule
- Filter and search

**Empty State:**
"No tasks yet. Add tasks manually or apply a task template for this listing's phase." CTA buttons: "Add Task" and "Apply Template."

**AI Surfaces Here:**
- Auto-generated tasks when a phase transition occurs (from templates)
- Task prioritization suggestions: "Recommend completing 'Schedule Photography' before 'Draft MLS Copy' for smoother workflow"
- Overdue escalation: highlighted tasks with suggested reassignment if assignee is over-capacity

**Mobile Considerations:**
- Swipeable task rows: swipe right to complete, swipe left to snooze/reschedule
- Collapsible phase sections (only current phase expanded by default)
- FAB for "Add Task"
- Task detail opens as full-screen view (not slide-over)
- Quick-complete mode: simplified view showing only today's tasks with large checkboxes

---

### P09 -- Listing Detail: Documents
**Route:** `/(app)/listings/[listingId]/documents`

**Layout Pattern:** File manager grid/list view with category sidebar (desktop) or category tabs (mobile).

**Key Components:**
- Category navigation: Disclosures, Inspection Reports, Title Documents, Contracts & Addenda, Marketing Materials, Photos, Other
- Document grid/list toggle
- Grid view: thumbnail cards with filename, type icon, date, status badge (signed/pending/draft)
- List view: sortable table with columns (name, category, date added, added by, status, size)
- Upload area: drag-and-drop zone + upload button
- Document viewer (modal/slide-over): preview document with actions
- Disclosure checklist panel (for California TDS, SPQ, NHD, etc.): checklist showing required vs. completed
- E-signature status badges (DocuSign integration): sent, viewed, signed, completed
- Bulk upload support
- Search bar

**Data Displayed:**
- All documents for this listing organized by category
- Per document: filename, type, upload date, uploaded by, file size, version number, signature status
- Disclosure checklist completion status
- E-signature tracking per document

**Actions Available:**
- Upload documents (drag-and-drop or file picker)
- Download, preview, share, delete documents
- Categorize/recategorize documents
- Send for e-signature (DocuSign integration)
- Assemble disclosure package (one-click compile)
- Version management (upload new version)
- Share document to client portal
- Bulk operations: download all, move category, delete

**Empty State:**
Illustration of a folder. "No documents uploaded yet. Drag files here or click Upload to add documents." Category sections show empty state individually: "No disclosures yet -- upload or generate from checklist."

**AI Surfaces Here:**
- Auto-categorization suggestions on upload: "This looks like an inspection report. File under Inspection Reports?"
- Disclosure compliance check: "Missing required documents: Transfer Disclosure Statement, Natural Hazard Disclosure"
- Expiration alerts: "Home warranty document expires in 15 days"

**Mobile Considerations:**
- List view default (thumbnails are hard to read on mobile)
- Category tabs as horizontal scroll
- Upload via camera capture or file picker
- Document preview opens in system viewer
- Simplified disclosure checklist as a vertical scrollable list with checkmarks

---

### P10 -- Listing Detail: Financials
**Route:** `/(app)/listings/[listingId]/financials`

**Layout Pattern:** Dashboard-style layout with summary cards at top, then tabbed sections below: Budget, Quotes, Expenses, P&L.

**Key Components:**
- Summary cards row: Total Budget, Spent to Date, Remaining, Pending Quotes
- Budget tab: line-item budget table (category, budgeted amount, actual, variance)
- Quotes tab: active and historical quotes with vendor, amount, status (requested/received/approved/declined)
- Expenses tab: expense entries with vendor, amount, category, date, invoice link
- P&L tab: profit & loss summary (investment total, projected/actual sale price, commission, net)
- Add Expense button (modal form)
- Request Quote button (links to vendor quote workflow)
- Client-facing toggle: preview what the client sees in portal
- Export button (PDF, CSV)

**Data Displayed:**
- Budget line items by category (staging, photography, marketing, repairs, etc.)
- All quotes received with vendor details and comparison
- All expenses logged with invoice associations
- Running P&L calculation

**Actions Available:**
- Add/edit budget line items
- Log expenses with receipt/invoice upload
- Request new quote from vendor
- Approve/decline quotes
- Send cost summary to client portal for approval
- Export financial summary
- Mark invoice as paid

**Empty State:**
"No financial data yet. Start by setting a budget for this listing." CTA: "Set Budget." Quotes section: "No quotes requested. Browse vendors to request quotes."

**AI Surfaces Here:**
- Budget benchmarking: "Staging budget is 20% higher than your team's average for similar properties"
- ROI projection: "Based on historical data, this $8K staging investment typically yields $20-30K in price lift"
- Cost anomaly: "This photography quote is 40% above your usual vendor rate"

**Mobile Considerations:**
- Summary cards as horizontal scroll
- Tab sections as full-width accordion panels
- Expense logging with receipt photo capture
- Simplified P&L view (top-line numbers, expandable detail)

---

### P11 -- Listing Detail: Marketing
**Route:** `/(app)/listings/[listingId]/marketing`

**Layout Pattern:** Content gallery at top, production timeline/checklist below, advertising metrics at bottom.

**Key Components:**
- Photo gallery: grid of listing photos with reorder, add, remove
- Content production checklist: photography (scheduled/complete), videography, floorplan, virtual tour, MLS copy, print materials, social posts
- Social media post tracker: scheduled posts across platforms with status
- Advertising metrics cards: platform, impressions, clicks, cost, leads generated
- Content asset library: all marketing assets (PDFs, images, videos) downloadable
- Marketing timeline: Gantt-style or checklist view of production milestones

**Data Displayed:**
- All marketing assets and their production status
- Social media post schedule and performance
- Advertising campaign metrics (if integrated)
- Photography/video scheduling details
- Content approval status (client approved MLS copy? listing description?)

**Actions Available:**
- Upload marketing assets
- Schedule content production milestones
- Create/schedule social media posts (integration required)
- Reorder photos
- Share assets to client portal for approval
- Download marketing package
- Track advertising spend

**Empty State:**
"No marketing assets yet. Start by scheduling photography or uploading existing content." Checklist shows all items as pending.

**AI Surfaces Here:**
- Content production sequence suggestion: "Schedule photography after staging is complete (staging marked done 2 days ago)"
- Platform performance comparison: "Instagram posts for similar properties get 3x engagement vs. Facebook"
- Optimal posting time suggestion

**Mobile Considerations:**
- Photo gallery with swipe and pinch-to-zoom
- Checklist view as primary (tap to expand each item)
- Camera integration for on-site photo capture
- Simplified metrics cards

---

### P12 -- Listing Detail: Showings & Open Houses
**Route:** `/(app)/listings/[listingId]/showings`

**Layout Pattern:** Two-section layout: Upcoming/Past Showings list at top, Open Houses section below. Calendar view toggle available.

**Key Components:**
- Showing list: date/time, agent name, buyer info (if provided), status (scheduled/completed/cancelled/no-show), feedback status
- Open House cards: date/time, host, attendee count, feedback summary
- Calendar view toggle (mini calendar with showing dots)
- Add Showing button (modal: date, time, agent, notes)
- Add Open House button (modal: date, time, host, setup notes)
- Feedback collection panel: expandable per showing with structured fields (interest level, price feedback, property feedback, buyer status)
- Conversion funnel mini-chart: showings -> interested -> offer
- Attendance log for open houses (digital sign-in data)

**Data Displayed:**
- All showings with agent, time, and feedback
- All open houses with attendance and feedback summary
- Conversion metrics: total showings, feedback submitted rate, interest level distribution, offers generated
- Showing trend chart (weekly volume)

**Actions Available:**
- Schedule new showing or open house
- Log feedback for a showing (structured form)
- View/export attendee list for open house
- Send follow-up to showing agents
- Cancel/reschedule showing
- Generate showing activity report for client

**Empty State:**
"No showings or open houses scheduled yet. List this property to start receiving showing requests." Calendar is empty.

**AI Surfaces Here:**
- Showing volume trend: "Showings are down 25% this week vs. last week"
- Feedback pattern: "3 of last 5 agents mentioned price as a concern"
- Conversion insight: "Open houses generate 2x more follow-up interest than private showings for this listing"
- Follow-up reminder: "Agent Johnson showed 5 days ago and provided positive feedback -- no follow-up logged"

**Mobile Considerations:**
- List view default (not calendar)
- Quick-feedback form accessible from showing card (one-tap to expand)
- Open house check-in mode: full-screen attendee sign-in form (see P38)
- Push notification integration: "Showing in 30 minutes at 123 Main St"

---

### P13 -- Listing Detail: Offers
**Route:** `/(app)/listings/[listingId]/offers`

**Layout Pattern:** Offer pipeline at top (status columns), comparison matrix below (side-by-side cards).

**Key Components:**
- Offer status pipeline: Received | Under Review | Countered | Accepted | Declined (visual horizontal flow)
- Offer cards: buyer name/agent, price, terms summary, contingencies, timeline, qualification status
- Side-by-side comparison matrix: tabular comparison of all active offers across key dimensions (price, financing, contingencies, close date, escalation clauses)
- Offer detail slide-over: full structured data, counter history, documents, communication log
- Add Offer button (structured intake form)
- Counter-offer builder: form to create counter terms
- Client share button: send comparison to portal for client review
- Offer timeline: visual history of offer/counter/response chain

**Data Displayed:**
- All offers with status, key terms, and qualification details
- Comparison matrix: price, financing type, down payment, contingencies (inspection, appraisal, loan), close date, escalation, special terms
- Counter-offer history per offer
- Client approval status (client has reviewed? decided?)

**Actions Available:**
- Add new offer (structured form: price, buyer agent, financing, contingencies, close date, escalation, special terms)
- Counter an offer (creates new version with modified terms)
- Accept/decline offer
- Share offer summary to client portal
- Request additional documentation from buyer's agent
- Compare offers side-by-side
- Export offer comparison report (PDF)

**Empty State:**
"No offers received yet." Pipeline shows empty columns. "When this listing is active, offers will appear here as they're submitted."

**AI Surfaces Here:**
- Offer strength analysis: "Offer A has strongest terms -- all-cash, no contingencies, 14-day close"
- Market context: "Offer price is 3% above asking, which is consistent with current market velocity"
- Negotiation suggestion: "Based on buyer's pre-approval and market conditions, a counter at $X may be effective"
- Risk flag: "Offer B has appraisal contingency -- comps suggest potential appraisal gap of $15K"

**Mobile Considerations:**
- Offer cards as a swipeable horizontal carousel
- Comparison as a vertically scrollable card (one offer per screen, swipe between)
- Quick actions: accept/counter/decline as bottom buttons
- Share to client as a one-tap action

---

### P14 -- Listing Detail: Analytics
**Route:** `/(app)/listings/[listingId]/analytics`

**Layout Pattern:** Metrics dashboard with chart cards arranged in a responsive grid.

**Key Components:**
- Views & Saves chart: line graph of Zillow/Redfin/Realtor.com daily views and saves over time
- Traffic sources breakdown: pie/donut chart by platform
- Showing volume chart: bar chart of weekly showing requests
- Days on Market gauge/counter with benchmark comparison
- Comp analysis section: comparable sales table with adjustments
- Price change impact overlay: vertical lines on charts marking price changes with before/after metrics
- Interest score card: AI-calculated composite metric
- Export/share button (PDF report for client)

**Data Displayed:**
- Daily/weekly view counts from Zillow, Redfin, Realtor.com
- Save/favorite counts
- Showing request volume over time
- Days on market vs. comparable average
- Comparable sales data: address, price, sqft, beds/baths, days on market, sale date, adjusted value
- AI-generated comp narrative

**Actions Available:**
- Adjust date range for charts
- Toggle platforms on/off in charts
- Adjust comp parameters (radius, time window, property filters)
- Generate comp package for client
- Export analytics report (PDF)
- Share analytics to client portal

**Empty State:**
"Analytics will populate once this listing is active on the market and integration data begins syncing." Show placeholder chart outlines.

**AI Surfaces Here:**
- Comp narrative: "Based on 6 comparable sales, suggested price range is $1.2M-$1.35M"
- Interest decay detection: "Views down 30% week-over-week -- consider refreshing marketing or adjusting price"
- Price change impact: "Views increased 45% in 48 hours following the price adjustment"
- Optimal timing: "Based on seasonal patterns, listing in the next 2 weeks positions ahead of 4 comparable properties"

**Mobile Considerations:**
- Stacked single-column charts (full-width)
- Swipeable chart cards
- Simplified comp table (key columns only, tap to expand)
- Share report via native share sheet

---

### P15 -- Listing Detail: Client Portal Settings
**Route:** `/(app)/listings/[listingId]/portal-settings`

**Layout Pattern:** Settings form with preview panel on the right (desktop) or below (mobile).

**Key Components:**
- Portal visibility toggles: which sections the client can see (activity feed, documents, financials, showings, offers, analytics)
- Document sharing control: per-document toggle for portal visibility
- Approval queue: pending items waiting for client decision (quotes, marketing copy, offers, price changes)
- Portal preview panel: live preview of what the client sees
- Client access management: invite/revoke client access, magic link regeneration
- Notification settings: what triggers alerts to the client (new activity, new approval request, weekly summary)

**Data Displayed:**
- Current portal configuration per section
- List of shared/hidden documents
- Pending approval items with status
- Client access status (active, last login, invited but not yet accessed)

**Actions Available:**
- Toggle section visibility on/off
- Share/unshare individual documents
- Create approval request (sends to client portal)
- Preview portal as client
- Invite client to portal (sends magic link email)
- Revoke client access
- Configure notification triggers

**Empty State:**
"Client portal has not been set up yet. Invite your client to give them visibility into their listing's progress." CTA: "Invite Client."

**AI Surfaces Here:**
- Smart defaults: "Based on this listing's phase, we recommend showing these sections to the client"
- Approval reminder: "2 pending approvals have been waiting 3+ days"

**Mobile Considerations:**
- Toggle switches for section visibility
- Simplified approval queue as card list
- Preview button opens portal in mobile browser view
- Client invite via native share (magic link)

---

### P16 -- All Contacts
**Route:** `/(app)/contacts`

**Layout Pattern:** Searchable data table with filter sidebar. Contact type tabs at top.

**Key Components:**
- Type tabs: All | Clients | Agents | Vendors | Other (lenders, title, inspectors)
- Search bar with autocomplete
- Contact table: name, type, company/brokerage, email, phone, last interaction, associated listings
- Filter panel: contact type, tag, last interaction date, associated listing
- Add Contact button (modal form)
- Import contacts button (CSV upload)
- Alphabet sidebar for quick scroll (mobile)

**Data Displayed:**
- All contacts with key info and last interaction date
- Contact type badges
- Tags/segments
- Associated listing count
- Relationship strength indicator (for agents)

**Actions Available:**
- Search and filter contacts
- Click to navigate to contact detail
- Add new contact
- Import contacts from CSV
- Bulk tag/categorize
- Export contact list
- Quick actions: email, call (click-to-call)

**Empty State:**
"No contacts yet. Add your first contact or import from a CSV file." Illustration of a person with a plus icon.

**AI Surfaces Here:**
- Suggested contact merges: "John Smith (2 records) may be the same person -- merge?"
- Stale relationship flag: "Haven't interacted with 15 contacts in 6+ months"

**Mobile Considerations:**
- Card list instead of table
- Alphabet quick-scroll sidebar
- Sticky search bar at top
- Swipe right on contact to call, left to email
- Add Contact FAB

---

### P17 -- Clients
**Route:** `/(app)/contacts/clients`

**Layout Pattern:** Same as All Contacts but pre-filtered to client type. Additional client-specific columns.

**Key Components:**
- Client list with columns: name, property address (active listing), listing phase, last contact, portal status (active/invited/not set up), satisfaction indicator
- Active/Past toggle
- Client cards showing their listing association prominently

**Data Displayed:**
- All clients (active and historical)
- Their associated listings and current phases
- Portal access status
- Last communication date
- Client satisfaction indicator (based on response time and milestone delivery)

**Actions Available:**
- All of P16 actions
- Filter by listing, phase, portal status
- Quick invite to client portal
- Send message to client

**Empty State:**
"No clients yet. Clients are automatically created when you assign them to a listing."

**AI Surfaces Here:**
- At-risk client detection: "No communication with client in 7 days during active marketing phase"
- Satisfaction scoring based on interaction patterns

**Mobile Considerations:**
- Same as P16 with client-specific card layout

---

### P18 -- Agent Network
**Route:** `/(app)/contacts/agents`

**Layout Pattern:** Contact list with enhanced relationship columns. Split view on desktop: list on left, selected agent detail/notes on right.

**Key Components:**
- Agent list: name, brokerage, specialties, market areas, relationship strength, last interaction, logged buyer needs count
- Filter panel: brokerage, specialty, market area, relationship strength, has active buyer needs
- Add Agent button
- Quick Note button (add interaction note/voice memo to selected agent)
- "Who's Looking for What" link (navigates to P19)
- Relationship strength indicators (color-coded: strong, moderate, new, stale)

**Data Displayed:**
- All external agents in the team's network
- Relationship strength score (interaction frequency and recency)
- Logged buyer needs summary per agent
- Specialty tags and market focus areas
- Last interaction date and summary

**Actions Available:**
- Add new agent contact
- Log interaction (note, voice memo) with an agent
- View agent detail
- Filter by any dimension
- Navigate to Intelligence view
- Quick-capture: "Talked to [agent] about..." form

**Empty State:**
"Build your agent network. Log conversations with agents you meet at open houses, networking events, and showings." Illustration of a network graph. CTA: "Add First Agent."

**AI Surfaces Here:**
- Connection suggestions: "You met Sarah Kim 3 weeks ago. She has a buyer matching your new listing at 456 Oak."
- Stale relationship alerts: "15 agents in your network haven't been contacted in 3+ months"
- Network growth stats: "You've added 8 agents this month"

**Mobile Considerations:**
- Card list with relationship strength color accent
- One-tap voice memo capture associated with selected agent
- Quick-capture from open house or field context
- GPS-tagged interaction logging

---

### P19 -- Agent Network Intelligence
**Route:** `/(app)/contacts/agents/intelligence`

**Layout Pattern:** Dashboard with filterable cards/table showing logged buyer needs matched against listings.

**Key Components:**
- "Who's Looking for What" table/cards: agent name, buyer description, requirements (beds, baths, price range, location, features), date logged, match status
- Active matches panel: buyer needs matched to team's active/upcoming listings
- Filter bar: location, price range, property type, date logged
- Match quality indicator (strong, partial, weak)
- Action button per match: "Reach out to [Agent]" (pre-fills message with listing details)
- Add Buyer Need button (log a new need from agent conversation)
- Sort: by match quality, recency, agent relationship strength

**Data Displayed:**
- All logged buyer needs from agent network
- AI-matched listings for each need
- Match quality score and reasoning
- Agent contact info and relationship history
- Time since need was logged

**Actions Available:**
- Add new buyer need (agent, buyer profile, requirements)
- Filter and sort needs
- Click match to see listing detail
- Send outreach to agent about a match
- Dismiss/archive old needs
- Export matched listings report

**Empty State:**
"No buyer needs logged yet. When you talk to agents, log what their buyers are looking for. HomeTrack will automatically match them to your listings." Illustration of a matchmaking concept.

**AI Surfaces Here:**
- This is a primary AI feature page -- all matches are AI-generated
- Match reasoning: "Sarah Kim's buyer wants 4BR in Los Gatos under $2.5M -- your listing at 789 Elm (4BR, $2.4M, Los Gatos) is a 95% match"
- Proactive match alerts: new matches since last visit highlighted
- Suggested outreach timing: "Contact within 48 hours for best response rates"

**Mobile Considerations:**
- Match cards as primary view (scrollable list)
- One-tap "Call Agent" or "Text Agent" from match card
- Quick-add buyer need from voice memo
- Push notifications for new high-quality matches

---

### P20 -- Contact Detail
**Route:** `/(app)/contacts/[contactId]`

**Layout Pattern:** Profile header with tabbed content sections below: Overview, Interactions, Listings, Notes.

**Key Components:**
- Profile header: name, photo/avatar, type badge, company/brokerage, contact info (email, phone, address)
- Contact info card: all contact details, editable inline
- Interaction timeline: chronological feed of all interactions across all listings (messages, emails, notes, voice memos, meetings)
- Associated listings card: all listings this contact is involved with, their role, and status
- Notes section: free-form notes and voice memo transcriptions
- Tags/segments: editable tag list
- Relationship score (for agents): visual indicator with breakdown
- Quick actions: email, call, message, log interaction

**Data Displayed:**
- Full contact profile
- Complete interaction history across all listings
- All associated listings with role (client, buyer agent, vendor, etc.)
- Tags and segments
- Relationship score breakdown (agents only)
- For agents: logged buyer needs
- For vendors: performance metrics, quote history

**Actions Available:**
- Edit contact info
- Log new interaction (note, voice memo, email, meeting)
- Navigate to any associated listing
- Add/remove tags
- Delete contact (with confirmation)
- Merge with duplicate contact
- Share contact

**Empty State:**
Newly created contact: "No interactions yet. Start building the relationship by logging your first interaction."

**AI Surfaces Here:**
- Interaction summary: "Last 30 days: 5 emails, 2 calls, 1 showing"
- Relationship health: "Communication frequency has decreased 50% this month"
- For agents: buyer need matches highlighted
- Contact enrichment suggestions: "Found LinkedIn profile matching this contact"

**Mobile Considerations:**
- Profile header with large tap targets for call/email/message
- Interaction timeline as scrollable feed
- Voice memo recording inline
- Click-to-call and click-to-email integration

---

### P21 -- Vendor Directory
**Route:** `/(app)/vendors`

**Layout Pattern:** Filterable card grid (desktop) or card list (mobile) organized by category.

**Key Components:**
- Category tabs/filter: Stagers, Photographers, Contractors, Inspectors, Landscapers, Handypeople, Other
- Vendor cards: name, company, category, rating (stars), availability status, average cost range, reliability score
- Search bar
- Sort options: rating, cost, availability, most used
- Performance ranking toggle: view ranked by reliability, cost-effectiveness, or quality
- Add Vendor button
- Compare vendors button (select 2-3 to compare side-by-side)

**Data Displayed:**
- All team vendors organized by category
- Per vendor: name, company, specialties, service area, rating, average cost, response time, jobs completed
- Availability status (available, busy, unavailable)
- Performance metrics summary

**Actions Available:**
- Add new vendor
- Search and filter by category, specialty, service area, availability
- Sort by rating, cost, reliability
- Click to navigate to vendor detail
- Compare selected vendors side-by-side
- Request quote from vendor (links to quote workflow)
- Rate/review a vendor

**Empty State:**
"No vendors in your directory yet. Start building your vendor network." CTA: "Add Vendor." Suggestion: "Import vendors from your contact list."

**AI Surfaces Here:**
- Vendor recommendations: "For staging in Los Gatos, your team has had best results with ABC Staging (4.8 rating, avg $6K)"
- Cost benchmarking: "This vendor's rates are 15% below your team's average for photography"
- Availability prediction: "Based on past patterns, this vendor is typically booked 2 weeks out during spring"

**Mobile Considerations:**
- Card list with large category filter chips at top
- Quick-call button on each vendor card
- Star rating visible at a glance
- Pull-to-refresh for availability updates

---

### P22 -- Vendor Detail
**Route:** `/(app)/vendors/[vendorId]`

**Layout Pattern:** Profile header with stats cards, then tabbed sections: Overview, Quotes, Projects, Reviews.

**Key Components:**
- Profile header: name, company, category, contact info, availability status, overall rating
- Stats cards: jobs completed, avg response time, avg cost, reliability score, quality rating
- Cost history chart: line graph showing cost per job over time
- Quote history table: all quotes from this vendor across listings (date, listing, amount, status)
- Project history: listings this vendor has worked on, with outcome data
- Reviews/ratings: team member reviews with scores and comments
- Edit Vendor / Deactivate button

**Data Displayed:**
- Complete vendor profile
- Performance metrics: response time, cost trends, reliability, quality
- Full quote and project history across all listings
- Team reviews and ratings

**Actions Available:**
- Edit vendor info
- Request new quote from this vendor
- View quote details
- Navigate to associated listings
- Add review/rating
- Deactivate vendor (soft delete)
- Export vendor performance report

**Empty State:**
Newly added vendor: "No project history yet. Request a quote to start building this vendor's track record."

**AI Surfaces Here:**
- Performance trend: "Response time has improved 20% over last 3 months"
- Cost analysis: "This vendor's rates increased 10% year-over-year, compared to 5% market average"
- Reliability alert: "Last 2 jobs had delayed completion"

**Mobile Considerations:**
- Profile with large call/email buttons
- Stats as horizontal scroll cards
- Simplified quote history (recent 5, "see all" link)
- Review form accessible via bottom sheet

---

### P23 -- Quote Management
**Route:** `/(app)/vendors/quotes`

**Layout Pattern:** Table/card list of all active quotes across all listings, with status filters.

**Key Components:**
- Status filter tabs: All | Requested | Received | Under Review | Approved | Declined
- Quote table/cards: listing, vendor, scope of work, amount, date requested, date received, status, assigned reviewer
- Comparison view: select quotes for same scope to compare side-by-side
- Quote detail slide-over: full scope, vendor notes, cost breakdown, versions, approval chain
- Create Quote Request button (select listing, vendor, describe scope)
- Approval workflow tracker: shows where each quote is in the approval chain

**Data Displayed:**
- All quotes across all listings (filterable to single listing)
- Quote status and approval stage
- Cost breakdowns
- Vendor response times
- Comparison data for competing quotes

**Actions Available:**
- Create new quote request
- Review and approve/decline quotes
- Send quote to client portal for approval
- Compare quotes side-by-side
- Negotiate (create counter/revised scope)
- Export quote comparison report
- Filter by listing, vendor, status, amount range

**Empty State:**
"No quote requests yet. Request quotes from your vendors when you need work done on a listing."

**AI Surfaces Here:**
- Cost benchmarking: "This quote is 25% above typical cost for similar scope"
- Vendor recommendation for scope: "Based on past projects, Vendor A delivers fastest for this type of work"
- Auto-generated scope of work from structured input

**Mobile Considerations:**
- Card list with status badges
- Approval actions (approve/decline) as swipe gestures or large buttons
- Quote comparison as a horizontally scrollable card view
- Push notifications for new quotes received

---

### P24 -- Analytics: Market Intelligence
**Route:** `/(app)/analytics`

**Layout Pattern:** Dashboard with chart cards in a responsive grid. Date range selector at top.

**Key Components:**
- Market overview cards: median price (trend arrow), inventory levels, days on market, list-to-sale ratio
- Market trend charts: median price over time, inventory over time, absorption rate
- Geographic heatmap: price/demand by neighborhood
- Comp analysis tool: search address, view comparable sales with adjustments
- Market velocity gauge: current market speed (buyer's/balanced/seller's)
- Weekly AI market digest (expandable card): summarized trends for the team's primary markets
- Date range selector and geographic area filter

**Data Displayed:**
- Market-wide metrics for team's service areas
- Trend data over configurable time periods
- Comparable sales data
- Market velocity indicators
- AI-generated market narratives

**Actions Available:**
- Adjust date range and geographic filters
- Run comp analysis for specific address
- Generate comp package (PDF) for client presentation
- Export market data
- Save custom market views
- Subscribe to weekly market digest email

**Empty State:**
"Connect your MLS integration to populate market data." Link to Settings > Integrations. Show sample/placeholder charts.

**AI Surfaces Here:**
- This is a primary AI analytics page
- Market narrative: "The Los Gatos 95032 market has shifted toward buyers. Median price down 3% month-over-month, inventory up 15%."
- Comp narratives with adjustment explanations
- Pricing recommendations for active listings based on market conditions
- Seasonal pattern insights

**Mobile Considerations:**
- Stacked single-column charts
- Swipeable market overview cards
- Simplified comp tool (address search + basic results)
- Share market digest via native share

---

### P25 -- Analytics: Listing Performance
**Route:** `/(app)/analytics/listings`

**Layout Pattern:** Aggregate metrics dashboard with per-listing breakdown table below.

**Key Components:**
- Aggregate cards: total active listings, avg views/week, avg showings/week, avg days on market, conversion rate
- Views/saves trend chart: aggregate across all active listings
- Showing volume chart: aggregate weekly showings
- Per-listing performance table: listing, views (7d), saves (7d), showings (7d), days on market, interest score, trend arrow
- Benchmark comparison: your listings vs. market average
- Date range selector

**Data Displayed:**
- Aggregate performance metrics across all active listings
- Per-listing breakdown of views, saves, showings
- Trend data over time
- Market benchmark comparisons
- Interest scores (AI-calculated)

**Actions Available:**
- Filter by listing, date range, metric
- Sort per-listing table by any column
- Click listing row to go to that listing's analytics tab
- Export performance report
- Generate client report for specific listing

**Empty State:**
"Listing performance data will appear once your listings are active and market integrations are connected."

**AI Surfaces Here:**
- Interest decay alerts: listings with declining engagement highlighted
- Outperformers: listings doing significantly better than market average
- Price sensitivity analysis across portfolio

**Mobile Considerations:**
- Summary cards with horizontal scroll
- Per-listing table as card list
- Tap card for mini-chart inline expansion

---

### P26 -- Analytics: Team Performance
**Route:** `/(app)/analytics/team`

**Layout Pattern:** Team scorecard at top, then member-by-member breakdown, then trend charts.

**Key Components:**
- Team scorecard cards: listings closed (period), avg days on market, list-to-sale ratio, total revenue, client satisfaction score
- Team member table: name, role, active tasks, active listings, listings closed, avg days to close, client rating
- Workload distribution chart: bar chart showing task count per member
- Revenue tracking chart: line graph of commission revenue over time
- Revenue forecast card: projected revenue based on pipeline
- Year-over-year comparison toggle
- Date range selector

**Data Displayed:**
- Team-level aggregate performance metrics
- Per-member performance breakdown
- Task and listing workload distribution
- Revenue actuals and projections
- Historical comparison data
- Client satisfaction scores

**Actions Available:**
- Filter by date range, team member, listing type
- Sort member table by any column
- Toggle year-over-year comparison
- Export team performance report
- Drill down to member detail (lists their listings and tasks)

**Empty State:**
"Team performance data builds over time as listings close and tasks are completed. Check back after your first closed listing."

**AI Surfaces Here:**
- Capacity alerts: "Sarah has 45% more active tasks than team average -- consider rebalancing"
- Performance trends: "Team's average days on market has improved 15% quarter-over-quarter"
- Revenue forecast with confidence interval
- Efficiency insights: "Listings with a dedicated TC close 20% faster"

**Mobile Considerations:**
- Scorecard as horizontal scroll cards
- Member list as vertical cards
- Charts simplified to key trend lines
- Share report via native share

---

### P27 -- Analytics: AI Insights
**Route:** `/(app)/analytics/insights`

**Layout Pattern:** Feed-style layout with categorized insight cards. Priority sorting with most actionable items at top.

**Key Components:**
- Insight category tabs: All | Pricing | Relationships | Operations | Market
- Insight cards: icon, category badge, title, description, affected listing/contact, recommended action, dismiss/snooze button
- Priority indicators: urgent (red), important (amber), informational (blue)
- Time-based grouping: Today, This Week, Earlier
- Insight detail expansion: click for full analysis and supporting data
- Action buttons per insight: "Take Action" (navigates to relevant page), "Dismiss", "Snooze"

**Data Displayed:**
- AI-generated insights across all categories
- Per insight: category, priority, title, description, supporting data points, recommended action
- Historical insights (dismissed/actioned)
- Insight hit rate: percentage of acted-upon insights

**Actions Available:**
- Filter by category and priority
- Dismiss or snooze individual insights
- Take action (navigates to relevant page with context)
- View insight history
- Configure insight preferences (which types to receive)
- Rate insight helpfulness (improves future relevance)

**Empty State:**
"AI insights will appear as HomeTrack learns your team's patterns and accumulates data. Most insights require at least 2-3 active listings with engagement data."

**AI Surfaces Here:**
- This is the primary AI insights hub
- All categories: pricing recommendations, relationship matches, operational efficiency suggestions, market alerts, anomaly detection
- Each insight includes reasoning and supporting data

**Mobile Considerations:**
- Scrollable card feed (similar to a notification center)
- Swipe right to dismiss, swipe left to snooze
- One-tap "Take Action" navigates to context
- Push notification integration for urgent insights

---

### P28 -- Settings: Team Management
**Route:** `/(app)/settings`

**Layout Pattern:** Settings shell with left sidebar navigation (desktop) or section list (mobile). Team management is the default/first settings page.

**Key Components:**
- Team info card: team name, logo, primary market area, plan type
- Member list table: name, email, role, status (active/invited/deactivated), last active, actions
- Invite member form: email, role selection
- Role management section: view/edit roles and their permissions
- Custom role creation (for Team Admin only)
- Pending invitations list with resend/revoke

**Data Displayed:**
- Team metadata
- All team members with roles and status
- Pending invitations
- Role definitions and permission matrices

**Actions Available:**
- Edit team info (name, logo, market area)
- Invite new team member (sends invite email)
- Change member role
- Deactivate member
- Create custom role
- Edit role permissions
- Resend or revoke invitations

**Empty State:**
N/A (team always has at least the admin). If no other members: "You're the only team member. Invite your team to start collaborating."

**AI Surfaces Here:**
- Not heavily AI-integrated. Possible: "Based on your team size and listing volume, consider adding a Transaction Coordinator role."

**Mobile Considerations:**
- Member list as card view
- Invite form as full-screen modal
- Simplified role management (predefined roles only, custom roles on desktop)

---

### P29 -- Settings: Integrations
**Route:** `/(app)/settings/integrations`

**Layout Pattern:** Integration card grid organized by category. Each card shows connection status.

**Key Components:**
- Category sections: Email & Calendar, MLS & Market Data, E-Signatures, Accounting, Messaging, Social Media, Other
- Integration cards: service logo, name, description, status (connected/disconnected/error), connected account info
- Connect/Disconnect button per integration
- OAuth flow popup for connection
- Integration health indicators (last sync, errors, data freshness)
- Webhook configuration section (for advanced users)

**Data Displayed:**
- All available integrations by category
- Connection status and account details for connected integrations
- Last sync time and health status
- Available webhook subscriptions

**Actions Available:**
- Connect new integration (OAuth flow)
- Disconnect integration
- View sync status and logs
- Configure webhook URLs
- Test integration connection
- View integration-specific settings (sync frequency, data scope)

**Empty State:**
All integrations shown as "Not Connected" with "Connect" CTA. "Connect your tools to unlock HomeTrack's full potential. We recommend starting with Email and MLS."

**AI Surfaces Here:**
- Integration recommendations: "Connecting Zillow would unlock view/save analytics for your listings"
- Health alerts: "Gmail sync hasn't completed in 24 hours -- check connection"

**Mobile Considerations:**
- Integration cards as a single-column list
- OAuth flow opens in system browser
- Simplified view (connect/disconnect only, advanced settings on desktop)

---

### P30 -- Settings: Workflows & Automations
**Route:** `/(app)/settings/workflows`

**Layout Pattern:** Two sections: Phase Configuration (top) and Automation Rules (bottom).

**Key Components:**
- Pipeline phase editor: drag-and-drop reorder of lifecycle phases, add/remove phases, configure phase gates
- Task template editor: per-phase default task sets (add/edit/remove tasks, set default assignee by role, set dependencies)
- Automation rules list: rule name, trigger event, conditions, actions, enabled toggle
- Add Automation button: rule builder (if trigger X and condition Y, then action Z)
- Preview: "When a listing enters [phase], these tasks will be created..."
- Multi-pipeline support: select pipeline type to configure

**Data Displayed:**
- Current lifecycle phases with order and gate conditions
- Task templates per phase
- All automation rules with trigger, condition, action descriptions
- Rule execution history (last triggered, success/failure)

**Actions Available:**
- Reorder, add, remove lifecycle phases
- Configure phase gate conditions
- Create/edit task templates per phase
- Create/edit automation rules
- Enable/disable automations
- Test automation (dry run)
- Duplicate pipeline configuration for new pipeline type

**Empty State:**
Default pipeline phases are pre-populated. Task templates and automations start empty: "Create task templates to auto-generate tasks when listings enter each phase."

**AI Surfaces Here:**
- Template suggestions: "Teams similar to yours typically include these tasks in the Content Production phase"
- Automation suggestions: "Consider an automation: 'When photography is marked complete, notify client and create MLS draft task'"

**Mobile Considerations:**
- Read-only view on mobile (editing complex workflows is a desktop task)
- View current phases and task templates
- Toggle automations on/off
- Link to desktop for editing

---

### P31 -- Settings: Notification Preferences
**Route:** `/(app)/settings/notifications`

**Layout Pattern:** Category-based notification settings with channel toggles (in-app, email, push).

**Key Components:**
- Notification categories: Tasks (assigned, overdue, completed), Messages (new message, client message), Listings (phase change, new offer, showing request), AI Alerts, System
- Per-category channel toggles: In-App | Email | Push (mobile)
- Quiet hours configuration (don't send push notifications between X and Y)
- Per-listing override option (get all notifications for specific listings)
- Summary digest preference: real-time, daily digest, weekly digest

**Data Displayed:**
- Current notification preferences per category and channel
- Quiet hours schedule
- Per-listing overrides

**Actions Available:**
- Toggle notification channels per category
- Set quiet hours
- Add per-listing notification overrides
- Choose digest frequency
- Test push notification

**Empty State:**
Defaults are pre-populated (all notifications enabled). Not truly empty.

**AI Surfaces Here:**
- "You receive 45+ notifications per day. Consider switching Tasks to daily digest."

**Mobile Considerations:**
- Full-width toggle switches
- Simplified categories
- Push notification permission prompt if not granted

---

### P32 -- Settings: Billing & Subscription
**Route:** `/(app)/settings/billing`

**Layout Pattern:** Billing dashboard with plan info, usage, payment method, and invoice history.

**Key Components:**
- Current plan card: plan name, price, billing cycle, next billing date
- Usage summary: team members, active listings, storage used
- Plan upgrade/downgrade options
- Payment method card: card on file, update button
- Invoice history table: date, amount, status, download link
- Cancel subscription link (with confirmation flow)

**Data Displayed:**
- Current plan details and pricing
- Usage metrics vs. plan limits
- Payment method on file
- Invoice history

**Actions Available:**
- Upgrade/downgrade plan
- Update payment method
- Download invoices
- Cancel subscription
- View usage details

**Empty State:**
N/A (all teams have a plan). Trial period: "You're on a free trial. [X] days remaining. Upgrade to keep your data."

**AI Surfaces Here:**
- Plan optimization: "Based on your usage, the [Plan] would save you $X/month"

**Mobile Considerations:**
- Simplified view: current plan, next bill date, update payment
- Invoice download via native share
- Full plan management on desktop

---

### P33 -- Settings: Client Portal Branding
**Route:** `/(app)/settings/branding`

**Layout Pattern:** Brand settings form on left, live preview on right (desktop). Preview toggles to a separate view on mobile.

**Key Components:**
- Logo upload (team logo for portal header)
- Color scheme picker (primary color, accent color)
- Custom domain configuration (portal.teamname.com)
- Portal welcome message editor
- Footer text configuration
- Email notification branding (logo in emails)
- Live preview panel showing portal with current branding

**Data Displayed:**
- Current branding settings
- Preview of portal appearance
- Custom domain configuration status (DNS verified, pending, not set up)

**Actions Available:**
- Upload/change logo
- Set color scheme
- Configure custom domain (DNS instructions)
- Edit welcome message and footer
- Preview portal
- Reset to defaults

**Empty State:**
Default HomeTrack branding applied. "Customize your client portal to match your team's brand."

**AI Surfaces Here:**
- Minimal AI here

**Mobile Considerations:**
- Form fields with preview button (full-screen preview)
- Logo upload via camera or file picker
- Domain configuration deferred to desktop

---

### P34 -- Settings: Data Management & Exports
**Route:** `/(app)/settings/data`

**Layout Pattern:** Section-based settings page with action buttons.

**Key Components:**
- Data export section: export all data (listings, contacts, documents) as ZIP/CSV
- Import section: import contacts, listings from CSV
- Data retention settings: how long to keep archived listings and old data
- Audit log: table of recent data access and changes (who, what, when)
- GDPR/CCPA tools: client data deletion request, consent management
- Storage usage breakdown: chart showing storage by category (documents, photos, voice memos)

**Data Displayed:**
- Storage usage breakdown
- Recent audit log entries
- Data retention policy settings
- Export history

**Actions Available:**
- Export all data
- Import data from CSV
- Configure data retention
- View audit log
- Process data deletion request
- Download specific data exports (contacts only, listings only)

**Empty State:**
Audit log empty on new teams. "No data exports yet. Export options are available as your data grows."

**AI Surfaces Here:**
- Storage optimization: "12 voice memos older than 1 year could be archived to free 2GB"

**Mobile Considerations:**
- Simplified view: export and storage usage
- Audit log and retention settings on desktop
- Export triggers email with download link

---

### P35 -- Mobile: Voice Memo Capture
**Route:** `/(app)/mobile/voice-memo`

**Layout Pattern:** Full-screen recording interface, mobile-only optimized (also accessible from desktop but designed for mobile).

**Key Components:**
- Large record button (center, prominent)
- Recording timer and waveform visualization
- Listing association picker: dropdown/search to tag memo to a listing
- Contact association picker: tag to a contact or agent
- Auto-transcription result (appears after recording)
- AI summary card (appears after transcription)
- Save/discard buttons
- Recent memos list below

**Data Displayed:**
- Active recording status (timer, waveform)
- Transcription text
- AI-generated summary
- Tagged listing and contact

**Actions Available:**
- Record voice memo (tap to start, tap to stop)
- Tag to listing, contact, or both
- Review transcription
- Edit transcription if needed
- Save or discard
- Re-record
- Play back before saving

**Empty State:**
Just the record button. "Tap to record a voice memo. It will be transcribed and added to your listing's activity feed."

**AI Surfaces Here:**
- Auto-transcription
- AI summary generation: "Summary: Spoke with Sarah Kim about her buyer's interest in Los Gatos properties, 4BR minimum, $2.5M budget. Needs good schools."
- Action item extraction: "Follow up with Sarah about 789 Elm listing"
- Entity recognition: auto-suggest listing and contact tags

**Mobile Considerations:**
- This IS a mobile-first page
- Large, easy-to-tap record button
- Minimal UI during recording (just waveform and timer)
- One-handed operation
- Works offline (syncs on reconnect)
- Haptic feedback on record start/stop

---

### P36 -- Mobile: Field Notes
**Route:** `/(app)/mobile/field-notes`

**Layout Pattern:** Quick-entry form optimized for mobile input. Full-screen single-column.

**Key Components:**
- Text input area (large, multi-line) with voice-to-text button
- Photo capture button (inline camera)
- Photo preview strip (attached photos)
- Listing association picker
- Contact association picker
- Category tags: General, Property Condition, Client Feedback, Agent Intel, Vendor Note
- Save button (prominent)
- Recent notes list below

**Data Displayed:**
- Note being composed
- Attached photos
- Tagged listing/contact
- Recent field notes

**Actions Available:**
- Type note or use voice-to-text
- Capture photos from camera
- Tag to listing and/or contact
- Categorize note
- Save
- View recent notes

**Empty State:**
Empty text field ready for input. "Capture a quick note from the field. Add photos, tag to a listing, and save."

**AI Surfaces Here:**
- Voice-to-text transcription
- Auto-suggest listing/contact tags based on content
- Category auto-detection

**Mobile Considerations:**
- This IS a mobile-first page
- Large text area filling most of screen
- Camera integration for photo capture
- Voice-to-text as primary input method
- Works offline
- GPS tagging for location context

---

### P37 -- Mobile: Showing Feedback
**Route:** `/(app)/mobile/showing-feedback`

**Layout Pattern:** Structured feedback form with rating scales and text areas. Designed for quick completion after a showing.

**Key Components:**
- Listing selector (or pre-populated if navigated from a showing event)
- Showing info header: property address, date/time, agent shown to
- Interest level rating (1-5 scale or emoji scale)
- Price feedback (too high / about right / too low / not discussed)
- Property feedback: likes (checkboxes: location, layout, condition, size, yard, kitchen, etc.) and concerns (same categories)
- Buyer status: actively looking, just started, been looking X months, pre-approved
- Additional comments text area
- Submit button

**Data Displayed:**
- Showing context (which listing, which agent, when)
- Structured feedback being captured

**Actions Available:**
- Select listing and showing to provide feedback for
- Rate interest level
- Complete structured feedback form
- Add free-text comments
- Submit feedback (saves to listing's showings section)

**Empty State:**
"Select a listing and showing to provide feedback." If no recent showings: "No showings to provide feedback for. Schedule a showing first."

**AI Surfaces Here:**
- Pre-populated from scheduled showing data
- AI summary of feedback for client report: "Agent noted strong interest, praised layout and location, buyer is pre-approved and actively looking"
- Pattern detection across feedback: after submission, "This is the 3rd showing where price was flagged as too high"

**Mobile Considerations:**
- This IS a mobile-first page
- Large tap targets for rating scales
- Checkbox grids for likes/concerns
- Quick completion (under 60 seconds)
- Submit confirmation with link to view in listing detail
- Push notification trigger: "You just finished a showing at 123 Main -- submit feedback?"

---

### P38 -- Mobile: Open House Check-In
**Route:** `/(app)/mobile/open-house`

**Layout Pattern:** Full-screen check-in mode designed for attendee self-service on a tablet or phone.

**Key Components:**
- Open house selector (or pre-populated from scheduled event)
- Welcome screen: property photo, address, team branding
- Attendee sign-in form: name, email, phone, how they found the listing, currently working with an agent? (yes/no + name), looking to buy? (timeline), pre-approved?
- Attendee list (host view): real-time list of checked-in attendees with contact info
- Privacy disclaimer / consent checkbox
- Switch between host view and check-in mode
- Exit check-in mode (requires confirmation to prevent accidental exit)

**Data Displayed:**
- Open house details (property, date, host)
- Checked-in attendees with captured info
- Attendee count

**Actions Available:**
- Start check-in mode for an open house
- Attendees fill out sign-in form
- Host views attendee list in real-time
- Export attendee list (email or CSV)
- End open house (captures final count, triggers follow-up tasks)
- Add attendee manually (for those who don't want to sign in digitally)

**Empty State:**
"No open house selected. Choose an upcoming open house to start check-in." If none scheduled: "No open houses scheduled. Create one from the listing's Showings tab."

**AI Surfaces Here:**
- Attendee data auto-creates contacts if they don't exist
- Agent matching: if attendee says they're working with an agent, auto-match to agent network
- Post-event follow-up task generation: "Send thank-you email to 12 attendees"
- Conversion tracking: "3 of 12 attendees from your last open house resulted in showings"

**Mobile Considerations:**
- This IS a mobile/tablet-first page
- Designed for attendee self-service (hand phone/tablet to attendee)
- Large, clear form fields
- Lock to check-in mode (prevent attendees from navigating away)
- Works offline (syncs on reconnect)
- Quick keyboard navigation (tab between fields)

---

### P39 -- Mobile: Quick Task Completion
**Route:** `/(app)/mobile/quick-task`

**Layout Pattern:** Focused task list with oversized completion controls. Only shows today's tasks and overdue tasks.

**Key Components:**
- Task list: today's tasks and overdue tasks, grouped by listing
- Large checkboxes for one-tap completion
- Task card: title, listing name, due date/time, assignee
- Swipe to complete or snooze
- Quick-add task bar at bottom
- Filter chips: My Tasks | All Team Tasks | Overdue

**Data Displayed:**
- Today's tasks for the current user
- Overdue tasks highlighted
- Listing association per task
- Task priority indicators

**Actions Available:**
- Complete task (checkbox or swipe)
- Snooze task (push to tomorrow or custom date)
- Quick-add a new task
- View task details (expand card)
- Navigate to listing detail from task

**Empty State:**
"All caught up! No tasks due today." Celebratory illustration. "Check your upcoming tasks or add a new one."

**AI Surfaces Here:**
- Task prioritization: most impactful tasks at top
- Context: "This task is blocking the phase transition for 123 Main St"

**Mobile Considerations:**
- This IS a mobile-first page
- Extra-large tap targets
- Swipe gestures for complete/snooze
- Minimal text, maximum clarity
- Haptic feedback on completion

---

### P40 -- Client Portal: Dashboard
**Route:** `/(portal)`

**Layout Pattern:** Branded portal layout (team logo, colors). Single-column centered content. Clean, simple, non-overwhelming.

**Key Components:**
- Property hero: large photo, address, current phase badge
- Phase timeline: visual progress bar showing completed and upcoming phases with current position
- Milestone status cards: key milestones with status icons (complete, in-progress, upcoming) -- e.g., "Photography: Complete", "MLS Listing: Scheduled for Thursday", "First Open House: Sunday 1-4pm"
- Recent updates feed: last 5-10 team updates, messages, and shared items
- Pending approvals banner: "You have 2 items to review" (links to approvals page)
- Quick message composer: "Send a message to your team"
- Photo/video gallery: latest property photos, staging progress, marketing materials

**Data Displayed:**
- Listing overview: address, phase, key dates
- Phase progress visualization
- Milestone status (as configured by the team)
- Recent activity from the team (filtered to client-appropriate items)
- Pending approval count

**Actions Available:**
- View phase progress and milestone details
- Send message to team
- Navigate to approvals, messages, documents
- View photo gallery
- Download shared documents

**Empty State:**
"Welcome to your listing portal! Your team is setting things up. You'll see updates here as progress is made." Team logo and welcome message.

**AI Surfaces Here:**
- Milestone ETA predictions: "Based on current progress, photography should be complete by [date]"
- Summary of recent activity: "This week: staging was completed, photography is scheduled, 3 showings occurred"

**Mobile Considerations:**
- This IS heavily mobile-used by clients
- Single column, large text, clear hierarchy
- Phase timeline as horizontal scroll
- Pull-to-refresh
- Bottom nav for portal sections

---

### P41 -- Client Portal: Approvals
**Route:** `/(portal)/approvals`

**Layout Pattern:** Card list of pending and past approvals.

**Key Components:**
- Pending approvals section: cards with approval type, description, date requested, urgency indicator
- Approval detail expansion: full context, comparison view (for quotes or offers), supporting documents
- Approve/Decline buttons (with optional comment)
- Past approvals section: historical decisions with timestamps
- Types of approvals: vendor quotes, pricing decisions, marketing copy, offer responses, improvement plans

**Data Displayed:**
- Pending approval items with full context
- For quotes: side-by-side comparison of options
- For offers: offer comparison matrix
- For pricing: market data supporting the recommendation
- Decision history with timestamps and comments

**Actions Available:**
- Review approval details
- Compare options (for multi-option approvals)
- Approve or decline with optional comment
- View past decisions
- Send question to team about an approval

**Empty State:**
"No pending approvals. Your team will send items here when they need your input." Past approvals section: "No decisions yet."

**AI Surfaces Here:**
- Context for decisions: "This staging quote is 10% below the area average for properties similar to yours"
- Comparison highlights: "Offer A is highest price but has an appraisal contingency. Offer B is all-cash with a faster close."

**Mobile Considerations:**
- Large, clear approve/decline buttons
- Expandable detail cards
- Comparison view as vertical scroll (one option per screen, swipe between)
- Push notification for new approval requests

---

### P42 -- Client Portal: Messages
**Route:** `/(portal)/messages`

**Layout Pattern:** Chat/messaging interface. Thread list on left (desktop), messages on right. Full-screen thread on mobile.

**Key Components:**
- Thread list: conversations organized by topic or date
- Message thread: chronological messages with sender, timestamp, read receipts
- Compose bar: text input, attach photo/document, voice memo
- Rich media display: inline photos, document previews, voice memo player
- Unread indicators on threads
- Team member avatars and names

**Data Displayed:**
- Message threads between client and team
- Shared photos, documents, and voice memos
- Read receipts
- Message timestamps

**Actions Available:**
- Send message with attachments
- Record voice memo
- View shared media
- Search messages
- Mark as read

**Empty State:**
"No messages yet. Send a message to your team to get started!" with compose bar active.

**AI Surfaces Here:**
- Message templates for common questions (client can use): "What's the current status?", "When is the next showing?"

**Mobile Considerations:**
- Full-screen chat experience (like a messaging app)
- Push notifications for new messages
- Photo attachment via camera
- Voice memo recording
- Keyboard-optimized compose bar

---

### P43 -- Client Portal: Documents
**Route:** `/(portal)/documents`

**Layout Pattern:** Simple categorized document list. Clean, non-technical interface.

**Key Components:**
- Category sections: Disclosures, Contracts, Reports, Marketing, Photos, Other
- Document cards: filename, category, date shared, action required badge (if needs signature)
- Document viewer (preview inline or download)
- E-signature action: "Sign this document" button (opens DocuSign)
- Download all button per category

**Data Displayed:**
- Documents shared by the team (only those marked for portal visibility)
- Signature status per document
- Date shared

**Actions Available:**
- View/preview document
- Download document
- Sign document (e-signature integration)
- Download all documents in a category
- Search documents

**Empty State:**
"No documents shared yet. Your team will share documents here as they become available."

**AI Surfaces Here:**
- Document explanation: "This is the Transfer Disclosure Statement -- a required California form disclosing known property conditions."

**Mobile Considerations:**
- Document download triggers native viewer
- E-signature opens in mobile browser (DocuSign mobile flow)
- Large tap targets
- Download confirmation with file size indication

---

### A01 -- Auth: Login
**Route:** `/(auth)/login`

**Layout Pattern:** Centered card on minimal background. HomeTrack branding.

**Key Components:**
- HomeTrack logo and tagline
- Email input field
- "Send Magic Link" button
- Magic link sent confirmation state (check your email illustration)
- "Back to login" link from confirmation state
- Footer: support link, privacy policy, terms

**Data Displayed:**
- Brand elements only

**Actions Available:**
- Enter email
- Submit to send magic link
- Navigate to support

**Empty State:**
N/A (this is the default state)

**AI Surfaces Here:**
- None

**Mobile Considerations:**
- Full-screen centered form
- Large email input
- Keyboard auto-focus on email field
- Magic link opens in mobile browser, auto-authenticates

---

### A02 -- Auth: Invite Accept
**Route:** `/(auth)/invite/[token]`

**Layout Pattern:** Centered card with step flow: (1) Accept invitation, (2) Set up profile.

**Key Components:**
- Team invitation banner: "You've been invited to join [Team Name] as [Role]"
- Inviter info: who sent the invitation
- Accept button
- Profile setup form (appears after accept): name, phone, photo upload (optional)
- Decline link

**Data Displayed:**
- Team name and inviter
- Assigned role
- Team logo (if configured)

**Actions Available:**
- Accept invitation
- Decline invitation
- Complete profile setup
- Upload profile photo

**Empty State:**
Invalid/expired token: "This invitation has expired or is no longer valid. Contact your team admin for a new invite."

**AI Surfaces Here:**
- None

**Mobile Considerations:**
- Full-screen centered flow
- Large buttons
- Photo upload via camera
- Auto-login after accept

---

## 4. Key User Flows

### 4.1 New Listing Creation -> Lifecycle Phases

```
Agent clicks "New Listing" (sidebar or dashboard quick action)
  |
  v
[P05] New Listing Wizard
  Step 1: Enter property address -> auto-populate from public records
  Step 2: Set target price -> AI suggests price range from comps
  Step 3: Assign client -> select existing or create new contact
  Step 4: Assign team roles -> listing agent, TC, marketing, staging
  Step 5: Select pipeline type and starting phase
  Step 6: Review and create
  |
  v
Listing created in starting phase (default: Onboarding)
  -> Task templates auto-generate for the Onboarding phase
  -> Client portal created (not yet invited)
  -> Listing appears on Pipeline Board [P02]
  |
  v
Team works through tasks in each phase
  -> Complete tasks via [P08] Tasks tab or [P39] Quick Task (mobile)
  -> Log activity in [P07] Activity Feed
  -> Upload documents in [P09] Documents
  |
  v
Phase gate check: all required tasks/conditions met?
  -> If yes: agent moves listing to next phase via [P06] Overview
  -> If no: gate violation shown with missing items
  |
  v
Phase transition triggers:
  -> New task set auto-generated for the new phase
  -> Client portal updated with new milestone status
  -> Notifications sent to relevant team members
  -> Automation rules fire (if configured)
  |
  v
Repeat through: Onboarding -> Improvement Planning -> Staging & Prep
  -> Content Production -> Active Marketing -> Showings & Open Houses
  -> Offers & Negotiation -> Under Contract -> Closing
  |
  v
Listing closed -> moved to archive
  -> Final P&L generated
  -> Performance data added to team analytics
  -> Client relationship updated in [P20]
```

### 4.2 Client Portal Experience

```
Team admin invites client via [P15] Portal Settings
  -> Client receives magic link email
  |
  v
Client clicks magic link
  -> [A01] Auth: auto-authenticated
  -> Redirected to [P40] Portal Dashboard
  |
  v
Client views listing progress:
  -> Phase timeline with current position
  -> Milestone status cards
  -> Recent updates from team
  |
  v
Client receives approval request (push/SMS notification):
  -> Opens [P41] Approvals
  -> Reviews vendor quote comparison
  -> Approves preferred vendor
  -> Team notified, vendor confirmed
  |
  v
Client communicates with team:
  -> [P42] Messages: sends question about timeline
  -> Team responds from [P07] Activity Feed (appears in both places)
  |
  v
Client reviews documents:
  -> [P43] Documents: views disclosures, signs via e-signature
  -> Team sees signature status update in [P09]
  |
  v
Offer phase:
  -> Client views offer comparison in [P41] Approvals
  -> Reviews side-by-side matrix with AI context
  -> Approves response to preferred offer
  -> Team executes decision
```

### 4.3 Agent Network Capture (Field / Voice Memo)

```
Agent at an open house meets an external agent (Sarah Kim)
  |
  v
Option A: Voice Memo (mobile)
  -> Taps "Capture" in bottom nav -> "Voice Memo" [P35]
  -> Records: "Talked to Sarah Kim, she has a buyer looking for
     4BR in Los Gatos under $2.5M, needs good schools"
  -> AI transcribes and summarizes
  -> AI extracts: contact (Sarah Kim), buyer need (4BR, Los Gatos, <$2.5M, schools)
  -> Agent confirms suggested tags
  -> Saved to activity feed and agent network
  |
  v
Option B: Quick Note (mobile)
  -> Taps "Capture" -> "Field Note" [P36]
  -> Types or voice-to-text: same info
  -> Tags to Sarah Kim contact (auto-created if new)
  -> Saved
  |
  v
Later (hours/days):
  -> Team gets a new listing: 789 Elm St, 4BR, $2.4M, Los Gatos
  -> AI connection engine matches to Sarah Kim's logged buyer need
  -> AI alert appears on [P01] Dashboard and [P27] AI Insights:
     "Sarah Kim's buyer matches your new listing at 789 Elm (95% match)"
  |
  v
Agent navigates to [P19] Agent Network Intelligence
  -> Sees match card with details
  -> Clicks "Reach Out to Sarah" -> pre-filled message/call
  -> Logs follow-up interaction
```

### 4.4 Vendor Quote Workflow

```
Agent identifies need for staging on a listing
  |
  v
Navigate to [P10] Financials -> Quotes tab
  -> Click "Request Quote"
  -> Select listing, describe scope of work, select vendors (1-3)
  -> Submit
  |
  v
Vendors receive quote request (email notification)
  -> Submit quotes through the platform (or agent enters manually)
  |
  v
[P23] Quote Management: quotes appear as "Received"
  -> Agent reviews quotes
  -> Clicks "Compare" for side-by-side comparison
  -> Selects preferred vendor
  |
  v
Agent sends comparison to client portal for approval:
  -> [P41] Client receives approval notification
  -> Client reviews 3 quotes side-by-side
  -> Client approves Vendor B
  |
  v
Quote status updates to "Approved"
  -> Budget in [P10] Financials updated
  -> Vendor notified of approval
  -> Task auto-created: "Coordinate staging with Vendor B"
  -> Expense tracking begins
```

### 4.5 Offer Management

```
Buyer's agent submits offer (via email or direct submission)
  |
  v
Agent enters offer in [P13] Offers:
  -> Structured form: price, financing, contingencies, close date, etc.
  -> Offer appears as "Received" in pipeline
  |
  v
Additional offers come in -> all entered in [P13]
  |
  v
Agent reviews offers:
  -> Side-by-side comparison matrix
  -> AI analysis of each offer's strength/risk
  |
  v
Agent shares comparison to client portal:
  -> Client views in [P41] Approvals
  -> AI highlights: "Offer A: highest price but appraisal risk.
     Offer B: all-cash, fastest close, $15K below asking."
  |
  v
Client and agent discuss:
  -> [P42] Portal Messages or phone call (logged in [P07] Activity)
  -> Decision: counter Offer A
  |
  v
Agent creates counter-offer in [P13]:
  -> Counter terms entered, status changes to "Countered"
  -> Counter-offer history tracked
  |
  v
Buyer responds -> agent updates offer status
  -> Accepted: listing moves to "Under Contract" phase
  -> Phase transition triggers contract/closing task templates
  -> Other offers declined with notification
```

### 4.6 Mobile Field Workflows

**Showing Feedback Flow:**
```
Agent completes a showing
  -> Push notification: "Submit feedback for 123 Main showing?"
  -> Taps notification -> [P37] Showing Feedback (pre-populated)
  -> Rates interest level, fills structured feedback (30-60 seconds)
  -> Submits
  -> Feedback appears in [P12] Showings tab
  -> If 3+ agents flag price: AI alert generated
```

**Open House Flow:**
```
Agent arrives at open house
  -> Opens [P38] Open House Check-In
  -> Selects open house event
  -> Switches to check-in mode (hands device to attendees)
  -> Attendees fill sign-in form (name, email, phone, buyer status)
  -> Agent switches to host view to see attendee list
  -> Open house ends: agent taps "End Open House"
  -> Follow-up tasks auto-generated: "Send thank-you to 12 attendees"
  -> Attendees auto-added to contacts
  -> Conversion tracking begins
```

**Voice Note Workflow:**
```
Agent in the car after a client meeting
  -> Taps "Capture" in bottom nav
  -> Records 60-second voice memo [P35]
  -> AI transcribes and summarizes
  -> AI extracts action items: "Schedule photographer for next week"
  -> Agent confirms listing tag
  -> Voice memo appears in listing activity feed [P07]
  -> Action item created as a task in [P08]
```

---

## 5. Auth & Permissions

### 5.1 Authentication

| Mechanism | Users | Flow |
|-----------|-------|------|
| Magic Link (email) | All users (team members + clients) | Enter email -> receive link -> click to authenticate |
| Invite Token | New team members | Admin sends invite -> member clicks link -> sets up profile -> auto-authenticated |
| Session persistence | All users | JWT/cookie-based session, configurable expiry |

No passwords. Magic link only (simpler, more secure for this audience).

### 5.2 Tenant Management

- **HomeTrack Admin** (platform operator): Manages the multi-tenant database directly. Creates new customer accounts (teams). This is a manual/database operation in v1 -- no admin UI needed.
- **Customer onboarding**: HomeTrack admin creates team in DB -> team admin receives invite email -> team admin logs in and begins configuring team settings.

### 5.3 Role-Based Access Control

| Permission Area | Team Admin | Listing Agent | Design/Staging Lead | Transaction Coordinator | Marketing Coordinator | Client (Portal) | External Agent |
|----------------|------------|---------------|--------------------|-----------------------|----------------------|-----------------|----------------|
| **Team Settings** | Full | View | None | None | None | None | None |
| **Billing** | Full | None | None | None | None | None | None |
| **Integrations** | Full | View | None | None | None | None | None |
| **Workflows/Templates** | Full | View | None | None | None | None | None |
| **Branding** | Full | None | None | None | None | None | None |
| **Member Management** | Full | None | None | None | None | None | None |
| **Listings - Create** | Yes | Yes | No | No | No | No | No |
| **Listings - View All** | Yes | Yes | Yes | Yes | Yes | Own only (portal) | Shared only |
| **Listings - Edit** | Yes | Assigned | Assigned (staging fields) | Assigned (docs/compliance) | Assigned (marketing) | None | None |
| **Listings - Delete/Archive** | Yes | Own | No | No | No | No | No |
| **Tasks - Create/Edit** | All | Assigned listings | Assigned listings | Assigned listings | Assigned listings | None | None |
| **Tasks - Complete** | All | Own assigned | Own assigned | Own assigned | Own assigned | None | None |
| **Documents - Upload** | All listings | Assigned listings | Assigned listings | Assigned listings | Assigned listings | Via portal | None |
| **Documents - View** | All | Assigned listings | Assigned listings | Assigned listings | Assigned listings | Shared docs | Shared docs |
| **Financials - View** | All | Assigned listings | Assigned (vendor/staging) | Assigned | None | Approved costs | None |
| **Financials - Edit** | All | Assigned listings | Assigned (vendor quotes) | None | None | Approve only | None |
| **Contacts - All** | Full | Full | View | View | View | None | None |
| **Agent Network** | Full | Full | View | None | None | None | None |
| **Vendors** | Full | Full | Full | View | View | None | None |
| **Analytics** | Full | Full | View team perf | View own metrics | View marketing | None | None |
| **Portal Config** | Full | Assigned listings | None | None | None | N/A | N/A |
| **Offers** | View all | Assigned listings (full) | None | Assigned (view) | None | Via portal | Submit |
| **Showings** | View all | Assigned listings (full) | None | None | None | None | None |

### 5.4 Permission Implementation Notes

- Permissions are checked both in the UI (hide/disable unauthorized actions) and in API middleware (enforce on backend).
- Team Admin can create custom roles with granular permission combinations.
- "Assigned" means the user is assigned to that listing in a relevant role.
- Client portal is a completely separate layout group with its own auth check -- clients can ONLY access portal routes.
- External agents have the most limited access -- only shared listing info and offer submission for active deals.

---

## 6. Mobile Strategy

### 6.1 Responsive Approach

HomeTrack uses a responsive design with adaptive UI patterns, NOT a separate mobile app (for v1). SvelteKit serves the same routes, and Tailwind breakpoints control layout adaptation.

| Breakpoint | Target | Layout Strategy |
|------------|--------|----------------|
| `sm` (640px+) | Large phones, portrait | Single column, bottom nav, card-based layouts |
| `md` (768px+) | Tablets portrait, small laptops | Two-column where appropriate, bottom nav OR sidebar |
| `lg` (1024px+) | Tablets landscape, laptops | Full sidebar, multi-column layouts |
| `xl` (1280px+) | Desktop monitors | Full sidebar expanded, maximum density |

### 6.2 Mobile-First Pages

Pages P35-P39 are designed mobile-first. They live under `/(app)/mobile/` routes but are accessible from desktop too (they just have a mobile-optimized layout). On mobile, these are the primary interfaces agents use in the field.

### 6.3 Mobile Navigation

- **Bottom tab bar** (5 items): Dashboard, Listings, Capture (prominent center), Contacts, More
- **Capture center button**: Opens action sheet with: Voice Memo, Field Note, Photo, Showing Feedback, Open House Check-In, Quick Task
- **More menu**: Vendors, Analytics, Settings
- **Back arrow** replaces breadcrumbs
- **Pull-to-refresh** on all list/feed views
- **Swipe gestures**: used for task completion, list item actions

### 6.4 Offline Support Strategy

For v1, offline support focuses on:
- Voice memo recording (stored locally, syncs on reconnect)
- Field note capture (stored locally, syncs on reconnect)
- Photo capture (stored locally, syncs on reconnect)
- Cached listing data for reference during showings (read-only)

Full offline support for task management and document access is a Phase 4 feature.

### 6.5 Mobile Performance Targets

- First meaningful paint: < 2 seconds on 4G
- Time to interactive: < 3 seconds on 4G
- Voice memo capture: available within 1 tap from bottom nav
- Showing feedback: completable in < 60 seconds

---

## Appendix: Page Index

| ID | Page Name | Route | Priority |
|----|-----------|-------|----------|
| P01 | Dashboard | `/(app)/dashboard` | Phase 1 |
| P02 | Listings Pipeline Board | `/(app)/listings` | Phase 1 |
| P03 | Listings List View | `/(app)/listings/list` | Phase 1 |
| P04 | Listings Map View | `/(app)/listings/map` | Phase 2 |
| P05 | New Listing Wizard | `/(app)/listings/new` | Phase 1 |
| P06 | Listing Overview | `/(app)/listings/[listingId]` | Phase 1 |
| P07 | Activity Feed | `/(app)/listings/[listingId]/activity` | Phase 1 |
| P08 | Tasks | `/(app)/listings/[listingId]/tasks` | Phase 1 |
| P09 | Documents | `/(app)/listings/[listingId]/documents` | Phase 1 |
| P10 | Financials | `/(app)/listings/[listingId]/financials` | Phase 1 |
| P11 | Marketing | `/(app)/listings/[listingId]/marketing` | Phase 2 |
| P12 | Showings & Open Houses | `/(app)/listings/[listingId]/showings` | Phase 2 |
| P13 | Offers | `/(app)/listings/[listingId]/offers` | Phase 2 |
| P14 | Listing Analytics | `/(app)/listings/[listingId]/analytics` | Phase 2 |
| P15 | Portal Settings | `/(app)/listings/[listingId]/portal-settings` | Phase 1 |
| P16 | All Contacts | `/(app)/contacts` | Phase 1 |
| P17 | Clients | `/(app)/contacts/clients` | Phase 1 |
| P18 | Agent Network | `/(app)/contacts/agents` | Phase 3 |
| P19 | Agent Network Intelligence | `/(app)/contacts/agents/intelligence` | Phase 3 |
| P20 | Contact Detail | `/(app)/contacts/[contactId]` | Phase 1 |
| P21 | Vendor Directory | `/(app)/vendors` | Phase 1 |
| P22 | Vendor Detail | `/(app)/vendors/[vendorId]` | Phase 1 |
| P23 | Quote Management | `/(app)/vendors/quotes` | Phase 1 |
| P24 | Market Intelligence | `/(app)/analytics` | Phase 2 |
| P25 | Listing Performance | `/(app)/analytics/listings` | Phase 2 |
| P26 | Team Performance | `/(app)/analytics/team` | Phase 3 |
| P27 | AI Insights | `/(app)/analytics/insights` | Phase 3 |
| P28 | Team Management | `/(app)/settings` | Phase 1 |
| P29 | Integrations | `/(app)/settings/integrations` | Phase 1 |
| P30 | Workflows & Automations | `/(app)/settings/workflows` | Phase 1 |
| P31 | Notification Preferences | `/(app)/settings/notifications` | Phase 1 |
| P32 | Billing & Subscription | `/(app)/settings/billing` | Phase 1 |
| P33 | Portal Branding | `/(app)/settings/branding` | Phase 1 |
| P34 | Data Management | `/(app)/settings/data` | Phase 2 |
| P35 | Voice Memo Capture | `/(app)/mobile/voice-memo` | Phase 2 |
| P36 | Field Notes | `/(app)/mobile/field-notes` | Phase 2 |
| P37 | Showing Feedback | `/(app)/mobile/showing-feedback` | Phase 2 |
| P38 | Open House Check-In | `/(app)/mobile/open-house` | Phase 2 |
| P39 | Quick Task Completion | `/(app)/mobile/quick-task` | Phase 1 |
| P40 | Portal Dashboard | `/(portal)` | Phase 1 |
| P41 | Portal Approvals | `/(portal)/approvals` | Phase 1 |
| P42 | Portal Messages | `/(portal)/messages` | Phase 1 |
| P43 | Portal Documents | `/(portal)/documents` | Phase 1 |
| A01 | Login | `/(auth)/login` | Phase 1 |
| A02 | Invite Accept | `/(auth)/invite/[token]` | Phase 1 |
