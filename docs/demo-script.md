# HomeTrack Demo Script

**Format:** ~45-minute walkthrough with room for Q&A
**Tone:** Presenter bullet points -- glance and riff, not read verbatim
**Arc:** New listing -> walk property -> capture notes -> AI extracts tasks -> market analysis -> set price -> manage the deal -> client portal -> close

---

## 1. The Hook (2 min)

- "HomeTrack is the operating system for modern real estate teams"
- The problem: listing agents juggle properties, vendors, clients, docs, timelines, money -- across text threads, spreadsheets, email, paper
- Our take: one place to run everything, with AI doing the grunt work
- Demo action: Start at root URL, show landing page hero + waitlist
- Wow moment: "Every walkthrough becomes actionable intelligence"

---

## 2. Dashboard -- Your World at a Glance (3 min)

- Four numbers that matter: active listings, pipeline value, avg DOM, open tasks
- Each has a trend arrow vs last month
- Pipeline summary by phase -- are things moving or stuck?
- Team workload chart -- who's overloaded, who has capacity
- Upcoming showings -- next 3, right there
- Demo action: Click between upcoming/overdue task tabs
- Calendar download: click the calendar icon on any task to download an .ics file
- Reminder: click the bell icon to set a reminder (toast placeholder)

### AI Alerts

- "Your alerts are the system telling you what needs attention RIGHT NOW"
- "Unanswered client message" -- David Nguyen asked about parking. The system detected an unanswered question and surfaced it. Click it, goes straight to the activity feed
- "Buyer match found" -- Sarah Kim's buyer preferences match one of our listings. The system connected a buyer to inventory automatically
- These are AI-generated, not manual. The system is working for you in the background
- Demo action: Dismiss an alert with the X button on dashboard, or Acknowledge on listing overview
- Wow moment: AI as a smart assistant tapping you on the shoulder

---

## 3. Add a Listing / Property Auto-Populates (3 min)

- 6-step wizard: property details, pricing, client, team, phase, review
- Type an address and property data auto-populates -- beds, baths, sqft, lot, year built, photos, features
- 70-column properties table is the single source of truth
- Autocomplete for client and agent selection
- Demo action: Click through the wizard steps
- Wow moment: "You type an address, and it pulls in everything from Zillow data"

---

## 4. Listings Pipeline (3 min)

- Three views: kanban board, list, map
- Kanban: four columns by phase, each card shows photo, price, days in phase, task progress

### Live Demo: Drag a listing to a new phase

- Drag a card from pre-market to active
- Watch the toast: "Moved to Active"
- Refresh -- it persists
- This hits a real API endpoint, updates the database

- List view: sortable, searchable, filterable
- Map view: Leaflet markers colored by phase, click for popup details

---

## 5. Walk Through a Property -- Capture Field Notes (5 min)

### Live Demo: Record a voice memo

- Open the Capture Note modal (or Cmd+K -> Capture Note)
- Select listing from dropdown
- Pick a tag (showing, vendor, client, general)
- Hit Record -- see the waveform animation
- Talk through what you see: "Kitchen needs new countertops, bathroom grout is cracked, seller mentioned they'd cover roof repairs"
- Stop recording, play it back
- Optionally type additional notes and attach photos
- Hit Save
- Watch the processing status: pending -> processing -> completed
- Come back to the field note detail: full transcript, AI-extracted action items
- Each action item has priority and category
- Accept a task -- it appears in the task list. Dismiss another -- gone
- Wow moment: "Every walkthrough becomes structured, actionable intelligence. No more forgotten notes on your phone"

- Technical note (only if asked): Whisper transcription -> Claude extraction -> tasks created. Runs in the background via AI processing

---

## 6. Market Analysis -- Comps + AI Pricing (5 min)

### Live Demo: Run a market analysis

- Go to a listing's Market Analysis tab
- Click "Run Market Analysis"
- Set the search radius (0.25 to 5 miles)
- Add context: "Property has been recently renovated, focus on single-family homes"
- Hit Start Analysis
- Watch the stages: Starting -> Searching comparables -> Analyzing market data -> Saving results
- Results appear: suggested price range with confidence percentage
- Comp map with markers
- Sortable comp table with all details
- Star-toggle to confirm comps you agree with -- these flow to the overview tab

- Demo action: Confirm a comp, then switch to Overview tab to show it there
- Wow moment: "AI suggests, but the agent decides. You confirm the comps that matter"

---

## 7. Set Price and Manage the Deal (5 min)

### Tasks

### Live Demo: Create a task

- Click Add Task
- Title, priority, due date, assignee (autocomplete from team)
- Save it
- Tasks auto-sort: overdue first, then by priority (urgent -> low), then by due date
- Change its status: todo -> in progress -> done
- Check it off from the dashboard -- persists to the database

### Activity Feed
- Timeline of everything on a listing: notes, emails, messages, voice memos, system events, AI insights
- Filter by type -- message items show "SMS" label badge
- Edit or delete your own notes (hover to reveal buttons)

### Documents
- Drag-and-drop upload with category selection
- Status lifecycle: draft -> pending signature -> signed -> complete
- Preview modal for PDFs and images -- renders right in the app
- Disclosure checklist tracking required documents

### Offers
- Log offer with full details: price, financing, contingencies, close date
- Counter an offer -- pre-fills from original
- Status pipeline: received -> reviewed -> countered -> accepted -> declined
- Toggle side-by-side comparison of top offers
- AI badges: Highest Price, Fastest Close, Strongest Terms
- Demo action: Click "Compare Top Offers" to show the side-by-side table
- Wow moment: "At a glance, you see which offer wins on which criteria"

---

## 8. Client Portal -- What Your Client Sees (5 min)

### Live Demo: Open the client portal

- Switch to the portal URL
- Email verification gate -- client must verify their email to enter
- Property dashboard with hero card, milestones, timeline
- Documents shared by the agent -- organized by category, downloadable
- Approvals: pending offers and vendor quotes with approve/decline buttons
- Messages: full chat UI -- client types a message, it shows up in the agent's activity feed
- Demo action: Send a message from the portal, show it appears on the agent side
- Wow moment: "Your client has their own clean, branded experience. No more 'can you send me that document again?' emails"

### Portal Controls (Agent Side)
- 8 section toggles control what the client sees
- Toggle off offers -- switch to portal, section disappears
- Per-category document sharing: share inspection but hold back contracts
- "The agent has full control over what the client can see at any point"

---

## 9. Contacts + Buyer Preferences (3 min)

- Contact directory: search, filter by type, sort
- Contact detail: full profile, associated listings, interaction timeline
- Log interactions: message, email, note, voice memo
- Buyer preferences: beds/baths, price range, sqft, preferred areas, property types
- System uses these for buyer matching (connects back to the AI alerts)
- Demo action: Show buyer preferences on a contact, explain how the "Buyer match found" alert was generated
- Wow moment: "The system connects buyers to inventory automatically"

---

## 10. Team Collaboration (2 min)

- Workflow templates: standard task lists by listing phase
- Template task editor: add, edit, reorder tasks with drag-and-drop
- When you create a listing, these tasks auto-populate
- Team workload visibility from the dashboard
- Role-based access: admin, listing agent, TC, marketing, staging lead

### Live Demo: Search for anything

- Hit Cmd+K
- Search for a contact, a listing, a vendor
- Jump directly to what you need
- Wow moment: "Power users expect this. Everything is one keystroke away"

---

## 11. Mobile Experience (2 min)

- Resize browser to show responsive layout
- Navigation collapses, everything reflows to single-column
- Mobile header: search icon opens command palette, mic button opens capture modal
- Sidebar auto-closes when you navigate to a new page
- Pipeline switches from kanban to phase-tabbed list
- Open house tablet view: QR code for visitor check-in, live count
- Capture notes from anywhere -- same modal works on mobile
- Demo action: Show the open house QR code page
- Wow moment: "After the open house, every visitor is already in your system as a contact"

---

## 12. What's Next + Q&A (5 min)

- What's here: full pipeline, 11 tabs of depth per listing, client portal, AI intelligence, team collaboration, mobile, branding/logo upload, Google integration sync
- What's coming: MLS auto-import, DocuSign e-signatures, Stripe billing, realtime subscriptions
- Go-to-market: design partners first, freemium model, $99/mo for teams
- The big idea: "Every piece of data the agent captures gets processed by AI and turned into structured, actionable intelligence. The system gets smarter the more you use it"

### If asked about architecture (brief)
- SvelteKit 5 frontend, self-hosted Supabase on Railway, Temporal Cloud for background AI processing
- Row Level Security on every table -- multi-tenant security at the database layer
- Properties table is 70 columns, single source of truth for all property data
