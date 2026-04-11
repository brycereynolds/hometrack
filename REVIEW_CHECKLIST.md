# HomeTrack: Quick Review Checklist

**Time Needed:** 30–45 minutes for a complete visual review
**Starting Point:** `npm run dev` → http://localhost:5173

---

## Page Review Checklist

### Core Workflows (Review These First)

- [ ] **Dashboard** (`/dashboard`) — 2 min
  - KPIs: Active Listings, Pipeline Value, Days on Market, Open Tasks
  - Task list (Today/Overdue/Upcoming tabs)
  - Activity feed (last 8 activities)
  - AI alerts (example: "Sarah Kim's buyer matches...")
  - Chart: Listings by phase

- [ ] **Listings Kanban Board** (`/listings`) — 3 min
  - 9 pipeline phases: Onboarding → Closing
  - Drag concept (not implemented, but layout is ready)
  - Card shows: address, image, phase, days on market, task progress
  - Right sidebar shows active filters

- [ ] **Listing Detail** (`/listings/456-oak-avenue`) — 5 min
  - Overview tab: property basics, agreement, timeline
  - Activity tab: all actions on this listing
  - Tasks tab: workflow checklist
  - Documents tab: placeholder for uploads
  - Financials tab: budget breakdown chart
  - Marketing tab: asset library
  - Showings tab: feedback form
  - Offers tab: offer comparison
  - Analytics tab: individual listing performance
  - Portal settings tab: client access controls

- [ ] **Contacts** (`/contacts`) — 3 min
  - All contacts (mixed view)
  - Filter by type: Clients, Agents, Vendors
  - Agent Intelligence (`/contacts/agents/intelligence`): comp analysis, buyer profiles

- [ ] **Analytics** (`/analytics`) — 2 min
  - Overview: pipeline chart, key metrics
  - Listing Performance: sell-time trends, price trends
  - Team Metrics: productivity by agent

---

### Secondary Pages (Optional but Good to See)

- [ ] Vendors (`/vendors` and `/vendors/quotes`) — 2 min
- [ ] Mobile view (open on phone or use DevTools F12 → responsive mode) — 2 min
- [ ] Settings page (`/settings`) — 1 min
- [ ] Client Portal (`/[team]/`) — 1 min

---

## Design System Checklist

- [ ] **Colors**
  - Primary (Terracotta #C4704B): Used for primary buttons, active nav, badges
  - Secondary (Sage #7B8B6F): Secondary buttons, secondary elements
  - Background (Warm Off-White #FDFBF7): Main page background
  - Accent (Coral #D4956B): Highlights and special callouts
  - Do these feel warm and sophisticated, or too muted/too bold?

- [ ] **Typography**
  - Page titles: DM Serif Display (serif font, large, premium feel)
  - Section headers: Inter (sans-serif, bold)
  - Body text: Inter (clean, readable)
  - Do serif/sans contrast feel premium, or too much?

- [ ] **Components**
  - Cards: Consistent rounded corners, subtle shadows, spacing
  - Buttons: Consistent style, hover effects
  - Phase badges: Colored, distinct, easy to scan
  - Tables: Readable, good spacing

---

## Data Content Checklist

- [ ] Realistic data: Addresses, names, emails, prices feel real
- [ ] Images: Photos load for listings (from Unsplash)
- [ ] Charts render: Dashboard chart, analytics charts
- [ ] Relationships: Agents assigned to listings, clients assigned, etc.

---

## Mobile Experience Checklist

On a phone or DevTools mobile mode:

- [ ] Bottom nav appears (5 tabs: Dashboard, Listings, Capture, Contacts, More)
- [ ] Navigation is thumb-friendly (buttons big enough)
- [ ] Forms are easy to fill (not tiny text inputs)
- [ ] Layout stacks vertically (no horizontal overflow)
- [ ] Mobile pages exist (voice memo, field notes, etc.)

---

## Workflow Simulation

Work through this fictional scenario:

1. Open dashboard — see 8 active listings, 15 open tasks
2. Click a listing (e.g., "456 Oak Avenue")
3. Review listing detail (all 10 tabs)
4. Go back to Listings board
5. Click on Contacts, find an agent (e.g., "Sarah Kim")
6. View agent detail (relationship strength, buyer profile)
7. Go to Analytics and check listing performance
8. On mobile (or DevTools), try voice memo capture

**Questions to ask yourself:**
- Did you get lost at any point?
- Did navigation feel natural?
- Were any pages confusing or cluttered?
- Would a new user understand this without training?

---

## Feedback Template

For each page or feature, note:

**Page: [Name]**
- What works well:
- What could improve:
- Missing features:
- Design concerns:
- Data concerns:

---

## Critical Decisions You'll Make

Before leaving the review, identify:

1. **Scope:** What's essential for MVP? (Dashboard + Listings + Contacts = core; analytics/vendors = later)
2. **Auth:** Which provider? (Auth0, Clerk, Supabase, custom)
3. **Files:** Where do documents live? (S3, Cloudinary, etc.)
4. **Data:** How do you get real data in? (CSV import, manual entry, API sync)
5. **MLS:** Do you need comp data at launch, or can it wait?
6. **AI:** Should insights go live with v1, or Phase 2?

---

## Timeline Reference

If you want to know effort to build real systems:

| System | Build Time | Complexity |
|--------|-----------|-----------|
| Wire database (Phase 1) | 2–3 days | Medium |
| Add authentication (Phase 2) | 3–4 days | Medium |
| File storage (Phase 3) | 2–3 days | Medium |
| MLS integration (Phase 4) | 5–10 days | High |
| Email/Calendar sync (Phase 5) | 5–7 days | High |
| AI insights (Phase 6) | 5–10 days | High |
| **Total to full-featured product** | **22–37 days** | **~6–9 weeks** |

---

## Next Steps After Review

1. **Note feedback** using the template above
2. **Make decisions** on scope, auth, file storage, data import
3. **Share feedback** with engineering team
4. **Start Phase 1:** Wire database and load functions (critical path)

---

**Duration:** If you follow this checklist step-by-step with thinking time, you'll have a complete product understanding in **30–45 minutes**.
