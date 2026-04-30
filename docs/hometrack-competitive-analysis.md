# HOMETRACK — Competitive Feature & Integration Analysis
### April 2026

---

## 1. Competitive Feature Matrix

The following maps HomeTrack's planned feature set against the tools Bay Area boutique teams currently stitch together. Each row represents a capability area; each column represents a competing product or category.

### 1.1 CRM & Contact Management

| Capability | HomeTrack (Planned) | Follow Up Boss | kvCORE / BoldTrail | LionDesk |
|---|---|---|---|---|
| Contact database | ✅ | ✅ | ✅ | ✅ |
| Relationship history across listings | ✅ | ❌ (per-lead only) | ❌ | ❌ |
| Agent network graph | ✅ | ❌ | ❌ | ❌ |
| AI connection surfacing | ✅ | ❌ | ❌ | ❌ |
| Speed-to-lead automation | Planned (future) | **✅ Best-in-class** | ✅ | ✅ |
| 250+ lead source integrations | Planned (future) | **✅** | ✅ | Partial |
| Smart lead routing/distribution | Planned (future) | **✅** | ✅ | Basic |
| Built-in dialer + call recording | ❌ | **✅** | ✅ | ✅ |
| Email/text drip campaigns | Planned (future) | ✅ | ✅ | ✅ |
| Contact tagging & segmentation | ✅ | ✅ | ✅ | ✅ |

**Key takeaway:** Follow Up Boss's speed-to-lead engine and lead source integrations are best-in-class. HomeTrack will integrate with FUB at launch as a "post-conversion destination" — when a lead becomes a client in FUB, the client flows into HomeTrack for listing management. Longer term, HomeTrack intends to build its own lead gen and tracking capabilities to offer a complete alternative, but integration-first is the correct launch strategy.

**Note on Zillow/FUB data risk:** Zillow's acquisition of Follow Up Boss has raised industry concerns about data access policies. If Zillow restricts FUB's open API or leverages CRM data competitively, HomeTrack's own contact management and communication hub serve as a natural fallback — and the disruption could accelerate adoption as teams seek Zillow-independent tooling.

### 1.2 Transaction & Document Management

| Capability | HomeTrack (Planned) | SkySlope | Dotloop | Brokermint |
|---|---|---|---|---|
| Document store per listing | ✅ | ✅ | ✅ | ✅ |
| E-signature integration | ✅ (DocuSign) | ✅ DigiSign (native) | ✅ Native | ❌ |
| **AI document extraction (ETL)** | **✅ Claude-powered** | ✅ Smart Scan | ❌ | ❌ |
| **AI disclosure parsing (CA-specific)** | **✅ Planned** | ✅ Breeze | Partial | ❌ |
| Voice-powered field capture | **✅ Voice + Video** | ✅ Voice Offers | ❌ | ❌ |
| Compliance checklists | ✅ | ✅ | ✅ | ✅ |
| Offer management & comparison | ✅ | ✅ SkySlope Offers | ❌ | ❌ |
| Audit trail / compliance logging | ✅ | ✅ | ✅ | ✅ |
| TC workflow tools | ✅ | ✅ SkyTC | Partial | ✅ |

**Key takeaway:** SkySlope's Smart Scan (AI contract data extraction) is the closest competitor feature to what HomeTrack plans. HomeTrack's approach goes further: a full ETL pipeline that ingests PDFs, scanned documents, and spreadsheets, extracting structured data via Claude and feeding it into a per-listing knowledge graph. This includes California-specific disclosure parsing (TDS, SPQ, NHD) — extracting completion status and flagging gaps automatically.

HomeTrack's voice and video capture also goes beyond SkySlope's voice-to-contract tool. Agents can record video walkthroughs of properties, with the system extracting room-by-room observations, improvement opportunities, and action items from the combined audio transcript and video frames. This feeds directly into the listing's project plan and can auto-generate improvement scopes of work.

### 1.3 Project & Listing Management

| Capability | HomeTrack (Planned) | Asana / Monday | Compass Platform | Generic CRM |
|---|---|---|---|---|
| Listing-as-project paradigm | **✅ Core differentiator** | ❌ (generic projects) | Partial | ❌ |
| Phase-based pipeline | ✅ | ✅ (not RE-specific) | Partial | ❌ |
| Phase transition gates | ✅ | ✅ | ❌ | ❌ |
| Task templates by phase | ✅ | ✅ | ❌ | ❌ |
| Task dependencies | ✅ | ✅ | ❌ | ❌ |
| Team workload / capacity view | ✅ | ✅ | ❌ | ❌ |
| MLS/IDX data integration | ✅ | ❌ | ✅ (captive) | ❌ |
| Listing performance dashboards | ✅ | ❌ | ✅ (captive) | ❌ |

**Key takeaway:** No competitor treats the listing as a project with this depth. Compass has elements but they're captive to Compass brokerage agents. HomeTrack's white-label approach gives independent teams Compass-caliber tooling without brokerage lock-in. We are comfortable lifting ideas from Compass One's design where appropriate.

### 1.4 Client Portal & Communication

| Capability | HomeTrack (Planned) | Compass One | Custom Builds | Follow Up Boss |
|---|---|---|---|---|
| Client-facing progress dashboard | ✅ (Professional) | ✅ | Varies | ❌ |
| In-portal approvals (quotes, offers) | ✅ (Professional) | Partial | Varies | ❌ |
| Threaded messaging (no app install) | ✅ (Professional) | ✅ | ❌ | ❌ |
| SMS/push notification alerts | ✅ | ✅ | ❌ | ❌ |
| Photo/video gallery | ✅ | ✅ | Varies | ❌ |
| Magic link login (no password) | ✅ | ✅ | ❌ | ❌ |
| White-label branding | ✅ (Professional) | ❌ (Compass-branded) | ✅ | ❌ |
| Open house QR code check-in | **✅** | ❌ | ❌ | ❌ |
| Tablet-based digital sign-in | **✅** | ❌ | ❌ | ❌ |
| Scheduled update posts | ✅ | ❌ | ❌ | ❌ |

**Key takeaway:** The client portal is a Professional-tier differentiator. It's one of the strongest reasons for teams to upgrade from Starter. Compass One is the design benchmark. HomeTrack adds white-labeling, vendor quote approvals, and open house check-in (QR code scan → email capture → contact graph) that Compass doesn't offer.

### 1.5 Vendor & Financial Management

| Capability | HomeTrack (Planned) | QuickBooks | Brokermint | Spreadsheets |
|---|---|---|---|---|
| Per-listing P&L | **✅ Unique** | ❌ | Partial | Manual |
| Vendor directory with ratings | ✅ | ❌ | ❌ | Manual |
| Quote comparison workflow | ✅ | ❌ | ❌ | ❌ |
| Client-facing cost approval (via portal) | **✅ Unique** | ❌ | ❌ | ❌ |
| Invoice capture per listing | ✅ | ✅ | ✅ | Manual |
| ROI analysis on improvements | **✅ Unique** | ❌ | ❌ | ❌ |
| QuickBooks/Xero integration | ✅ | N/A | ✅ | Manual |

**Key takeaway:** This is HomeTrack's second major differentiator. No one does per-listing vendor/financial management with client-facing approvals. HomeTrack is a project management tool that includes quotes and financials — not a financial tool. The QuickBooks integration handles the bookkeeping handoff.

**Legal note (California):** Real estate agents who coordinate pre-listing improvements operate in an advisory/facilitative capacity — they recommend vendors, help clients obtain quotes, and coordinate scheduling. They are not licensed contractors and cannot contract for work in their own name. HomeTrack's quote approval workflow reinforces this legal boundary: the agent manages the process in HomeTrack, but the client authorizes the spend and signs contracts with vendors directly via the client portal. This is standard industry practice but worth confirming with a California real estate attorney during product development.

### 1.6 Analytics & Intelligence

| Capability | HomeTrack (Planned) | Compass AI | kvCORE | SkySlope |
|---|---|---|---|---|
| Comp analysis with AI narratives | ✅ | ✅ (captive) | Basic | ❌ |
| Listing performance dashboards | ✅ | ✅ (captive) | ✅ | ❌ |
| Team performance analytics | ✅ | Partial | ✅ | ✅ SkySights |
| AI pricing recommendations | ✅ | ✅ (captive) | ❌ | ❌ |
| AI action item extraction | **✅ From all channels** | ❌ | ❌ | ❌ |
| Interest decay detection | **✅** | ❌ | ❌ | ❌ |

**Key takeaway:** HomeTrack leans into analytics over AI coaching. The focus is on making teams more competitive through data — showing patterns in their own performance, market positioning, and listing trajectory — rather than prescriptive coaching suggestions.

---

## 2. Integration Priority Map

### Tier 1 — Launch (Day 1)

| Integration | Why | Method |
|---|---|---|
| Google Workspace (Gmail, Calendar, Drive) | Universal; email sync and calendar are table stakes | Direct API (OAuth) |
| DocuSign | E-signature standard; most teams have accounts | Direct API |
| Follow Up Boss | Top CRM for boutique teams; "converted lead → listing" flow | FUB Open API |

### Tier 2 — Early Growth (Months 3–6)

| Integration | Why | Method |
|---|---|---|
| MLS/IDX feeds (Bridge Interactive/Spark) | Comp analysis, listing data, market intelligence | RESO Web API |
| Zillow/Redfin/Realtor.com (view/save data) | Listing performance dashboards | Public APIs |
| Microsoft 365 (Outlook, Calendar) | Parity with Google for Outlook teams | Direct API |
| QuickBooks Online | Financial data export for bookkeeping | Direct API |
| Calendar integrations (Calendly, etc.) | Showing and appointment scheduling | API / webhook |

### Tier 3 — Scaling (Months 6–12)

| Integration | Why | Method |
|---|---|---|
| Dotloop / SkySlope | Transaction management handoff for teams keeping existing TM | API |
| Twilio | SMS ingestion and two-way messaging | Direct API |
| Social media (FB, IG, LinkedIn) | Posting and basic analytics | APIs |
| Slack | Internal team communication for tech-forward teams | API |

### Tier 4 — Future

| Integration | Why | Method |
|---|---|---|
| Open API + Webhooks | Custom integrations for power users | Build |
| Xero | Alternative to QuickBooks | API |
| Zapier / Make | Catch-all for long-tail integrations | API |
| kvCORE / BoldTrail | Broader CRM compatibility | API |

---

## 3. What Teams Actually Spend Today

A typical 6-person Bay Area boutique listing team's current monthly tech spend:

| Tool | Monthly Cost | What They Use It For |
|---|---|---|
| Follow Up Boss (Pro, 10 users) | $416/mo | CRM, lead routing, drip campaigns |
| SkySlope or Dotloop (6 agents) | $120–$180/mo | Transaction management, e-signatures |
| Google Workspace (6 users) | $72/mo | Email, calendar, document storage |
| Canva Pro (1–2 seats) | $25/mo | Marketing materials, social graphics |
| DocuSign (1 account) | $25–$45/mo | E-signatures |
| QuickBooks Simple Start | $30/mo | Basic bookkeeping |
| Spreadsheets / Airtable | $0–$20/mo | Vendor tracking, budget tracking, task lists |
| **Total** | **$688–$788/mo** | |

Plus hidden costs: 5–10 hours/week of coordination overhead, consulting fees for custom workflows, and the occasional vendor invoice that falls through the cracks.

**HomeTrack at $99/seat Starter × 5 seats = $495/mo** replaces SkySlope/Dotloop, spreadsheets, and Airtable — and adds listing project management, vendor management, and AI features that none of the replaced tools provided. (Starter supports teams up to 5 users with 15 active listings.)

**HomeTrack at $300/seat Professional × 6 seats = $1,800/mo** replaces the entire stack except FUB and Google (which integrate), adds the full client portal, and eliminates the coordination overhead. At $1,800/mo this is more than the fragmented stack, but it includes capabilities (client portal with approvals, per-listing P&L, AI document extraction, voice/video capture) that teams currently either pay consultants for or simply don't have.

---

*This analysis should be revisited quarterly as competitors ship new features and pricing changes.*
