# HomeTrack Functionality Gap Analysis

**Date:** 2026-04-13
**Status:** All pages display real database data via Drizzle + RLS. No mock data remains.
**Scope:** Every page, button, form, and interactive element audited across 49 pages.

---

## Summary

| Category | Count |
|----------|-------|
| Pages fully functional (read-only display) | 18 |
| Pages with dead buttons / partial functionality | 25 |
| Pages that are complete stubs | 1 (portal messages) |
| Dead buttons (no onclick/handler) | 60+ |
| Forms that don't submit to backend | 8 |
| Hardcoded metrics that should be computed | 10+ |
| Missing infrastructure (toasts, error pages, loading) | 5 systems |

---

## Critical: Forms That Don't Save

These forms accept input but never send data to the server.

| Form | Location | What's Missing |
|------|----------|----------------|
| **Create Listing** | `/listings/new/+page.svelte` | "Create Listing" button just redirects to `/listings` — no form action, no server endpoint. All form data lost. |
| **Add Contact** | `/contacts/+page.svelte` | Modal opens, inputs bind to state, but "Add Contact" button just closes modal. No POST. |
| **Add Vendor** | `/vendors/+page.svelte` | Same pattern — modal closes without saving. |
| **Activity Compose** | `/listings/[id]/activity/+page.svelte` | Textarea exists, send button disables when empty, but no handler to actually post the note. |
| **Save Note (Contact)** | `/contacts/[id]/+page.svelte` | Notes textarea binds, save button disables when empty, but no handler. |
| **Save Branding** | `/settings/branding/+page.svelte` | Color/domain/message inputs work, preview updates live, but save button is dead. |
| **Save Notifications** | `/settings/notifications/+page.svelte` | Toggle states update client-side but save button is dead. |
| **Showing Feedback** | `/mobile/showing-feedback/+page.svelte` | All inputs work (stars, interest, pros/cons) but submit button is dead. |

---

## Critical: CRUD Operations Missing

### Listings
| Operation | Status | Details |
|-----------|--------|---------|
| Create listing | GAP | Form wizard exists but doesn't submit |
| Edit listing | GAP | Edit button in detail header has no handler |
| Delete listing | GAP | No UI for this |
| Change phase | GAP | "Change Phase" button has no handler |
| Drag-and-drop phase change | PARTIAL | Kanban DnD updates local state but doesn't persist |

### Tasks
| Operation | Status | Details |
|-----------|--------|---------|
| Create task | GAP | "Add Task" button has no handler |
| Edit task | PARTIAL | Modal opens, fields bind, but save only updates local object |
| Toggle status | PARTIAL | Checkbox/icon updates local state, not persisted |
| Toggle subtask | PARTIAL | Same — local only |
| Delete task | GAP | No UI |

### Contacts
| Operation | Status | Details |
|-----------|--------|---------|
| Create contact | GAP | Modal exists but doesn't save |
| Edit contact | GAP | No UI |
| Delete contact | GAP | No UI |
| Log interaction | GAP | Button exists, no handler |

### Vendors
| Operation | Status | Details |
|-----------|--------|---------|
| Create vendor | GAP | Modal exists but doesn't save |
| Edit vendor | GAP | No UI |
| Request quote | GAP | Button exists, no handler |
| Approve/decline quote | GAP | Buttons exist, no handlers |

### Documents
| Operation | Status | Details |
|-----------|--------|---------|
| Upload file | GAP | Drop zone renders but no `<input type="file">` or upload handler |
| Download file | GAP | No download handlers |
| Delete document | GAP | No UI |

### Offers
| Operation | Status | Details |
|-----------|--------|---------|
| Log offer | GAP | Button exists, no handler |
| Edit offer | GAP | No UI |
| Change offer status | GAP | Pipeline columns exist but no drag/click handlers |

### Showings
| Operation | Status | Details |
|-----------|--------|---------|
| Schedule showing | GAP | Button exists, no handler |
| Edit showing | GAP | No UI |
| Record feedback | GAP | Mobile form exists but doesn't submit |

---

## High: Dead Buttons by Page

### Dashboard
- Voice Memo button (header + sidebar) — no handler
- Quick Note button (header + sidebar) — no handler
- Task checkboxes — no onchange handler
- Add to Calendar icons — no handler
- Reminder dropdown options — close dropdown but don't set reminder
- Notification bell — no handler

### Listing Detail Header
- Edit button — no handler
- Change Phase button — no handler
- Share button — no handler

### Contact Detail
- Email button — no handler
- Call button — no handler
- Message button — no handler
- Log Interaction button — no handler

### Vendor Detail
- Email button — no handler
- Phone button — no handler
- Request Quote button — no handler

### Analytics Insights
- Action buttons on insight cards — no handlers

### Settings Pages
- Invite Member button — no handler
- Connect/Sync integration buttons — no handlers
- Edit workflow buttons — no handlers
- Create Custom Workflow button — no handler
- Add Automation Rule button — no handler
- Enable/disable rule toggles — no persistence
- Upload Logo button — no handler
- Upgrade/Downgrade plan buttons — no handlers
- Update payment method button — no handler
- Download PDF invoice buttons — no handlers
- Export data buttons — no handlers
- Backup Now button — no handler
- Generate/Revoke API key buttons — no handlers

### Portal
- Approve/Decline buttons — no handlers
- Sign document button — no handler
- View/Download document buttons — no handlers

---

## High: Hardcoded Values That Should Be Computed

| Location | Hardcoded Value | Should Be |
|----------|----------------|-----------|
| Dashboard stat cards | "+2 this month" | Computed from listings created this month vs last |
| Dashboard stat cards | "+$1.2M from last month" | Computed from pipeline value delta |
| Dashboard stat cards | "-3 days vs. last quarter" | Computed from avg DOM comparison |
| Dashboard stat cards | "1 overdue" | Already computed correctly |
| Analytics overview | "+$2.2M vs last month" | Computed from pipeline_metrics |
| Analytics overview | "-3 days vs avg" | Computed from showing data |
| Analytics overview | "+18% this week" | Computed from analytics_events |
| Analytics overview | "97.2%" list-to-sale ratio | Computed from closed listings |
| Settings/billing | Invoice history | Hardcoded array, no billing system |
| Settings/billing | Plan details | Hardcoded, no subscription system |

---

## Medium: Missing Infrastructure

### No Toast/Notification System
- No feedback when actions complete (or fail)
- No success messages after form submissions
- No error messages for failed operations
- Need: Toast component (sonner or similar)

### No Error Pages
- No `+error.svelte` anywhere in the route structure
- Server errors show raw SvelteKit error page
- Need: Custom error pages for 404, 500, etc.

### No Loading States
- Pages load data server-side but show no indication during navigation
- No skeleton screens
- No loading spinners (except auth pages)
- Need: Loading indicators on page transitions

### No Token Refresh
- Access token expires after ~1 hour
- No refresh logic in hooks.server.ts
- User silently logged out
- Need: Check refresh token, call GoTrue refresh endpoint

### No Dark Mode
- Design system mentions dark mode support
- No toggle or system preference detection exists
- Need: Theme provider + toggle

---

## Medium: Search & Command Palette

| Feature | Status | Details |
|---------|--------|---------|
| Search bar (header) | GAP | Input renders but no handler — typing does nothing |
| Command palette (Cmd+K) | PARTIAL | Opens, shows static lists of listings/contacts, but no actual search/filter logic |

---

## Low: Minor Issues

| Issue | Location | Details |
|-------|----------|---------|
| Dead links (href="#") | `/auth/invite/[token]` | Terms of Service and Privacy Policy links |
| Mobile "Capture" actions | `MobileBottomNav` | Overlay opens but action buttons are dead |
| Mobile "More" menu | `MobileBottomNav` | No functionality |
| Open house check-in | `/mobile/open-house` | Form clears on submit but doesn't persist |
| Disclosure checklist | `/listings/[id]/documents` | Some items hardcoded as incomplete, no toggle |
| Portal messages | `/portal/[team]/messages` | "Coming soon" stub |
| Settings dropdown (user menu) | `+layout.svelte` | "Settings" item has no handler (sidebar link works) |

---

## Pages That Are Fully Functional (Read-Only)

These pages correctly display real database data with working filters, sorts, and navigation:

1. Dashboard (display + navigation)
2. Listings pipeline board (display + DnD UI)
3. Listings list view (display + sort + filter)
4. Listings map view (Leaflet + popups)
5. Listing overview tab
6. Listing financials tab (charts + budget table)
7. Listing analytics tab (charts + comp sales)
8. Contacts list (search + filter + sort)
9. Contacts clients view
10. Contacts agents view
11. Contacts agent intelligence (match scoring)
12. Vendors list (search + filter + sort)
13. Vendor detail (charts + quote history)
14. Vendor quotes (expand + compare mode)
15. Analytics overview (charts + tables)
16. Analytics listings (charts + tables)
17. Analytics team (charts + metrics)
18. Portal dashboard (timeline + milestones)

---

## Recommended Build Order

### Phase 1: Core CRUD (enables real usage)
1. Create listing (form action + server endpoint)
2. Create/edit task (form action + toggle persistence)
3. Create contact (form action)
4. Task status toggle (server mutation)
5. Phase change (button handler + server mutation)
6. Activity note posting (form action)

### Phase 2: File & Data Operations
7. Document upload (file input + Supabase Storage)
8. Log offer (form action)
9. Schedule showing (form action)
10. Create vendor (form action)
11. Request/approve quote (form actions)

### Phase 3: UX Infrastructure
12. Toast notification system
13. Error pages (404, 500)
14. Loading states / skeleton screens
15. Search bar implementation
16. Command palette search

### Phase 4: Settings & Config
17. Save branding settings
18. Save notification preferences
19. Workflow template editing
20. Integration connect/disconnect

### Phase 5: Advanced Features
21. Token refresh in hooks
22. Dark mode
23. Portal approval workflow
24. Portal document signing
25. Real-time updates (Supabase Realtime)
