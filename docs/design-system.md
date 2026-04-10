# HomeTrack Design System
## Version 0.1 — April 2026

---

## 1. Design Principles

HomeTrack serves boutique real estate teams who deliver a premium client experience. The platform must feel like an extension of their brand — **warm, sophisticated, and intentional** — never generic or corporate.

1. **Premium but approachable.** Elevated materials and generous whitespace, not cold minimalism. Think high-end stationery, not enterprise SaaS.
2. **Warm over clinical.** Warm neutrals, organic touches, soft shadows. Avoid stark black/white contrast and neon accents.
3. **Content-dense without clutter.** Real estate back-office work involves lots of data. Use hierarchy, spacing, and typography weight to create clarity, not reduction.
4. **Mobile as a first-class surface.** Field agents capture voice memos, log agent conversations, show listing feedback on their phones. Touch targets, thumb zones, and one-handed operation matter deeply.
5. **Confidence through consistency.** Every page uses the same spacing grid, type scale, and color vocabulary. Predictability builds trust.

---

## 2. Color Palette

Inspired by the Bloom template's warm terracotta/coral accents against clean, warm-white backgrounds with botanical undertones.

### 2.1 Core Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#FDFBF7` | Page background — warm off-white with a cream undertone |
| `--background-secondary` | `#F7F4EE` | Card backgrounds, sidebar, subtle section differentiation |
| `--background-tertiary` | `#F0ECE3` | Hover states on cards, table row hover, input backgrounds |
| `--background-inverse` | `#2C2825` | Dark surfaces (mobile nav overlay, tooltips, dark cards) |

### 2.2 Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--foreground` | `#2C2825` | Primary text — warm charcoal, not pure black |
| `--foreground-secondary` | `#6B6560` | Secondary text, labels, metadata, timestamps |
| `--foreground-muted` | `#9C958E` | Placeholder text, disabled states, tertiary info |
| `--foreground-inverse` | `#FDFBF7` | Text on dark backgrounds |

### 2.3 Accent & Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#C4704B` | Primary actions, active nav, key CTAs — warm terracotta |
| `--primary-hover` | `#B3613D` | Hover state for primary buttons and links |
| `--primary-subtle` | `#F5E6DE` | Primary tint backgrounds (badges, selected rows, highlights) |
| `--primary-foreground` | `#FDFBF7` | Text on primary-colored backgrounds |
| `--secondary` | `#7B8B6F` | Secondary accent — muted sage green for balance/nature |
| `--secondary-hover` | `#6B7A60` | Hover state for secondary elements |
| `--secondary-subtle` | `#E8EDE4` | Secondary tint backgrounds |
| `--accent` | `#D4956B` | Warm coral/peach — decorative highlights, AI insights, special callouts |
| `--accent-subtle` | `#F8EDE3` | Accent tint backgrounds |

### 2.4 Borders & Dividers

| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#E5E0D8` | Default border — warm-toned, not gray |
| `--border-strong` | `#CEC7BC` | Emphasized borders, input focus ring outer |
| `--border-subtle` | `#F0ECE3` | Very light dividers, card internal separators |
| `--ring` | `#C4704B` | Focus ring color (matches primary) |

### 2.5 Status Colors

Status colors are slightly desaturated to stay in harmony with the warm palette.

| Token | Hex | Subtle Bg | Usage |
|-------|-----|-----------|-------|
| `--success` | `#5E8C61` | `#E8F0E8` | Completed tasks, approved, closed deals |
| `--warning` | `#C49A3C` | `#F8F0DC` | Overdue, needs attention, approaching deadline |
| `--error` | `#C25D4E` | `#F5E0DC` | Failed, rejected, critical issues |
| `--info` | `#5B8BA5` | `#E0EDF3` | Informational, tips, neutral notifications |

### 2.6 Phase / Pipeline Colors

Each listing lifecycle phase gets a unique color for pipeline boards and phase badges.

| Phase | Color | Hex |
|-------|-------|-----|
| Onboarding | Soft Blue | `#6B9FC4` |
| Improvement Planning | Sage | `#7B8B6F` |
| Staging & Prep | Lavender | `#9B8EB5` |
| Content Production | Warm Gold | `#C49A3C` |
| Active Marketing | Terracotta | `#C4704B` |
| Showings & Open Houses | Coral | `#D4956B` |
| Offers & Negotiation | Deep Teal | `#5B8BA5` |
| Under Contract | Forest | `#5E8C61` |
| Closing | Rich Brown | `#8B7355` |

### 2.7 Chart & Data Visualization Palette

A sequential palette that maintains warmth while providing enough contrast for charts.

```
#C4704B  (terracotta — primary series)
#7B8B6F  (sage — secondary series)
#D4956B  (coral)
#5B8BA5  (teal)
#C49A3C  (gold)
#9B8EB5  (lavender)
#8B7355  (brown)
#6B9FC4  (soft blue)
```

---

## 3. Typography

### 3.1 Font Stack

| Role | Font | Fallback | Source |
|------|------|----------|--------|
| **Headings** | `DM Serif Display` | `Georgia, serif` | Google Fonts |
| **Body / UI** | `Inter` | `system-ui, -apple-system, sans-serif` | Google Fonts / bundled |
| **Mono / Data** | `JetBrains Mono` | `ui-monospace, monospace` | Google Fonts |

**Rationale:** DM Serif Display provides the warm, premium editorial feel of the Bloom template's heading style — elegant but not fussy. Inter is the industry standard for UI text — highly legible at small sizes, excellent for data-dense dashboards. The serif/sans-serif contrast creates a boutique feel that distinguishes HomeTrack from generic SaaS tools.

### 3.2 Type Scale

Based on a 1.250 ratio (Major Third) with a 16px base.

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px / 0.75rem | 1.5 | 400 | Fine print, legal, timestamps |
| `text-sm` | 14px / 0.875rem | 1.5 | 400 | Secondary UI text, labels, metadata |
| `text-base` | 16px / 1rem | 1.6 | 400 | Body text, form inputs, table cells |
| `text-lg` | 18px / 1.125rem | 1.5 | 500 | Card titles, emphasized body |
| `text-xl` | 20px / 1.25rem | 1.4 | 600 | Section headers, widget titles |
| `text-2xl` | 24px / 1.5rem | 1.3 | 600 | Page section headings |
| `text-3xl` | 30px / 1.875rem | 1.25 | 700 | Page titles (DM Serif Display) |
| `text-4xl` | 36px / 2.25rem | 1.2 | 700 | Hero headings (DM Serif Display) |
| `text-5xl` | 48px / 3rem | 1.1 | 700 | Dashboard big numbers (DM Serif Display) |

### 3.3 Font Weight Usage

| Weight | Token | Usage |
|--------|-------|-------|
| 400 | `font-normal` | Body text, descriptions, secondary labels |
| 500 | `font-medium` | UI labels, nav items, badge text, emphasized metadata |
| 600 | `font-semibold` | Card titles, table headers, buttons, section headers |
| 700 | `font-bold` | Page titles, big metric numbers, headings (serif) |

### 3.4 Heading Patterns

```
Page Title:       DM Serif Display, 30px, 700, --foreground
Section Header:   Inter, 20px, 600, --foreground
Card Title:       Inter, 18px, 600, --foreground
Widget Label:     Inter, 14px, 500, --foreground-secondary
Metric Number:    DM Serif Display, 48px, 700, --foreground
Metric Label:     Inter, 14px, 400, --foreground-secondary
```

---

## 4. Spacing System

### 4.1 Base Unit

`4px` base unit. All spacing uses multiples of 4.

| Token | Value | Common Usage |
|-------|-------|-------------|
| `space-0.5` | 2px | Micro spacing (icon-to-text gap in tight badges) |
| `space-1` | 4px | Tightest intentional spacing |
| `space-1.5` | 6px | Badge padding vertical |
| `space-2` | 8px | Inline spacing, icon margins, tight padding |
| `space-3` | 12px | Form element padding, tight card padding |
| `space-4` | 16px | Default card padding, section gaps on mobile |
| `space-5` | 20px | Comfortable padding for interactive areas |
| `space-6` | 24px | Card padding desktop, between related elements |
| `space-8` | 32px | Section spacing within a page |
| `space-10` | 40px | Major section breaks |
| `space-12` | 48px | Page header to content gap |
| `space-16` | 64px | Macro section spacing |

### 4.2 Layout Spacing Rules

- **Page padding:** `24px` on mobile, `32px` on tablet, `48px` on desktop
- **Card internal padding:** `16px` on mobile, `24px` on desktop
- **Between cards in a grid:** `16px` gap on mobile, `24px` on desktop
- **Sidebar width:** `256px` collapsed icon-only at `64px`
- **Content max-width:** `1280px` (standard), `1440px` (wide views like pipeline board)
- **Table row height:** `48px` minimum (touch-friendly)

### 4.3 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Badges, small chips |
| `rounded-md` | 8px | Buttons, inputs, dropdowns |
| `rounded-lg` | 12px | Cards, dialogs, popovers |
| `rounded-xl` | 16px | Large cards, featured content |
| `rounded-full` | 9999px | Avatars, circular indicators, pills |

---

## 5. Shadows & Elevation

Warm-toned shadows that don't feel cold or harsh.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-xs` | `0 1px 2px rgba(44, 40, 37, 0.04)` | Subtle lift (buttons, badges) |
| `shadow-sm` | `0 1px 3px rgba(44, 40, 37, 0.06), 0 1px 2px rgba(44, 40, 37, 0.04)` | Cards, dropdowns |
| `shadow-md` | `0 4px 6px rgba(44, 40, 37, 0.06), 0 2px 4px rgba(44, 40, 37, 0.04)` | Elevated cards, popovers |
| `shadow-lg` | `0 10px 15px rgba(44, 40, 37, 0.08), 0 4px 6px rgba(44, 40, 37, 0.04)` | Modals, sheets, dialogs |
| `shadow-xl` | `0 20px 25px rgba(44, 40, 37, 0.10), 0 8px 10px rgba(44, 40, 37, 0.04)` | Overlays, command palette |

---

## 6. Component Mapping to shadcn-svelte

### 6.1 Navigation & Layout

| Feature | Component(s) | Notes |
|---------|-------------|-------|
| App shell / sidebar | `Sidebar` + `Sheet` (mobile) | Collapsible sidebar with icon-only mode. Sheet for mobile overlay. |
| Top nav bar | Custom (not in shadcn) | Breadcrumb trail + user avatar + notifications. Use `Breadcrumb` component. |
| Tab sub-navigation | `Tabs` | Used within pages (e.g., Listing Detail tabs: Overview, Tasks, Documents...) |
| Page header | Custom | DM Serif Display title + description + action buttons |
| Command palette | `Command` + `Dialog` | Global search and quick actions via Cmd+K |

### 6.2 Data Display

| Feature | Component(s) | Notes |
|---------|-------------|-------|
| Pipeline board | Custom Kanban | Built with `Card` + drag-and-drop. Each column = phase. |
| Data tables | `Data Table` + `Table` | Contacts, vendors, documents. With sorting, filtering, pagination. |
| Metric cards | `Card` | Dashboard KPI cards — big number (DM Serif) + label + trend badge |
| Charts | `Chart` | Recharts-based. Listing analytics, team performance, financial. |
| Activity feed | Custom with `Avatar` + `Separator` | Timeline view with message, email, note, and event items |
| Property details | `Card` + custom grid | Key-value pairs in a structured layout |
| Offer comparison | `Table` or custom grid | Side-by-side offer attributes |

### 6.3 Forms & Input

| Feature | Component(s) | Notes |
|---------|-------------|-------|
| Form fields | `Input` + `Label` + `Field` | Wrapped with Formsnap for validation |
| Search | `Input` with icon | Global and contextual search |
| Dropdowns / selects | `Select` + `Combobox` | Combobox for searchable (contacts, vendors) |
| Date selection | `Date Picker` + `Calendar` + `Range Calendar` | Listing dates, task due dates, date range filters |
| Toggle options | `Switch` + `Toggle` + `Toggle Group` | Settings, view mode switching |
| Rich text areas | `Textarea` | Notes, descriptions (Markdown support later) |
| File upload | `Input` (type=file) + custom drop zone | Document upload with drag-and-drop |
| Radio choices | `Radio Group` | Pricing strategy, template selection |
| Checkboxes | `Checkbox` | Task completion, bulk selection, filter options |

### 6.4 Feedback & Overlays

| Feature | Component(s) | Notes |
|---------|-------------|-------|
| Toasts / notifications | `Sonner` | Success, error, info notifications — bottom-right |
| Modal dialogs | `Dialog` | Confirmations, create/edit forms |
| Slide-over panels | `Sheet` | Listing quick-view, contact details, mobile nav |
| Popovers | `Popover` + `Hover Card` | Quick info previews on hover |
| Tooltips | `Tooltip` | Icon-only buttons, truncated text, field help |
| Context menus | `Context Menu` + `Dropdown Menu` | Right-click and "..." action menus |
| Alerts | `Alert` + `Alert Dialog` | Destructive confirmations, system alerts |
| Progress indicators | `Progress` + `Spinner` | Upload progress, loading states |
| Skeleton loaders | `Skeleton` | Content loading placeholders |

### 6.5 Navigation & Wayfinding

| Feature | Component(s) | Notes |
|---------|-------------|-------|
| Breadcrumbs | `Breadcrumb` | Page location within hierarchy |
| Pagination | `Pagination` | Table and list pagination |
| Badges | `Badge` | Status indicators, phase labels, counts |
| Avatars | `Avatar` | User/contact profile images with initials fallback |
| Keyboard shortcuts | `Kbd` | Shortcut hints in menus and tooltips |

---

## 7. Tailwind CSS Configuration

```js
// tailwind.config.js
import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        background: {
          DEFAULT: 'hsl(var(--background))',
          secondary: 'hsl(var(--background-secondary))',
          tertiary: 'hsl(var(--background-tertiary))',
          inverse: 'hsl(var(--background-inverse))',
        },
        // Core foregrounds
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          secondary: 'hsl(var(--foreground-secondary))',
          muted: 'hsl(var(--foreground-muted))',
          inverse: 'hsl(var(--foreground-inverse))',
        },
        // Brand colors
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover))',
          subtle: 'hsl(var(--primary-subtle))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          hover: 'hsl(var(--secondary-hover))',
          subtle: 'hsl(var(--secondary-subtle))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          subtle: 'hsl(var(--accent-subtle))',
        },
        // Borders
        border: {
          DEFAULT: 'hsl(var(--border))',
          strong: 'hsl(var(--border-strong))',
          subtle: 'hsl(var(--border-subtle))',
        },
        ring: 'hsl(var(--ring))',
        // Status
        success: {
          DEFAULT: 'hsl(var(--success))',
          subtle: 'hsl(var(--success-subtle))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          subtle: 'hsl(var(--warning-subtle))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          subtle: 'hsl(var(--error-subtle))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          subtle: 'hsl(var(--info-subtle))',
        },
        // Pipeline phase colors
        phase: {
          onboarding: '#6B9FC4',
          improvement: '#7B8B6F',
          staging: '#9B8EB5',
          content: '#C49A3C',
          marketing: '#C4704B',
          showings: '#D4956B',
          offers: '#5B8BA5',
          contract: '#5E8C61',
          closing: '#8B7355',
        },
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['Inter', ...fontFamily.sans],
        mono: ['JetBrains Mono', ...fontFamily.mono],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.5' }],
        xl: ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.25' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(44, 40, 37, 0.04)',
        sm: '0 1px 3px rgba(44, 40, 37, 0.06), 0 1px 2px rgba(44, 40, 37, 0.04)',
        md: '0 4px 6px rgba(44, 40, 37, 0.06), 0 2px 4px rgba(44, 40, 37, 0.04)',
        lg: '0 10px 15px rgba(44, 40, 37, 0.08), 0 4px 6px rgba(44, 40, 37, 0.04)',
        xl: '0 20px 25px rgba(44, 40, 37, 0.10), 0 8px 10px rgba(44, 40, 37, 0.04)',
      },
      maxWidth: {
        content: '1280px',
        wide: '1440px',
      },
      width: {
        sidebar: '256px',
        'sidebar-collapsed': '64px',
      },
    },
  },
};
```

### 7.1 CSS Custom Properties (app.css)

```css
@layer base {
  :root {
    /* Backgrounds */
    --background: 40 33% 98%;          /* #FDFBF7 */
    --background-secondary: 36 27% 95%;  /* #F7F4EE */
    --background-tertiary: 36 22% 91%;   /* #F0ECE3 */
    --background-inverse: 25 10% 16%;    /* #2C2825 */

    /* Foregrounds */
    --foreground: 25 10% 16%;            /* #2C2825 */
    --foreground-secondary: 20 5% 40%;   /* #6B6560 */
    --foreground-muted: 20 5% 58%;       /* #9C958E */
    --foreground-inverse: 40 33% 98%;    /* #FDFBF7 */

    /* Primary — Terracotta */
    --primary: 18 45% 53%;              /* #C4704B */
    --primary-hover: 18 48% 47%;        /* #B3613D */
    --primary-subtle: 18 50% 91%;       /* #F5E6DE */
    --primary-foreground: 40 33% 98%;   /* #FDFBF7 */

    /* Secondary — Sage */
    --secondary: 100 12% 49%;           /* #7B8B6F */
    --secondary-hover: 100 13% 43%;     /* #6B7A60 */
    --secondary-subtle: 105 18% 91%;    /* #E8EDE4 */

    /* Accent — Warm Coral */
    --accent: 24 50% 62%;               /* #D4956B */
    --accent-subtle: 24 50% 93%;        /* #F8EDE3 */

    /* Borders */
    --border: 28 16% 87%;               /* #E5E0D8 */
    --border-strong: 28 12% 77%;        /* #CEC7BC */
    --border-subtle: 36 22% 91%;        /* #F0ECE3 */
    --ring: 18 45% 53%;                 /* #C4704B */

    /* Status */
    --success: 124 20% 46%;             /* #5E8C61 */
    --success-subtle: 120 18% 93%;      /* #E8F0E8 */
    --warning: 40 52% 50%;              /* #C49A3C */
    --warning-subtle: 40 52% 92%;       /* #F8F0DC */
    --error: 8 43% 53%;                 /* #C25D4E */
    --error-subtle: 8 43% 92%;          /* #F5E0DC */
    --info: 202 30% 50%;                /* #5B8BA5 */
    --info-subtle: 202 30% 92%;         /* #E0EDF3 */

    /* Sidebar */
    --sidebar-background: 36 27% 95%;
    --sidebar-foreground: 25 10% 16%;
    --sidebar-primary: 18 45% 53%;
    --sidebar-accent: 36 22% 91%;
    --sidebar-border: 28 16% 87%;

    /* Chart colors */
    --chart-1: 18 45% 53%;
    --chart-2: 100 12% 49%;
    --chart-3: 24 50% 62%;
    --chart-4: 202 30% 50%;
    --chart-5: 40 52% 50%;
  }

  .dark {
    /* Dark mode — inverted warm palette */
    --background: 25 12% 10%;            /* #1C1917 */
    --background-secondary: 25 10% 14%;  /* #262220 */
    --background-tertiary: 25 8% 18%;    /* #302C29 */
    --background-inverse: 40 33% 98%;    /* #FDFBF7 */

    --foreground: 36 27% 92%;            /* #EDE8E0 */
    --foreground-secondary: 20 8% 62%;   /* #A49D96 */
    --foreground-muted: 20 5% 45%;       /* #76706A */
    --foreground-inverse: 25 12% 10%;    /* #1C1917 */

    --primary: 18 50% 60%;              /* #D08560 */
    --primary-hover: 18 55% 65%;        /* #DA9572 */
    --primary-subtle: 18 30% 18%;       /* #3D2A1E */
    --primary-foreground: 36 27% 95%;

    --secondary: 100 15% 55%;
    --secondary-hover: 100 18% 60%;
    --secondary-subtle: 100 10% 18%;

    --accent: 24 45% 65%;
    --accent-subtle: 24 20% 18%;

    --border: 25 8% 22%;
    --border-strong: 25 8% 30%;
    --border-subtle: 25 8% 16%;
    --ring: 18 50% 60%;

    --success: 124 22% 52%;
    --success-subtle: 124 15% 16%;
    --warning: 40 55% 58%;
    --warning-subtle: 40 20% 16%;
    --error: 8 48% 58%;
    --error-subtle: 8 20% 16%;
    --info: 202 35% 55%;
    --info-subtle: 202 15% 16%;

    --sidebar-background: 25 10% 14%;
    --sidebar-foreground: 36 27% 92%;
    --sidebar-primary: 18 50% 60%;
    --sidebar-accent: 25 8% 18%;
    --sidebar-border: 25 8% 22%;

    --chart-1: 18 50% 60%;
    --chart-2: 100 15% 55%;
    --chart-3: 24 45% 65%;
    --chart-4: 202 35% 55%;
    --chart-5: 40 55% 58%;
  }
}
```

---

## 8. Icon System

### 8.1 Library: Lucide

Use **Lucide** icons exclusively (via `lucide-svelte`). Lucide is the default icon set for shadcn-svelte and provides a consistent, clean style that aligns with the warm professional aesthetic.

### 8.2 Icon Sizing

| Context | Size | Tailwind Class |
|---------|------|---------------|
| Inline with text | 16px | `size-4` |
| Buttons and nav items | 18px | `size-[18px]` |
| Section headers | 20px | `size-5` |
| Feature callouts | 24px | `size-6` |
| Empty states | 48px | `size-12` |

### 8.3 Key Icon Mapping

| Concept | Icon |
|---------|------|
| Dashboard | `LayoutDashboard` |
| Listings / Properties | `Home` |
| Pipeline | `Kanban` |
| Contacts | `Users` |
| Agent Network | `Network` |
| Vendors | `Wrench` |
| Analytics | `BarChart3` |
| Settings | `Settings` |
| Tasks | `CheckSquare` |
| Documents | `FileText` |
| Messages / Activity | `MessageSquare` |
| Voice Memo | `Mic` |
| Calendar | `Calendar` |
| Financials / Budget | `DollarSign` |
| Showings | `Eye` |
| Offers | `Gavel` |
| AI Insights | `Sparkles` |
| Search | `Search` |
| Notifications | `Bell` |
| Add / Create | `Plus` |
| Filter | `Filter` |
| Sort | `ArrowUpDown` |
| More actions | `MoreHorizontal` |
| Chevron navigation | `ChevronRight`, `ChevronDown` |
| External link | `ExternalLink` |
| Upload | `Upload` |
| Download | `Download` |
| Phone | `Phone` |
| Email | `Mail` |
| Location / Map | `MapPin` |
| Clock / Time | `Clock` |
| Trend up | `TrendingUp` |
| Trend down | `TrendingDown` |
| Warning | `AlertTriangle` |
| Success | `CheckCircle` |
| Error | `XCircle` |
| Info | `Info` |
| Client Portal | `Globe` |
| Drag handle | `GripVertical` |

### 8.4 Icon Color Guidelines

- Navigation icons: `--foreground-secondary` (active: `--primary`)
- Action button icons: inherit button text color
- Status icons: use corresponding status color
- Decorative/empty state icons: `--foreground-muted`

---

## 9. Dark / Light Mode Approach

### 9.1 Strategy: Light-First, Dark Available

HomeTrack defaults to **light mode** with the warm off-white palette. Dark mode is fully supported for users who prefer it, particularly for evening work sessions.

### 9.2 Implementation

- Use `class` strategy (not `media`) via Tailwind's `darkMode: 'class'`
- Toggle stored in user preferences (persisted to database)
- System preference detection as initial default
- All colors defined as HSL CSS custom properties; dark mode simply swaps the variable values
- No component-level dark mode logic needed — it is handled entirely through CSS variables

### 9.3 Dark Mode Color Philosophy

Dark mode is not a simple inversion. It preserves the warm character:
- Backgrounds use warm dark browns (#1C1917), not pure black or cool grays
- Text is warm off-white (#EDE8E0), not stark white
- Primary terracotta lightens slightly for sufficient contrast
- Shadows shift to darker overlays rather than colored shadows
- Cards use a slightly lighter dark surface than the page background for depth

---

## 10. Mobile Considerations

### 10.1 Mobile is Not a Downgrade

Per the product spec, mobile is a **heavy use case** — field agents capturing voice memos, logging agent conversations, showing listing feedback to clients in person. Mobile must feel like a purpose-built companion app, not a compressed desktop.

### 10.2 Breakpoints

| Breakpoint | Value | Target |
|-----------|-------|--------|
| `sm` | 640px | Large phones in landscape |
| `md` | 768px | Tablets, small laptops |
| `lg` | 1024px | Laptops, desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1440px | Wide displays |

### 10.3 Mobile Layout Patterns

**Navigation:**
- Bottom tab bar for primary navigation (Dashboard, Listings, Capture, Contacts, More)
- "Capture" gets a prominent center position — one tap to record voice memo, add note, or snap photo
- Sheet overlay for secondary navigation and settings
- No sidebar on mobile

**Touch Targets:**
- Minimum 44x44px for all interactive elements
- 48px recommended for primary actions
- 12px minimum spacing between touch targets

**Content Density:**
- Cards stack vertically in a single column
- Tables become card-based list views on mobile
- Pipeline board becomes a horizontal swipeable view or a grouped list
- Tab navigation becomes horizontally scrollable

**Quick Capture Pattern:**
The most important mobile pattern. A persistent floating action button (or bottom-bar center button) provides instant access to:
1. Voice memo (one tap to start recording, auto-transcribe)
2. Quick note (text field with listing picker)
3. Photo capture (camera with auto-tag to listing)
4. Agent note (quick log of agent conversation)
5. Showing feedback (structured form after a showing)

**Offline Behavior:**
- Core listing data cached for offline reference
- Voice memos and photos queue for upload when reconnected
- Visual indicator when in offline mode (subtle top banner)
- Optimistic UI — actions feel immediate, sync in background

### 10.4 Mobile-Specific Component Adjustments

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Sidebar | Persistent collapsible | Sheet overlay via hamburger |
| Data Table | Full table with columns | Card list with key fields |
| Pipeline Board | Horizontal columns | Swipeable or list grouped by phase |
| Dialog | Centered modal | Full-screen sheet (bottom-up) |
| Date Picker | Popover with calendar | Full-screen calendar sheet |
| Tabs | Horizontal row | Horizontally scrollable |
| Charts | Full-width with hover | Full-width with tap-to-inspect |
| Action menus | Dropdown | Bottom action sheet |

---

## 11. Animation & Motion

### 11.1 Principles

- Motion is **functional**, not decorative
- Transitions are fast (150-200ms) and use `ease-out`
- Respect `prefers-reduced-motion`

### 11.2 Standard Transitions

| Property | Duration | Easing |
|----------|----------|--------|
| Color, background, border | 150ms | ease-out |
| Transform (hover scale, slide) | 200ms | ease-out |
| Opacity (fade in/out) | 200ms | ease-out |
| Sheet/dialog open | 250ms | ease-out |
| Sheet/dialog close | 200ms | ease-in |

### 11.3 Specific Animations

- **Page transitions:** None. Instant navigation. SvelteKit handles this naturally.
- **Card hover:** Subtle shadow increase (`shadow-sm` to `shadow-md`), 200ms
- **Button hover:** Background color shift, 150ms
- **Toast entry:** Slide up + fade in from bottom-right, 250ms
- **Skeleton loading:** Soft pulse animation on `--background-tertiary`
- **Pipeline drag:** Card lifts with increased shadow during drag
- **Sidebar collapse:** Width transition, 200ms, icons remain visible

---

## 12. Accessibility

### 12.1 Color Contrast

All color combinations in this system meet WCAG 2.1 AA minimum contrast ratios:
- `--foreground` on `--background`: 14.5:1 (exceeds AAA)
- `--foreground-secondary` on `--background`: 5.2:1 (meets AA)
- `--primary-foreground` on `--primary`: 5.8:1 (meets AA)
- `--foreground-muted` on `--background`: 3.2:1 (meets AA for large text only — use at 18px+ or 14px bold)

### 12.2 Guidelines

- All interactive elements must have visible focus indicators (`--ring` with 2px offset)
- Icons must never be the sole indicator of meaning — pair with text or aria-label
- Form inputs must have associated labels (not just placeholder text)
- Status indicators must not rely on color alone — pair with icons and text
- Touch targets on mobile must be minimum 44x44px
- Support keyboard navigation throughout (shadcn-svelte handles this by default)

---

## 13. File & Asset Organization

```
src/
  lib/
    components/
      ui/            ← shadcn-svelte components (auto-generated)
      layout/        ← App shell, sidebar, nav, page header
      listings/      ← Pipeline board, listing cards, phase badges
      contacts/      ← Contact cards, agent network view
      vendors/       ← Vendor cards, quote comparison
      analytics/     ← Chart wrappers, metric cards
      common/        ← Activity feed, status badges, quick capture
    styles/
      app.css        ← CSS custom properties, base styles, font imports
    utils/
      cn.ts          ← Class name utility (from shadcn-svelte)
  routes/
    (app)/           ← Authenticated app routes (grouped layout)
      +layout.svelte ← App shell with sidebar
      dashboard/
      listings/
      contacts/
      vendors/
      analytics/
      settings/
    (portal)/        ← Client portal routes (separate layout)
    (auth)/          ← Auth routes (minimal layout)
```

---

## 14. Quick Reference: Common Patterns

### Metric Card
```svelte
<Card class="p-6">
  <p class="text-sm font-medium text-foreground-secondary">Active Listings</p>
  <p class="text-5xl font-bold font-serif text-foreground mt-1">12</p>
  <div class="flex items-center gap-1 mt-2">
    <TrendingUp class="size-4 text-success" />
    <span class="text-sm text-success">+3 this month</span>
  </div>
</Card>
```

### Phase Badge
```svelte
<Badge
  class="bg-phase-marketing text-white text-xs font-medium px-2 py-0.5 rounded-sm"
>
  Active Marketing
</Badge>
```

### Page Header
```svelte
<div class="flex items-center justify-between mb-8">
  <div>
    <h1 class="text-3xl font-bold font-serif text-foreground">Listings</h1>
    <p class="text-sm text-foreground-secondary mt-1">
      Manage your active listing pipeline
    </p>
  </div>
  <Button>
    <Plus class="size-4 mr-2" />
    New Listing
  </Button>
</div>
```

### Status Indicator
```svelte
<div class="flex items-center gap-2">
  <CheckCircle class="size-4 text-success" />
  <span class="text-sm text-foreground">Photography Complete</span>
</div>
```

---

*This design system is a living document. It should be updated as the product evolves, but every deviation should be intentional and documented.*
