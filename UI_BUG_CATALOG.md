# UI Bug Catalog from Founder Review

Comprehensive catalog of UI issues identified during review. Each issue includes file path, line numbers, current behavior, what's wrong, and severity assessment.

---

## 1. Property Page White-on-White Buttons (Top-Right)

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/listings/[id]/+layout.svelte`
**Lines:** 74-85

**Current Code:**
```svelte
<!-- Action buttons -->
<div class="absolute right-4 top-4 flex gap-2">
  <Button variant="secondary" size="sm" class="bg-white/90 backdrop-blur-sm hover:bg-white">
    <Edit class="mr-1.5 size-4" />
    Edit
  </Button>
  <Button variant="secondary" size="sm" class="bg-white/90 backdrop-blur-sm hover:bg-white">
    <RefreshCw class="mr-1.5 size-4" />
    Change Phase
  </Button>
  <Button variant="secondary" size="sm" class="bg-white/90 backdrop-blur-sm hover:bg-white">
    <Share2 class="mr-1.5 size-4" />
    Share
  </Button>
</div>
```

**What's Wrong:**
The buttons use `variant="secondary"` which applies sage-green text (`--color-secondary-foreground: oklch(0.58 0.06 145)` = sage green) but the inline class `bg-white/90` overrides the background to white. This creates white/off-white text on white background, making the buttons unreadable. The text color is coming from `secondary-foreground` which is a sage green, not white.

**What Should Happen:**
The buttons should either:
- Use white text on a semi-transparent overlay, OR
- Use a different variant that ensures proper contrast

**Severity:** **BLOCKS REVIEW** — Buttons are completely unreadable and block core functionality (Edit, Change Phase, Share)

---

## 2. Property Page Top-Left Text Invisible (Back Button)

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/listings/[id]/+layout.svelte`
**Lines:** 65-70

**Current Code:**
```svelte
<!-- Back button -->
<div class="absolute left-4 top-4">
  <Button variant="secondary" size="sm" href="/listings" class="bg-white/90 backdrop-blur-sm hover:bg-white">
    <ArrowLeft class="mr-1.5 size-4" />
    Listings
  </Button>
</div>
```

**What's Wrong:**
Same issue as above — sage-green text on white/off-white background. The "Listings" label is unreadable.

**Severity:** **BLOCKS REVIEW** — Navigation button is unreadable

---

## 3. Calendar Black Background on Days

**File:** `/Users/brycereynolds/code/hometrack/app/src/lib/components/ui/calendar/calendar-day.svelte`
**Lines:** 14-31

**Current Code:**
The calendar day cells use Tailwind classes that include:
```svelte
"data-[selected]:bg-primary data-[selected]:text-primary-foreground"
```

**What's Wrong:**
When a date is selected, it uses `bg-primary` which is terracotta (`oklch(0.58 0.12 45)` = #C4704B). This creates a dark orange/brown background. The component doesn't currently have a "black background" issue visible in the code, but the reported issue mentions black backgrounds clashing with the warm design system. This may be:
- A bits-ui default override issue
- CSS that hasn't been reviewed, OR
- A misreport about the dark orange being perceived as "black"

**Possible Fix Needed:**
Verify actual rendering. If backgrounds are indeed too dark, they may need adjustment to use a warmer, lighter background for selected dates.

**Severity:** **COSMETIC** — Calendar still functions; styling doesn't match warm design system

---

## 4. Onboarding Progress Circle Broken

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/listings/[id]/+layout.svelte`
**Lines:** 126-151

**Current Code:**
```svelte
<!-- Phase Progress Bar -->
<div class="border-b bg-muted/30 px-4 py-3 -mx-4 md:-mx-6 lg:-mx-8 md:px-6 lg:px-8">
  <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
    {#each PHASE_LIST as phase, i}
      {@const isComplete = phase.order < currentPhaseOrder}
      {@const isCurrent = phase.order === currentPhaseOrder}
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div class="flex items-center gap-1.5">
          <div
            class="size-2.5 rounded-full transition-all {isCurrent ? 'ring-2 ring-offset-1 scale-125' : ''}"
            style="background-color: {isComplete || isCurrent ? phase.color : '#d1d5db'};
                   {isCurrent ? `ring-color: ${phase.color}40` : ''}"
          ></div>
```

**What's Wrong:**
The inline style uses `ring-color` which is not a valid CSS property. The correct property is `--tw-ring-color` or it should use `border` instead. The `ring-offset-1` class requires the ring to be visible, but if `ring-color` doesn't work, the ring won't render.

**Correct Approach:**
Should use Tailwind ring utility classes properly or use CSS custom properties:
```svelte
style="background-color: {isComplete || isCurrent ? phase.color : '#d1d5db'};
       {isCurrent ? `border: 2px solid ${phase.color}40` : ''}"
```

Or use `ring-[color]` syntax or box-shadow.

**Severity:** **COSMETIC** — Progress indicator still shows dots but ring styling is broken

---

## 5. Left Nav "New Listing" Link Non-Functional

**File:** `/Users/brycereynolds/code/hometrack/app/src/lib/components/shared/Sidebar.svelte`
**Line:** 25 (definition), Lines: 112-123 (button)

**Current Code:**
```svelte
const quickActions = [
  { label: 'New Listing', icon: 'plus' },
  { label: 'Voice Memo', icon: 'mic' },
  { label: 'Quick Note', icon: 'file-text' },
];
```

And then rendered as:
```svelte
<button class="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground">
  <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    {#if action.icon === 'plus'}
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    ...
  </svg>
  <span>{action.label}</span>
</button>
```

**What's Wrong:**
The "New Listing" quick action is a `<button>` with no `onclick` handler. It doesn't navigate anywhere. It's a static button. Meanwhile, the proper "New Listing" button on the listings page (line 72-76 of `+page.svelte`) uses `<a href="/listings/new">`, which works correctly.

**What Should Happen:**
The sidebar button should either:
1. Have `href="/listings/new"` and be an `<a>` tag, OR
2. Have an `onclick={() => goto('/listings/new')}`

**Severity:** **BLOCKS REVIEW** — Feature is broken in the sidebar even though it works on the listings page

---

## 6. Client Portal "Copy Link" Not Functional

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/listings/[id]/portal-settings/+page.svelte`
**Lines:** 128-131

**Current Code:**
```svelte
<Button variant="outline" size="sm">
  <Copy class="mr-1.5 size-3.5" />
  Copy Link
</Button>
```

**What's Wrong:**
The button has no `onclick` handler. There's no clipboard API call to copy the `portalUrl` (defined on line 101) to the clipboard.

**What Should Happen:**
Should have an onclick handler that:
1. Copies `portalUrl` to clipboard using `navigator.clipboard.writeText(portalUrl)`
2. Shows success toast/feedback
3. Optionally disables button and shows "Copied!" state

**Severity:** **MISSING FEATURE** — Button exists but does nothing

---

## 7. Voice Memo Modal Missing

**File:** `/Users/brycereynolds/code/hometrack/app/src/lib/components/shared/Sidebar.svelte`
**Lines:** 26 (definition), 112-123 (rendered as button with no handler)

**Current Code:**
Same as issue #5 — it's a button with no `onclick` handler:
```svelte
<button class="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground">
  <svg>... mic icon ...</svg>
  <span>Voice Memo</span>
</button>
```

**What's Wrong:**
The button has no handler. There's a `/mobile/voice-memo` page at `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/mobile/voice-memo/+page.svelte` that could be navigated to, but the sidebar button doesn't do anything. Additionally, the expected behavior is to open a modal, not navigate to a separate page.

**What Should Happen:**
Should open a modal dialog for recording voice memos, not navigate away.

**Severity:** **MISSING FEATURE** — Button exists but is non-functional

---

## 8. Quick Note Modal Missing

**File:** `/Users/brycereynolds/code/hometrack/app/src/lib/components/shared/Sidebar.svelte`
**Line:** 27 (definition), Lines: 112-123 (rendered as button with no handler)

**Current Code:**
Same as issue #7:
```svelte
<button class="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground">
  <svg>... file-text icon ...</svg>
  <span>Quick Note</span>
</button>
```

**What's Wrong:**
The button has no handler. No modal is opened.

**What Should Happen:**
Should open a modal dialog for creating quick notes.

**Severity:** **MISSING FEATURE** — Button exists but is non-functional

---

## 9. Add Contact Modal Missing

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/contacts/+page.svelte`
**Lines:** 64-67

**Current Code:**
```svelte
<Button>
  <Plus class="mr-1.5 size-4" />
  Add Contact
</Button>
```

**What's Wrong:**
The button has no `href` attribute and no `onclick` handler. No modal or navigation occurs.

**What Should Happen:**
Should either:
1. Navigate to a `/contacts/new` page, OR
2. Open a modal dialog to add a contact inline

**Severity:** **MISSING FEATURE** — Button exists but is non-functional

---

## 10. Add Vendor Modal Missing

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/vendors/+page.svelte`
**Lines:** 87-90

**Current Code:**
```svelte
<Button>
  <Plus class="mr-1.5 size-4" />
  Add Vendor
</Button>
```

**What's Wrong:**
Same as issue #9 — button has no `href` attribute and no `onclick` handler.

**What Should Happen:**
Should either navigate to `/vendors/new` or open a modal dialog.

**Severity:** **MISSING FEATURE** — Button exists but is non-functional

---

## 11. Left Nav Vendor Section Doesn't Expand

**File:** `/Users/brycereynolds/code/hometrack/app/src/lib/components/shared/Sidebar.svelte`
**Lines:** 16-22

**Current Code:**
```svelte
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' },
  { label: 'Listings', href: '/listings', icon: 'home', badge: String(listings.length) },
  { label: 'Contacts', href: '/contacts', icon: 'users' },
  { label: 'Vendors', href: '/vendors', icon: 'wrench' },
  { label: 'Analytics', href: '/analytics', icon: 'bar-chart-3' },
];
```

**What's Wrong:**
The nav items are simple objects with `label`, `href`, and `icon`. There's no support for nested/expandable items with sub-items. The "Vendors" item doesn't expand to show "Manage Quotes" as a sub-item like a modern sidebar should.

**What Should Happen:**
The sidebar should support hierarchical navigation where items can have children (subitems) that expand/collapse when clicked.

**What Needs to Change:**
The data structure should support subitems:
```typescript
const navItems = [
  ...
  {
    label: 'Vendors',
    icon: 'wrench',
    items: [
      { label: 'Manage Quotes', href: '/vendors/quotes' }
    ]
  },
  ...
];
```

And the rendering logic should check for `item.items` and render a collapsible group.

**Severity:** **MISSING FEATURE** — Sidebar doesn't support hierarchical navigation

---

## 12. Quote Management Missing Property Link

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/vendors/quotes/+page.svelte`
**Lines:** 166-170 (list view), 280-282 (compare view)

**Current Code (List View):**
```svelte
<div class="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
  <Home class="size-3" />
  <span>{quote.listingAddress}</span>
  <span class="text-border">|</span>
  <span>{quote.scope}</span>
</div>
```

**What's Wrong:**
The property address is displayed as plain text (`{quote.listingAddress}`), but it's not a clickable link. The quote has a `listingId` field (used on line 68 for grouping), but there's no `<a>` tag linking to `/listings/{quote.listingId}`.

**What Should Happen:**
The property address should be a clickable link back to the property listing:
```svelte
<a href="/listings/{quote.listingId}" class="hover:text-primary hover:underline">
  {quote.listingAddress}
</a>
```

**Severity:** **MISSING FEATURE** — Users can't navigate from quote back to the property

---

## 13. Tasks Not Clickable/Editable

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/listings/[id]/tasks/+page.svelte`
**Lines:** 194-234

**Current Code:**
```svelte
{#each phaseTasks as task}
  {@const StatusIcon = getStatusIcon(task.status)}
  <div class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
    <div class="mt-0.5">
      <StatusIcon class="size-5 {getStatusColor(task.status)}" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="text-sm {task.status === 'done' ? 'line-through text-muted-foreground' : 'font-medium'}">
          {task.title}
        </span>
```

**What's Wrong:**
The task items are displayed in `<div>` elements with no interaction handlers. They can't be clicked, edited, marked complete, or interact with in any way. They're read-only displays.

**What Should Happen:**
Task items should:
1. Be clickable to open an edit modal/dialog
2. Have inline editing for title, OR
3. Have a button to mark as complete
4. Show edit/delete options on hover

**Severity:** **BLOCKS REVIEW** — Tasks are non-functional read-only display

---

## 14. Pipeline Board Not Responsive

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/listings/+page.svelte`
**Lines:** 125-209

**Current Code:**
```svelte
<div class="overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
  <div class="flex gap-4" style="min-width: max-content;">
    {#each PHASE_LIST as phase}
      ...
      <div class="w-72 shrink-0">
```

**What's Wrong:**
Each column is fixed at `w-72` (288px) with `shrink-0` preventing it from shrinking. On narrow viewports (mobile/tablet), this creates a very wide container that forces horizontal scrolling. With many phases, the board becomes unusable on small screens because the columns are too wide and don't fit.

**What Should Happen:**
The Kanban board should be:
1. **Mobile:** Stack columns vertically or show one phase at a time
2. **Tablet:** Dynamically reduce column width with responsive classes like `sm:w-64 lg:w-72`
3. Use media queries to adjust column width based on viewport
4. Consider showing 2-3 columns at a time on tablet instead of all columns

**Example Fix:**
```svelte
<div class="w-full sm:w-64 md:w-72 shrink-0">
```

Or add a responsive width utility and use it.

**Severity:** **COSMETIC** — Board still functions but is hard to use on narrow screens

---

## 15. Search Bar Should Be Cmd+K Command Palette

**File:** `/Users/brycereynolds/code/hometrack/app/src/lib/components/shared/AppLayout.svelte`
**Lines:** 68-74

**Current Code:**
```svelte
<!-- Search trigger -->
<button class="flex size-9 items-center justify-center rounded-md text-foreground-secondary hover:bg-background-tertiary" aria-label="Search">
  <svg class="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
</button>
```

**What's Wrong:**
The search button has no `onclick` handler. It's a non-functional icon button. The requirement is to convert this into a command palette using shadcn-svelte's Command component that opens with Cmd+K.

**What Should Happen:**
Should:
1. Open a command palette dialog on Cmd+K keypress
2. Use `shadcn-svelte` Command component
3. Allow fuzzy search across listings, contacts, vendors, etc.
4. Show keyboard shortcut hint "Cmd+K" or "Ctrl+K"

**Reference:** https://www.shadcn-svelte.com/docs/components/command

**Severity:** **MISSING FEATURE** — Search is completely non-functional

---

## 16. Client Portal Preview Not Accessible

**File:** `/Users/brycereynolds/code/hometrack/app/src/routes/(app)/listings/[id]/portal-settings/+page.svelte`
**Lines:** 111-114

**Current Code:**
```svelte
<Button size="sm" variant="outline">
  <ExternalLink class="mr-1.5 size-4" />
  Preview Portal
</Button>
```

**What's Wrong:**
The button has no `onclick` handler and no `href` attribute. It doesn't navigate to or preview the client portal. The `portalUrl` is defined on line 101 but not used.

**What Should Happen:**
Should either:
1. Have `href="{portalUrl}"` target="_blank" to open the portal in a new tab, OR
2. Have an `onclick` handler to preview the portal inline
3. Show "Go to client portal" functionality as reported

**Severity:** **MISSING FEATURE** — Button is non-functional

---

## 17. ShadCN Component Usage Audit

**Status:** Command component is imported and available in the codebase
**File:** `/Users/brycereynolds/code/hometrack/app/src/lib/components/ui/command/`

**Components Installed:**
- command-dialog.svelte ✓
- command-empty.svelte ✓
- command-group.svelte ✓
- command-input.svelte ✓
- command-item.svelte ✓
- command-link-item.svelte ✓
- command-list.svelte ✓
- command-loading.svelte ✓
- command-separator.svelte ✓
- command-shortcut.svelte ✓
- command.svelte ✓

**Current Usage:**
Not currently used anywhere in the application. All the Command components are installed but no pages are using them.

**Missing Dialog Component Usage:**
Most action buttons (Add Contact, Add Vendor, Voice Memo, Quick Note, Copy Link) should use the Dialog component from `/Users/brycereynolds/code/hometrack/app/src/lib/components/ui/dialog/` but they don't.

**Severity:** **INFO** — Components are available; they just need to be implemented

---

## Summary Table

| # | Issue | Severity | Type |
|---|-------|----------|------|
| 1 | White-on-white buttons (top-right) | BLOCKS REVIEW | Bug |
| 2 | Invisible back button text | BLOCKS REVIEW | Bug |
| 3 | Calendar dark backgrounds | COSMETIC | Design |
| 4 | Progress circle ring styling broken | COSMETIC | Bug |
| 5 | Sidebar "New Listing" non-functional | BLOCKS REVIEW | Missing Feature |
| 6 | Portal "Copy Link" non-functional | MISSING FEATURE | Bug |
| 7 | Voice Memo modal missing | MISSING FEATURE | Bug |
| 8 | Quick Note modal missing | MISSING FEATURE | Bug |
| 9 | Add Contact modal missing | MISSING FEATURE | Bug |
| 10 | Add Vendor modal missing | MISSING FEATURE | Bug |
| 11 | Sidebar expansion not supported | MISSING FEATURE | Design |
| 12 | Quote missing property link | MISSING FEATURE | Bug |
| 13 | Tasks not interactive | BLOCKS REVIEW | Missing Feature |
| 14 | Pipeline board not responsive | COSMETIC | Design |
| 15 | Search bar not command palette | MISSING FEATURE | Major Feature |
| 16 | Portal preview not accessible | MISSING FEATURE | Bug |
| 17 | ShadCN components available | INFO | Audit |

**Critical Path Blockers (BLOCKS REVIEW):**
- Issues #1, #2: Button contrast problems prevent property editing
- Issue #5: Sidebar navigation broken
- Issue #13: Task management non-functional

**Recommended Priority Order:**
1. Fix white-on-white buttons (#1, #2)
2. Make tasks interactive (#13)
3. Implement missing modals (#7, #8, #9, #10)
4. Fix sidebar navigation (#5, #11)
5. Add copy to clipboard (#6)
6. Add property links (#12)
7. Implement command palette (#15)
8. Responsive Kanban (#14)
9. Portal preview (#16)

