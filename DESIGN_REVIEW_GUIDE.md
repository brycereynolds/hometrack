# HomeTrack: Founder's Design & System Review Guide

**Last Updated:** April 10, 2026
**This guide will help you understand what's been built, what to look at first, and what decisions need to be made next.**

---

## Executive Summary

You have a **fully-designed 48-page SvelteKit application** with a **complete PostgreSQL database schema**. Every page is styled, interactive, and populated with realistic mock data. But nothing connects to real systems yet—no authentication, no database, no file storage, no integrations.

This is intentional. The focus was on **visual design, information architecture, and feature scope**. Now that the mockup is complete, you can evaluate it as a product and decide the priority order for connecting to real systems.

---

## Part 1: How to Run the Dev Server

### Prerequisites
- Node.js 18+
- PostgreSQL installed locally (optional for initial review, but required to connect DB later)

### Steps
```bash
cd hometrack/app
npm install              # Install dependencies
npm run dev             # Start dev server
```

The app will be available at `http://localhost:5173`

**First login page:** You'll see the login screen. There's no real auth, so you can proceed with any email or close the modal to reach dashboard with mock data. (The auth middleware isn't enforced yet.)

---

## Part 2: What to Look At First (Recommended Review Order)

### 1. **Dashboard** (2 minutes)
**URL:** `/dashboard`

**Why first:** This is the "home" of the product—what users see immediately after opening HomeTrack. Evaluates how you're presenting the core metrics and daily workload.

**What to evaluate:**
- Does the KPI layout feel right? (Active Listings, Pipeline Value, Days on Market, Open Tasks)
- Is the task list prioritized correctly? (Today, Overdue, Upcoming tabs)
- Do the AI alerts feel useful? (Currently showing sample alerts like "Sarah Kim's buyer matches...")
- Is the activity feed enough context, or does it feel cluttered?
- Chart: Does the "Listings by Phase" bar chart help you understand pipeline health?

**Feedback questions:**
- Would you add/remove KPIs?
- Should alerts be more prominent or less?
- Does the layout work on mobile?

---

### 2. **Listings Pipeline Board** (3 minutes)
**URL:** `/listings` (default view)

**Why:** Listings are the core object in the product. This Kanban-style view is how agents track progress from onboarding → closing.

**What to evaluate:**
- Do the 9 pipeline phases make sense? (Onboarding, Improvement Planning, Staging & Prep, Content Production, Active Marketing, Showings & Open Houses, Offers & Negotiation, Under Contract, Closing)
- Is the card design intuitive? (Address, image, phase badge, days on market, task progress)
- Can you quickly scan and understand where listings are stuck?
- The phase colors—are they working to distinguish visually?

**Feedback questions:**
- Should phases be reordered or renamed?
- Should cards show more or less info?
- Do you want to be able to drag cards between phases? (Not implemented yet, but possible)

---

### 3. **Listing Detail Page** (5 minutes)
**URL:** `/listings/456-oak-avenue` (or click any listing card)

**Why:** This is where the real work happens. A single listing has 10 tabs. This is a design decision point: is this the right granularity?

**Tabs to review:**
1. **Overview** — Property basics, listing agreement, staging timeline
2. **Activity Feed** — Every action on this listing (photo shoot, contractor call, client approval, etc.)
3. **Tasks** — Checklist specific to this listing (with workflow template automation)
4. **Documents** — Upload agreements, disclosures, staging plans, contracts
5. **Financials** — Budget tracking (staging, photography, marketing spend) + actual costs
6. **Marketing** — Asset library (photos, virtual tour, brochure, email template)
7. **Showings** — Scheduled open houses, private showings, feedback from agents
8. **Offers** — All offers received, counter-offer flow, comparison to list price
9. **Analytics** — Individual listing performance (views, inquiries, days on market vs comps)
10. **Portal Settings** — Who on the client portal can see what (confidential or public)

**Feedback questions:**
- Is 10 tabs too many, or are they all essential?
- Are there tabs you'd never use?
- Should some tabs be in a dropdown menu instead of tabs?
- Missing a tab? (e.g., Staging Media Checklist, Inspector Reports, Title Issues)

---

### 4. **Contacts & Agent Intelligence** (4 minutes)
**URLs:**
- `/contacts` — All contacts mixed
- `/contacts/clients` — Just clients
- `/contacts/agents` — Agent network
- `/contacts/agents/intelligence` — Agent comp analysis

**Why:** Relationships drive real estate. How you manage agent connections and client interactions is competitive.

**What to evaluate:**
- **All Contacts view:** Should clients/agents/vendors be mixed or separate from the start?
- **Clients:** Is the client relationship management feature-complete? (Last interaction, next followup, property history)
- **Agent Network:** Do you track relationship strength (1–5 star scale) correctly?
- **Agent Intelligence:** The comp analysis and buyer profile section—is this useful enough, or does it need more detail?

**Feedback questions:**
- Should the agent network show buyer profiles by market segment?
- Do you need a "buyer matching" feature (agent has buyer → we show matching listings)?
- Is relationship strength the right metric, or should you track transaction history?

---

### 5. **Analytics Overview** (3 minutes)
**URLs:**
- `/analytics` — Pipeline overview
- `/analytics/listings` — Listing performance trends
- `/analytics/team` — Team productivity metrics

**Why:** Data-driven decision making. These pages answer "How's the team doing?" and "What's the market doing?"

**What to evaluate:**
- Pipeline chart: Does it help you understand if you're building a sustainable pipeline?
- Listing performance: Are you tracking the right metrics? (Days on market, list-to-sale price ratio, time in showings phase)
- Team performance: Are the productivity metrics correct? (Listings per agent, listings per phase, task completion rate)

**Feedback questions:**
- Are there KPIs missing? (e.g., conversion rate, cost per lead, commission/listing)
- Should analytics be more granular (by agent, by market, by property type)?
- Do you need predictive analytics? (e.g., "at this pace, you'll have X closings by year-end")

---

### 6. **Vendors & Quote Management** (2 minutes)
**URLs:**
- `/vendors` — Contractor directory
- `/vendors/[id]` — Vendor detail with cost history
- `/vendors/quotes` — Request for quotes workflow

**Why:** Service providers are critical. Tracking costs and getting competitive quotes matters.

**What to evaluate:**
- Do you need a vendor directory? (Staging, photography, inspector, contractor, painter, etc.)
- Quote management: Is this the right workflow for getting bids and comparing?
- Should vendors see jobs assigned to them? (Not implemented yet, but relevant for outsourcing)

**Feedback questions:**
- Who else in your team needs vendor access?
- Should quotes auto-calculate totals and tax?
- Do you need a PO (purchase order) system or just quotes?

---

### 7. **Mobile Experience** (2 minutes)
**On your phone/mobile browser:** `http://localhost:5173`
Or use Chrome DevTools Device Emulation (F12 → responsive mode).

**Mobile pages:**
- Voice Memo: Quick voice recording with transcription placeholder
- Field Notes: Photo + note capture in the field
- Showing Feedback: Buyer feedback form
- Open House Check-In: Log visitor info
- Quick Task: Complete a task from listing

**What to evaluate:**
- Are the buttons appropriately sized for thumb operation?
- Does the mobile bottom navigation make sense? (5-item tab bar)
- Are forms easy to fill on small screens?

**Feedback questions:**
- Are these the right mobile-first actions?
- Should showing feedback be more detailed or simpler?
- Do you need offline capability? (Take notes without internet, sync later)

---

### 8. **Settings & Configuration** (2 minutes)
**URL:** `/settings` and sub-pages

**Note:** Most settings pages are UI shells (no backend logic yet).

**What to see:**
- Integrations: Where real estate APIs will connect (MLS, email, calendar, DocuSign, etc.)
- Workflows: Where task automation rules will be defined
- Branding: Where teams customize portal theme (your logo, colors, fonts)
- Billing: Subscription and usage limits

**Feedback questions:**
- Are the integration categories right? (Do you need Zapier, or just the big ones?)
- Should workflow creation be in this settings page, or a separate workspace?
- How many branding customization options do clients need?

---

### 9. **Design System Preview** (1 minute)
**URL:** `/preview`

Shows all the colors, typography, and component styles defined in the design system. This is for your reference, not for end users.

---

## Part 3: Design System Evaluation

### Color Palette
The design uses a **warm, sophisticated palette**:
- **Primary (Terracotta):** #C4704B — warm, not aggressive
- **Secondary (Sage):** #7B8B6F — balance and nature
- **Background:** #FDFBF7 — warm off-white, not cold
- **Status colors:** Desaturated to stay in harmony

**Feedback questions:**
- Does the warmth feel right for your brand? (vs. cold blues/grays)
- Should primary color be more orange or more brown?
- Are status colors (success green, warning gold, error red) intuitive enough?

### Typography
- **Headings:** DM Serif Display — premium, editorial feel
- **Body:** Inter — clean, legible, industry-standard
- **Data:** JetBrains Mono — for code/detailed numbers

**Feedback questions:**
- Does the serif/sans contrast make HomeTrack feel different from generic SaaS?
- Is heading size hierarchy clear? (Page title vs section header vs card title)
- Too many fonts, or just right?

### Component Patterns
- Cards with subtle shadows and warm borders
- Phase badges (colored) for listing lifecycle
- Status badges (icon + text) for tasks/offers
- Consistent spacing and rounded corners

**Feedback questions:**
- Do cards feel premium or over-designed?
- Should badges have icons or just colors?

---

## Part 4: Information Architecture Questions

### 1. Route Organization
Mentally map the hierarchy:
```
Dashboard (home)
├── Listings
│   ├── Kanban Board (default)
│   ├── List View
│   ├── Map View
│   └── New Listing Wizard
├── Contacts
│   ├── All / Clients / Agents
│   └── Agent Intelligence
├── Vendors
├── Analytics
└── Settings
```

**Feedback questions:**
- Is this the right hierarchy?
- Would you group or reorder navigation differently?
- Should "New Listing" be a sidebar quick action instead of a page?

### 2. Data Scope
The app tracks:
- **Listings** (property status, timeline, financials, marketing, showings, offers)
- **Contacts** (clients, agents, vendors)
- **Tasks & Activity** (who did what, when)
- **Analytics** (team metrics, listing performance, market intelligence)

**Feedback questions:**
- Is listing data complete? (Missing fields?)
- Should you track buyer profiles separately? (Currently nested in agent intelligence)
- Do you need inspection reports, title issues, contingencies as first-class objects?

---

## Part 5: Real-World Workflow Check

### Scenario 1: New Listing Walkthrough
1. Client calls you to list their home
2. You create a new listing (form: address, price, bedrooms, client, agent, date)
3. System auto-creates a task checklist from a workflow template
4. You assign staging, photography, marketing tasks
5. As tasks complete, the listing moves through phases (Staging → Content Production → Active Marketing)
6. Analytics track progress

**Question:** Does the new listing flow match your actual process?

### Scenario 2: Agent Follow-Up
1. Agent shows property to buyer (John Smith)
2. Agent logs showing feedback (form: feedback, buyer interest level, timeline)
3. System auto-creates an activity log entry
4. You review showing feedback in listing analytics
5. You follow up with buyer via message (portal)

**Question:** Is showing feedback capture enough, or does it need photos/video?

### Scenario 3: Team Dashboard Glance
1. You open HomeTrack (dashboard)
2. You see: 8 active listings, $12M pipeline, 15 open tasks, 3 overdue
3. Recent activity: "Marcus closed 789 Elm", "Photo shoot completed for 456 Oak"
4. AI alerts: "Sarah Kim's buyer is perfect for 456 Oak Ave"

**Question:** Is this the right information density for a quick morning check-in?

---

## Part 6: Data Model Evaluation

The database schema has these tables:

| Table | Fields | Notes |
|-------|--------|-------|
| **listings** | address, price, bedrooms, bathrooms, phase, agent, client, listDate, soldDate, days_on_market, photos[] | Core property object |
| **contacts** | name, email, phone, type (client/agent/vendor), company, relationship_strength | People tracking |
| **tasks** | title, status, priority, dueDate, assignee, parent_listing | Workflow checklist |
| **documents** | filename, category (contract, disclosure, staging plan), status, uploadedBy, createdAt | File tracking (not storage yet) |
| **financials** | listing_id, category (staging, photography, marketing), amount, vendor, date | Budget & costs |
| **showings** | listing_id, agent, buyer, date, feedback, buyerInterest | Showing log |
| **offers** | listing_id, buyer, offerPrice, contingencies[], status, expirationDate | Offer tracking |
| **marketing_assets** | listing_id, type (photos, video, brochure, email), status, createdBy | Content library |
| **ai_insights** | listing_id, type, message, actionItems[] | AI-generated recommendations |
| **integrations** | provider (Zapier, Google, MLS, etc.), status, config | Third-party connections |

**Feedback questions:**
- Are all these tables necessary for MVP, or can you defer some?
- Should financials track more detail? (Tax ID, invoice number, payment status)
- Do you need a separate leads/prospects table? (Currently mixed with contacts)

---

## Part 7: What to Look for in Your Review

### Functionality Checklist
As you navigate, notice:
- ✓ **Page exists** — Is the page there?
- ✓ **Data is real** — Are you seeing realistic mock data, not Lorem ipsum?
- ✓ **Navigation works** — Can you click and move between pages?
- ✓ **Forms are present** — Where users input data, is the form there?
- ✗ **Real integrations** — No API calls yet (all mock data)
- ✗ **Authentication** — No real login gate (auth page exists but doesn't block)
- ✗ **File upload** — No document upload (buttons present, no backend)

### Design Consistency Checklist
- ✓ Colors used consistently (terracotta primary, sage secondary)
- ✓ Typography hierarchy clear (big serif headings, small labels)
- ✓ Cards and spacing feel uniform (not one page with huge padding, another cramped)
- ✓ Mobile navigation clear (bottom tabs on mobile, sidebar on desktop)
- ? Dark mode support (CSS variables defined, but not fully tested)

### Usability Assessment
Ask yourself:
- Can I find what I'm looking for?
- Can a new user understand this without training?
- Would I be frustrated by this layout after using it 100 times?
- Are buttons/links where I expect them?
- Does mobile feel like a second-class citizen, or is it thoughtfully designed?

---

## Part 8: Decisions You Need to Make Now

### Decision 1: Scope for MVP
**Question:** What's the minimum you need to launch to real customers?

**Options:**
- **Option A (Core):** Dashboard, Listings pipeline board, Contacts, Task management. No analytics or vendor management yet.
- **Option B (Standard):** Everything except Settings and integrations (which are UI-only anyway).
- **Option C (Full):** All 48 pages as-is. (Not recommended for MVP, but possible if engineering is ready.)

**Impact:** Option A = 6-8 weeks to launch; Option B = 8-10 weeks; Option C = 12+ weeks.

### Decision 2: Data Import Strategy
**Question:** How do you get real data into the system?

**Options:**
- **Option A:** API integration (MLS, email/calendar sync) — Best long-term, hardest to build
- **Option B:** Manual import (CSV of clients, listings, or spreadsheet) — Quick, one-time
- **Option C:** Start from scratch (new team enters data manually) — Works if team is small

**Impact:** MVP can launch with Option B or C. Option A is a later feature.

### Decision 3: Authentication Provider
**Question:** Who controls team member access?

**Options:**
- **Auth0** (enterprise-grade, integrations with everything, ~$15/month)
- **Clerk** (modern DX, great for SaaS, ~$25/month)
- **Supabase** (if you use Supabase DB, built-in auth, free tier)
- **Custom magic links** (you build it, most control, but more work)

**Impact:** 3-4 days of development; affects first launch and team invite flow.

### Decision 4: File Storage
**Question:** Where do documents and photos live?

**Options:**
- **AWS S3** (industry standard, $0.023/GB, most reliable)
- **Cloudinary** (image-specific, easier API, pay-per-use ~$0.01/image)
- **Firebase Storage** (simpler setup, smaller scale)
- **Local filesystem** (during testing only; not production-ready)

**Impact:** 2-3 days; affects document upload, listing photos, marketing assets.

### Decision 5: MLS Integration
**Question:** How do you get comp sales data and listing details?

**Options:**
- **Paragon API** (most complete, ~$200-500/month for data)
- **Zillow API** (limited free tier, mostly public data)
- **Regional MLS API** (varies by region, reach out to your local board)
- **No MLS integration yet** (launch without it, add later)

**Impact:** Option D = no delay; Option A = 1-2 weeks development + ongoing costs.

### Decision 6: AI Insights
**Question:** Should AI analysis happen at launch?

**Options:**
- **Yes, immediately:** Build Claude API integration, generate insights daily, show in sidebar + analytics
- **Not yet:** Launch without AI, add in Phase 2
- **Hybrid:** Show hardcoded example insights, prepare backend for real Claude calls

**Impact:** Adds ~1 week of development if done at launch.

---

## Part 9: Next Steps After Your Review

### If You Love the Design & Want to Proceed
1. **Provide feedback** on any specific pages or features that feel wrong
2. **Prioritize decisions** from Part 8 (which things are must-have for launch?)
3. **Choose one decision** to own (e.g., "We're using Auth0" or "We're using S3 for files")
4. **Start data strategy** — Do you have a spreadsheet of real clients/listings ready to import?

### If You Want to Change Something
Feedback is welcome and fast to implement at this stage. Examples:
- "I want to reorder the contact view (show agents before clients)"
- "The task checklist should be inline on listing detail, not a separate tab"
- "Add a field for 'Days Since Last Contact' to contacts"
- "Rename 'Showings' tab to 'Open Houses & Feedback'"

Most changes at this stage take 30 minutes to 2 hours.

### If You Want to See Something New
Entirely new pages or features take longer (2-4 hours each), but are still possible. Examples:
- "Add a 'Lead Scoring' page to identify high-probability buyers"
- "Add a 'Comparable Properties' detail view with comp analysis workflow"
- "Add a 'Team Calendar' view of all events"

---

## Part 10: Technical Details (If Interested)

### How Pages are Built
Each page is a Svelte component (.svelte file) that:
1. Imports mock data
2. Defines reactive state (filters, sorting, etc.)
3. Renders UI using shadcn-svelte components + custom components
4. Handles interactions (click, input, form submit)

**Example:** Listings list view has search, phase filter, and agent filter. Clicking a listing navigates to detail.

### Component Library
- **17 custom components:** AppLayout, Sidebar, MetricCard, ListingCard, etc. — used across pages
- **25+ UI primitives:** Button, Input, Card, Table, etc. — from shadcn-svelte (bits-ui)
- All styled with Tailwind CSS and design system colors

### Database Schema
Complete. 19 tables, all with proper relationships. Ready to connect to PostgreSQL.

### Load Functions
Exist but not wired. The pattern is ready (import query → call DB → return data). Just needs database connection and data fetching logic to be triggered.

---

## Part 11: FAQ

**Q: Can I customize the colors?**
A: Yes. All colors are in `app/src/app.css` as CSS variables using oklch() color space. Change one variable and all UI updates.

**Q: How many pages are actually "done"?**
A: All 48 pages exist and render. 35 are content-rich (listings, contacts, analytics); 13 are UI shells (integrations, workflows, billing).

**Q: Can I test on mobile without a phone?**
A: Yes. Use Chrome DevTools: F12 → Responsive mode → iPhone 12 (or any device).

**Q: Can I add a new page?**
A: Yes, but you'll need someone who knows SvelteKit. Each page takes 1-3 hours depending on complexity.

**Q: How do I import real data?**
A: Use the seed script. Modify `seed.ts` to read from a CSV or JSON file instead of hardcoded mock data.

**Q: Can I run this without a database?**
A: Yes, currently you can. But to make progress, you need PostgreSQL + the connection string.

---

## Conclusion

You have a **complete, polished product mockup**. It's not a wireframe—it's a working, styled, interactive prototype that feels like a real app.

The next phase is **choosing what's most important** (auth? file storage? MLS data?) and building those systems out. The design and architecture are ready to support it.

**Your job now:** Evaluate whether this matches your vision for HomeTrack. If it does, your engineering team can start Phase 1 (wire database, add authentication). If you want changes, now is the time.

---

**Questions?** Review Part 2–4 first, then the Decisions in Part 8. Everything else is support detail.
