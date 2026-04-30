# HomeTrack Demo Script

**Format:** 1-hour screen recording for a friend
**Tone:** Conversational, walking through what you built
**Data:** Roxy Realty seed data, real Zillow property photos

---

## Opening (2 min)

### Landing Page

Start at the root URL. HomeTrack loads in coming-soon mode by default.

> "So this is HomeTrack. The tagline is 'The operating system for modern real estate teams.' I wanted to build something that treats the listing agent like the operator they actually are — not just a salesperson, but someone managing a complex pipeline of properties, vendors, clients, documents, timelines, and money."

Walk through the landing page:

- Hero section with the value prop
- Waitlist signup form — people can drop their email to get early access
- Scroll down to the feature highlights and social proof

### Pricing Tiers

> "There are two tiers right now. Free/Starter — which is really the hook, letting solo agents get going for nothing — and then Professional at $99 a month for teams. I'm also planning a $300 tier for brokerages that need multi-team support, but that's down the road."

Show the pricing cards:

- **Free / Starter** — Solo agent, basic pipeline, limited AI
- **Professional / $99/mo** — Full team features, unlimited AI, client portal, integrations

### Sign Up and Login

> "There's a full auth flow. Sign up with email and password, log in, session management with JWT tokens, automatic refresh. Nothing fancy on the surface but it's all wired through self-hosted Supabase on Railway — GoTrue handles the auth, Kong for the API gateway."

Demo the login flow. Enter credentials, show the redirect to the dashboard.

> "Once you're in, you land on the dashboard."

---

## Dashboard Tour (5 min)

### Pipeline Stats

> "Right at the top you get the four numbers that matter: active listings, total pipeline value, average days on market, and open tasks. Each one has a delta compared to last month — green arrow up, red arrow down. You can see at a glance whether things are trending the right direction."

Hover over each stat card. Point out the trend indicators.

### Upcoming Showings

> "Next to the stats, you've got your next three showings. Date, time, which agent is coming, their company, buyer type. This is the stuff you need to know before you walk out the door."

### Pipeline Summary by Phase

> "This is the pipeline broken down by phase — pre-market, active, under contract, pending close. Each one shows the count and a visual progress bar. It's a quick gut-check: are things moving or are they stuck?"

### Team Workload Chart

> "This horizontal bar chart shows each team member's active tasks versus what they've completed this month. Really useful for a team lead — you can see who's overloaded and who has capacity."

### My Tasks

> "Down here are your tasks, split into two tabs: upcoming and overdue. Each one shows the priority badge, which listing it's tied to, and the due date. You can check things off right from here."

Click between the upcoming and overdue tabs. Toggle a task checkbox if possible.

### Recent Activity Feed

> "The activity feed shows the last six things that happened across all your listings. Notes, emails, phase changes, voice memos, AI insights — it all flows through here with timestamps and links back to the listing."

### AI Alerts and Insights

> "This is one of my favorite parts. These are AI-generated alerts. They come in four flavors — warnings in amber, anomalies in amber, connections in blue, and recommendations in blue. Each one has a title, a description, and an action link that takes you right to the thing it's flagging."

Show the different alert types. Dismiss one by clicking the X.

> "You can dismiss them and they disappear from your view. The idea is these should feel like a smart assistant tapping you on the shoulder."

### Command Palette (Cmd+K)

> "There's a command palette — hit Cmd+K and you get a search bar that lets you jump to anything. Search across listings, contacts, vendors, tasks. Quick actions too. It's the kind of thing that power users expect."

Open the command palette. Type a search query. Show the results.

### Global Search

> "The global search hits everything — listings by address, contacts by name, vendors, tasks, team members. It's all one search endpoint on the backend."

---

## Listings Pipeline (5 min)

### Kanban Board View

> "This is the heart of the app. The Kanban board. Four columns — pre-market, active, under contract, pending close. Each card shows the listing photo, price, phase, how many days it's been in this phase, and a task progress bar."

Drag a card from one column to another.

> "Watch this — I can drag a listing from pre-market to active. It hits a PATCH endpoint, updates the phase in the database, and you get a toast confirmation: 'Moved to Active.' This persists. Refresh the page and it stays."

### List View

> "If Kanban isn't your thing, there's a list view. Sortable by address, price, phase, agent, days on market. You've got search — type an address, a city, a client name, even an MLS number. Phase filter, agent filter. Every card shows the photo thumbnail, address, price, phase badge, agent avatar, and that task progress bar."

Sort by price descending. Filter by a specific phase. Search for a listing.

### Map View

> "And then there's the map view. Leaflet with OpenStreetMap tiles. Each listing is a circle marker colored by phase. Click a marker and you get a popup with the photo, address, price, phase, beds, baths, square footage. On desktop there's a sidebar panel with the listing list — click one and the map pans to it."

Click through a few markers. Show the popup details. Use the sidebar search.

### Create New Listing Wizard

> "Creating a new listing is a six-step wizard. Property details, pricing, client assignment, team assignment, pipeline phase, then a review step before you submit. There's autocomplete for client and agent selection."

Click through each step of the wizard, showing the form fields.

> "Here's the cool part — when you enter an address, properties auto-populate from Zillow data. We've got a properties table with 70 columns that acts as the single source of truth. So you type in an address and it pulls in beds, baths, square footage, lot size, year built, features, photos — all of it."

---

## Listing Detail Deep Dive (20 min)

> "Let me pick a listing and go deep. Let's use 809 Midvale — this is one of our seed listings with real Zillow data."

Click into the listing. Show the tab navigation.

> "There are eleven tabs here. Overview, Listing, Activity, Tasks, Field Notes, Documents, Financials, Marketing, Showings, Offers, Analytics. Plus Portal Settings. Let me walk through each one."

### Overview Tab

> "The overview is your at-a-glance view. Property details up top — beds, baths, square footage, lot size, all with icons. Property type, year built, MLS number. Below that is the description and features shown as toggleable badges."

Scroll through the overview.

> "Key dates: when it was listed, target list date, days in phase. Then four quick stat cards — tasks, documents, showings, offers — each one links to its tab."

#### Confirmed Comps

> "This is the confirmed comps section. These are the properties you've vetted and said 'yes, this is a real comparable.' Photo, address that links to the property detail page, sale price, beds/baths/sqft, sold date. And up top, the suggested price range with a confidence percentage from the latest AI analysis."

> "If you haven't run an analysis yet, there's a link right here to go do it."

#### Property Location Map

> "Leaflet map with a star icon pinned on the property. Read-only — just for orientation."

#### Team and Client Info

> "On the right side you've got the team — primary listing agent highlighted with avatar and role, plus up to three additional team members. Below that, the client — avatar, name, type, email, phone. If the portal is active, you'll see a 'Portal Active' badge."

### Listing Tab — Market Analysis

> "Now this is where the AI starts. The Listing tab is all about market analysis and pricing."

#### Running an Analysis

> "There's a text area where you can give the AI guidance before you run the analysis. Something like 'Focus on homes sold in the last 90 days within half a mile' or 'This property has a new roof and updated kitchen, weight that heavily.' Then you hit Run Analysis."

Type a prompt into the guidance field.

> "Watch what happens when I click this."

Click Run Analysis.

> "See the polling UI? It goes through stages: 'Starting analysis...' then 'Searching for comparables...' then 'Analyzing market data...' then 'Saving results.' Under the hood, this is a Temporal workflow. SvelteKit sends a POST to the market analysis API, which kicks off a workflow on Temporal Cloud. A Python worker picks it up, hits the Realty API to pull comparable sales data, then sends everything to Claude for analysis. The UI polls until it's done."

Wait for the analysis to complete.

> "And there it is. The AI pricing suggestion — a green badge showing the suggested range with a confidence percentage. If you haven't set a listing price yet, it auto-fills the midpoint as a starting point."

#### Comp Map

> "Below the suggestion, there's a comp map. You can adjust the radius to see comps closer or farther out. Each comp shows up as a pin."

#### Comparable Sales Table

> "And the comp table. Every comparable the AI found, with the address, sale price, beds, baths, square footage, sold date. You can sort these columns. The similarity is highlighted — how close each comp is to your property."

#### Confirming Comps

> "See the star toggle on each comp? Click it and you're marking that comp as 'confirmed.' These confirmed comps flow back up to the overview tab. This is the agent saying 'I agree with the AI on this one' or choosing to dismiss ones that don't apply."

Toggle a star on a comp.

#### Setting the Listing Price

> "Once you've reviewed the comps and the AI suggestion, you can set your listing price. Click this button, enter your number — maybe you go a little above the AI midpoint because you know the neighborhood — and save it."

### Activity Tab

> "The activity tab is the timeline of everything that's happened on this listing. Notes, emails, messages, voice memos, system events, AI insights — it all shows up here with icons, timestamps in relative format, author names, and content."

#### Posting Notes

> "You can post a note right from here. Type something in the compose field and submit. It shows up in the feed immediately."

Type and submit a note.

#### Filtering

> "Filter buttons across the top let you narrow down: All, Messages, Emails, Notes, Voice Memos, System, Insights. Useful when you're looking for something specific."

Click through a few filters.

### Tasks Tab

> "Tasks are exactly what you'd expect, but well-executed. Full CRUD — create, read, update, delete."

#### Creating a Task

> "Click Add Task. You get a modal with title, priority level, due date, assignee — with autocomplete from your team members — and which phase this task belongs to."

Create a task.

#### Editing and Managing

> "Click into any task to edit it. Change the title, reassign it, update the priority, move the due date. The status dropdown lets you move it through: to-do, in progress, in review, done."

Edit a task. Change its status.

#### Deleting

> "Delete pops a confirmation modal. No accidental deletions."

Delete a task.

### Field Notes Tab

> "Okay, this is the other big AI feature. Field Notes is the umbrella concept — it covers voice memos, video recordings, text notes, and photos. The idea is that an agent is out in the field, walking through a property, and they need to capture everything without slowing down."

#### Recording a Voice Memo

> "Let me show you the recording flow. You tap Record and it uses the MediaRecorder API to capture audio right in the browser. You get a live timer, playback controls when you stop, and then you hit Upload."

Show the recording UI. Record a short memo.

> "What happens next is the magic. The audio file goes to Supabase Storage, and then a Temporal workflow kicks off. Here's the pipeline:"

> "Stage one: Whisper transcription. The audio gets sent to OpenAI's Whisper model and comes back as text. Stage two: Claude extraction. The transcript goes to Claude, which pulls out action items, key observations, decisions, and anything else that's actionable. Stage three: the results get saved back and the UI updates."

#### Processing Status

> "While all that's happening, you see status badges. Pending, processing, completed, or failed. The UI polls until it's done."

Show the status indicators.

#### Detail View

> "Click into a completed field note and you get the full view. The audio or video player at the top. The complete transcript with timestamps you can jump to. And then the extracted intelligence — action items, observations, decisions."

Open a field note detail.

> "Each action item has a priority badge and a category. And here's the key part — Accept and Dismiss buttons. Hit Accept and it creates a real task on this listing. Hit Dismiss and it goes away. The AI suggests, but the agent decides."

Accept an action item. Dismiss another.

> "This is the line I keep coming back to: every walkthrough becomes actionable intelligence. You're not taking notes on your phone and forgetting about them. The system captures it, transcribes it, extracts the important stuff, and turns it into tasks."

### Documents Tab

> "Documents is straightforward but complete. Drag and drop or use the file picker to upload. Choose a category — disclosures, inspection, title, contracts, marketing, photos, or other."

Upload a document.

> "Each document has a status lifecycle: draft, pending signature, signed, complete, expired. You can change the status with a dropdown. Download pulls a signed URL from Supabase Storage."

Change a document's status. Download one.

> "You can filter by category with the tabs across the top."

### Financials Tab

> "Financials lets you manage the budget for a listing. Create a budget, set the total amount, then add categories — staging, photography, repairs, marketing, whatever."

Create a budget and add a category.

> "For each category, you enter the budgeted amount and then update the actual spend as invoices come in. There's a doughnut chart for the category breakdown and a bar chart comparing budgeted versus actual. All Chart.js with custom styling that matches the design system."

Show the charts.

### Marketing Tab

> "Marketing assets — create them with a type (photo, video, brochure, social post), give it a name, set the status, add a URL and platform. Status flows from scheduled to published to archived."

Create a marketing asset. Change its status.

### Showings Tab

> "Schedule a showing with the date, time, agent name, company, and buyer type. Edit or cancel any showing."

Schedule a showing.

#### Showing Feedback

> "After a showing, you can add feedback — a 1-to-5 star rating, interest level (very interested, somewhat, not interested), and notes. This data feeds the analytics."

Add feedback to a showing.

#### Showing Analytics

> "The analytics section has a funnel chart showing interest levels across all showings, and a time series chart tracking showings and open house attendance over time."

Show the charts.

### Offers Tab

> "Log an offer with all the details: buyer name, buyer agent, price, earnest deposit, financing type, contingencies, target close date, notes."

Log an offer.

> "Offers have a status flow — received, reviewed, countered, accepted, declined. You can counter an offer, which pre-fills from the original and lets you modify the price, earnest money, and close date."

Counter an offer.

> "Edit and delete are there too, with confirmation modals."

### Analytics Tab

> "Per-listing analytics. Views over time as a line chart broken down by platform — Zillow, Redfin, Realtor.com. A traffic source doughnut chart. And a showings bar chart."

Show the analytics charts.

### Portal Settings

> "This is where you control what the client sees. Eight section toggles: overview, timeline, documents, photos, showings, analytics, offers, messages. Each one has an icon and a description of what it controls."

Toggle a few sections.

> "Below that, document sharing controls — per-category toggles for disclosures, inspection, title, contracts, marketing, photos. So you can share the inspection report but hold back the contracts until they're ready."

> "Client notifications for email and SMS. And a button to send the portal link to the client."

---

## Client Portal (5 min)

> "Now let me show you what the client actually sees. This is a separate experience — clean, minimal, focused on what matters to the homeowner."

Open the portal URL.

### Property Dashboard

> "The client lands on their property dashboard. Hero card with the listing photo, address, phase badge, price, beds/baths/sqft. Below that, milestones — Photography, MLS Listing, Open House, First Offers — each with a status and detail text."

> "There's a property timeline showing the progression of the listing."

### Approvals

> "This is great for the client experience. Pending offers show up here with approve and decline buttons. Same for vendor quotes. The client can expand each item to see the details before making a decision."

Show the approval cards. Expand one.

### Documents

> "Documents the agent has shared appear here, organized by category with status badges. The client can download anything that's been shared with them. Status indicators show whether something is draft, pending signature, signed, or complete."

Show the document list. Download one.

### Portal Visibility

> "Now watch this — go back to the agent side and toggle off, say, the offers section in portal settings."

Toggle a section off.

> "Switch back to the portal and that section is gone. The agent has full control over what the client can see at any point in the process."

---

## Contacts and Vendors (5 min)

### Contacts

> "Contacts page. Search by name or email. Filter by type — clients, agents, vendors, lenders, inspectors. Sort by name, last interaction, or type."

Search for a contact. Apply a filter.

> "Create a contact with name, email, phone, type, and company. Edit adds a notes field. Delete has a confirmation modal."

Create a contact.

#### Contact Detail

> "Click into a contact and you get the full profile. All their info, associated listings — every listing where they're the client, agent, or involved party. And a contact activity log."

Open a contact detail.

> "You can log interactions — choose the type (message, email, call, meeting), add content, and submit. It builds a history of every touchpoint."

Log an interaction.

### Vendors

> "Vendors get their own directory. Search by name, filter by category — contractors, stagers, photographers, inspectors, landscapers, painters. Sort by rating, reliability, cost, or number of projects."

Filter vendors by category. Sort by rating.

> "Create a vendor with name, company, email, phone, category, and specialties. Full CRUD like contacts."

> "The vendor detail page shows their profile, quote history, and cost charts over time. You can request quotes and approve or decline them."

Open a vendor detail.

---

## Settings (5 min)

### Team Management

> "Team management. Invite a new member with their email, name, and role. The roles are well-defined: admin, listing agent, transaction coordinator, marketing, staging lead. Each role has a description so you know what you're assigning."

Open the invite modal. Show the role descriptions.

> "Remove a member with a confirmation modal. Clean and safe."

### Workflow Templates

> "Workflow templates let you define the standard task list for different listing types. Pre-market checklist, active listing tasks, closing tasks. You can create, edit, and reorder the template tasks. When you start a new listing, these tasks auto-populate."

Show the template editor.

### Branding

> "Branding settings. Set your primary color — right now it's this warm terracotta that runs through the whole app. Custom domain preview shows what your portal URL would look like: clientname.yourbrand.com."

Show the branding page. Change the primary color to preview.

### Notification Preferences

> "Toggle which notifications you want — email, in-app, SMS. Granular control over what triggers an alert."

### Integrations

> "Google OAuth is wired up. Connect your Google account for calendar sync and email integration. The OAuth flow goes through our API endpoints."

Show the Google connect button.

### Billing

> "Billing is the plan comparison page. Shows the tier breakdown. Stripe integration is coming soon — right now it's informational."

---

## Mobile Experience (3 min)

> "Let me resize the browser to show the mobile experience. The whole app is responsive."

Resize to mobile width.

> "Navigation collapses to a tab dropdown. Everything reflows to single-column. The listing pipeline switches from Kanban to a phase-tabbed list view."

Show the mobile listing view.

### Mobile Voice Memo

> "The mobile voice memo page is purpose-built for the field. Select a listing from the autocomplete, hit record, and you're capturing audio through the MediaRecorder API. Timer runs, you stop, you can play it back, then upload. It goes straight to Supabase Storage and kicks off the Temporal transcription pipeline."

Show the mobile voice memo page.

### Mobile Field Notes

> "Field notes on mobile — text input with tags, plus drag-and-drop for photos and video attachments. Upload goes to Supabase Storage and triggers the AI processing pipeline."

Show the mobile field notes page.

### Open House Tablet View

> "This is designed for a tablet sitting on the front table at an open house. Big QR code for visitors to scan and check in. Live visitor count that polls the backend. The registration page is clean and simple — name, email, phone, and they're checked in."

Show the open house page. Show the QR code.

> "The agent gets a real-time count of how many people have checked in. After the open house, all those contacts are in the system."

---

## Intelligence Pipeline (5 min)

> "Let me take a step back and explain the architecture, because this is what makes HomeTrack more than just a pretty CRUD app."

> "The frontend is SvelteKit 5 — server-side rendered, form actions, the whole modern stack. The database is PostgreSQL on self-hosted Supabase, running on Railway. Every query goes through Row Level Security — there's a withRLS wrapper that scopes every database call to the current user and their organization. Multi-tenant security at the database layer."

> "But the interesting part is the intelligence pipeline. There's a Temporal Cloud instance with Python workers. Two main workflows right now."

### ProcessFieldMedia Workflow

> "First: ProcessFieldMedia. This handles voice memos, video recordings, and text notes. For video, it's a nine-stage pipeline — upload, frame extraction, audio extraction, Whisper transcription, key moment identification, frame-moment correlation, enriched transcript generation, insight extraction, and final assembly. For voice, it's simpler — Whisper transcription, then Claude extraction for action items and observations."

### MarketAnalysis Workflow

> "Second: MarketAnalysis. This one hits the Realty API to pull comparable sales data for a given property and radius. Then it sends everything to Claude — the subject property details, the comp data, and any user guidance — and Claude comes back with a pricing suggestion, confidence score, and detailed analysis."

> "The properties table is the single source of truth. Seventy columns. When a comp comes in from the API, it gets upserted into the properties table. When you look at a comp on a listing, you're looking at a real property record, not a throwaway data point. That's why comp addresses link to full property detail pages."

### What Makes It Special

> "The key insight is that every piece of data the agent captures — a voice memo from a walkthrough, a video of a property condition, notes from a showing — gets processed by AI and turned into structured, actionable intelligence. Tasks get created. Pricing gets informed. The system gets smarter the more you use it."

---

## Landing Page and Launch Gate (2 min)

> "One more thing on the infrastructure side. The app has a launch gate."

### Coming Soon Mode

> "At the root level, there's a check: if the launch mode is set to coming_soon, visitors see the landing page with the waitlist form. They can't get into the app."

### Preview Access

> "But there's a preview access key. Enter it and a localStorage flag gets set that lets you through to the full app. This is how I can share it with design partners before launch without opening it to everyone."

### Switching to Live

> "When it's time to launch, flip the mode and the landing page goes away — everyone hits the login screen directly."

---

## Design System (1 min)

> "Before I wrap up, I want to call out the design system because it's intentional. The primary color is this warm terracotta — not the cold blue that every other SaaS uses. Serif headings for a premium, editorial feel. The whole palette is warm and grounded. Rounded corners, generous spacing, real photography. It should feel like a luxury tool, not a spreadsheet."

> "The component library is SvelteUI under the hood, customized to match. Consistent badges, modals, toasts, form inputs across the whole app."

---

## Wrap Up (3 min)

> "So that's HomeTrack. To recap what's here: a full listing pipeline with Kanban, list, and map views. Eleven tabs of depth on every listing — overview, market analysis, activity, tasks, field notes, documents, financials, marketing, showings, offers, and analytics. A client portal with approvals and document sharing. Contacts and vendor management. Team settings, branding, workflow templates. Mobile-native pages for voice memos, field notes, and open house check-in. And two AI pipelines — market analysis with pricing intelligence, and field media processing that turns walkthroughs into action items."

### What's Next

> "What's not here yet: MLS integration for auto-importing listings, DocuSign for e-signatures on documents, and Stripe billing for the paid tiers. Those are the three big ones before launch."

### Go-to-Market

> "The approach is design partners first. Get three to five agents using it daily, collect feedback, iterate. The pricing strategy is freemium — get solo agents hooked on the free tier, then convert teams to the $99 plan when they need collaboration and AI features."

> "That's the full tour. An hour of every feature in HomeTrack. Thanks for watching."

---

## Quick Reference: AI Touchpoints

For easy scanning, here are the five places AI shows up in the product:

1. **Market Analysis** — Claude analyzes comparable sales data from Realty API, generates a pricing suggestion with a confidence score, and provides detailed analysis narrative. User can guide the AI with a custom prompt before running.

2. **Field Notes Pipeline** — Voice memos and video recordings go through Whisper transcription, then Claude extraction to pull out action items, key observations, decisions, and follow-ups. Each extracted item can be accepted (creates a task) or dismissed.

3. **AI Insights on Dashboard** — Automated alerts for anomalies (price drops, DOM spikes), connections (related contacts or listings), and recommendations (pricing adjustments, next steps). Dismissable by the agent.

4. **Smart Prompting** — Before running a market analysis, the agent can write natural language guidance: "focus on recent sales," "this property has a renovated kitchen," "ignore the foreclosure on Oak Street." The AI incorporates this context.

5. **Properties as Single Source of Truth** — Every comp the AI surfaces links to a real property record with 70 columns of data, photos, and a detail page. Comps are not throwaway data points; they are first-class entities in the system.
