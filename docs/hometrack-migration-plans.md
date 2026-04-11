# HOMETRACK — Competitor Migration Plans
### Data Migration & Onboarding Playbooks
#### April 2026

---

## 1. Migration Philosophy

Every HomeTrack onboarding should feel effortless. Teams switching from fragmented tool stacks are already frustrated with operational friction — the migration process cannot add more. The goal is to get a team operational in HomeTrack within a single working session (2–4 hours), with their historical data, active listings, and contacts imported and organized.

Two migration paths are supported:

- **API-based migration:** For competitors with open APIs, an automated agent pulls data directly from the source system using the team's credentials (OAuth where available, API key where not).
- **Data dump migration:** For competitors without APIs or where API access is limited, teams export their data (CSV, PDF, document archives) and HomeTrack's ETL pipeline ingests, parses, and structures it.

Both paths feed into the same ETL pipeline: ingest → parse/extract → map to HomeTrack schema → validate → import.

---

## 2. Migration Playbooks by Competitor

### 2.1 Follow Up Boss (CRM)

**API availability:** Open REST API with full read access. OAuth-based authentication. Well-documented.

**What to migrate:**
- Contacts (clients, leads, agents, vendors)
- Communication history (emails, texts, call logs, notes)
- Tags and smart lists
- Deal/pipeline data
- Custom fields

**Migration method:** API-based (preferred)
1. Team authorizes HomeTrack via FUB OAuth
2. Agent pulls all contacts with full history via `/v1/people` endpoint
3. Deals pulled via `/v1/deals` — mapped to HomeTrack listings where addresses match
4. Communication threads pulled and associated to contacts
5. Tags mapped to HomeTrack contact segments
6. Custom fields mapped or created in HomeTrack

**Data dump fallback:** FUB supports full CSV export of contacts and deals. Team exports from FUB Settings → Data Export. HomeTrack ingests CSV and maps columns.

**What doesn't migrate (and that's okay):**
- Active drip campaigns / action plans (FUB-specific automation)
- Lead source integrations (teams keep FUB for lead capture)
- Dialer call recordings (reference only; link back to FUB)

**Timeline:** ~30 minutes for API migration of a typical team (500–2,000 contacts).

---

### 2.2 SkySlope (Transaction Management)

**API availability:** Limited. SkySlope has an API but access is restricted to brokerage-level integrations. Individual team access is inconsistent.

**What to migrate:**
- Transaction records (property address, parties, dates, status)
- Document archives (contracts, disclosures, inspection reports)
- Checklist/compliance status per transaction
- Agent and contact information

**Migration method:** Data dump (primary), with API where available
1. Team exports transaction data from SkySlope's reporting interface (CSV)
2. Team downloads document archives per transaction (ZIP/PDF bundles)
3. HomeTrack ETL pipeline:
   - CSV parser maps transaction fields to HomeTrack listing schema
   - Document ingestion pipeline processes PDFs:
     - OCR for scanned documents
     - Claude-powered extraction of key terms (price, dates, contingencies, parties)
     - Auto-categorization (disclosure, contract, inspection, marketing)
   - Documents filed to the correct listing's document store

**What doesn't migrate:**
- DigiSign signature workflows (in-progress signatures stay in SkySlope)
- SkySlope Forms templates (team rebuilds task templates in HomeTrack)
- Audit trail (stays in SkySlope for compliance record)

**Timeline:** ~1–2 hours depending on document volume. Document processing runs async after initial setup.

---

### 2.3 Dotloop (Transaction Management)

**API availability:** Dotloop has a REST API (now under Zillow). OAuth-based. Provides access to loops (transactions), documents, participants, and activity.

**What to migrate:**
- Loops (transactions) with all metadata
- Documents within loops
- Participant info (buyers, sellers, agents, TCs)
- Activity/status history
- E-signature records (completed, as PDFs)

**Migration method:** API-based (preferred)
1. Team authorizes HomeTrack via Dotloop OAuth
2. Agent pulls all loops via `/v2/loop-it` endpoints
3. Each loop mapped to a HomeTrack listing (matched by property address)
4. Documents downloaded via API and filed to listing document store
5. Participants mapped to HomeTrack contacts
6. Loop status mapped to HomeTrack listing phase

**Data dump fallback:** Dotloop allows bulk PDF download of completed loops. HomeTrack document ingestion pipeline processes these.

**Timeline:** ~45 minutes for API migration. Document processing runs async.

---

### 2.4 kvCORE / BoldTrail (All-in-One Platform)

**API availability:** kvCORE has an API but access is heavily restricted and typically requires brokerage-level approval. Most teams cannot get direct API access.

**What to migrate:**
- Contacts and lead database
- Transaction records
- Communication history (where accessible)
- Property/listing data
- Website content (if applicable)

**Migration method:** Data dump (primary)
1. Team exports contacts via kvCORE's CRM export (CSV)
2. Team exports transaction data (CSV)
3. Team downloads any documents stored in kvCORE
4. HomeTrack ETL pipeline processes exports
5. Contacts parsed and mapped; duplicates flagged for review
6. Transaction data mapped to HomeTrack listings

**Challenges:** kvCORE's export formats can be messy — inconsistent field naming, merged cells, non-standard date formats. The ETL pipeline includes a kvCORE-specific parser that handles common format issues.

**What doesn't migrate:**
- IDX website (teams need to set up a new website or use a standalone provider)
- Lead generation campaigns and PPC settings
- kvCORE-specific automations and smart campaigns

**Timeline:** ~1 hour for data processing. Manual review recommended for contact deduplication.

---

### 2.5 Spreadsheet / Ad-Hoc Tool Stacks

Many boutique teams don't use any formal platform — they run on Google Sheets, Airtable, text threads, and email. This is actually the most common migration scenario.

**What to migrate:**
- Google Sheets / Excel files (listing trackers, vendor lists, budget spreadsheets, task lists)
- Google Drive / Dropbox document folders
- Contact lists (often in phone contacts or email)

**Migration method:** File upload + AI extraction
1. Team uploads their spreadsheets and document folders to HomeTrack
2. Claude-powered parser analyzes spreadsheet structure:
   - Identifies listing data, contact data, vendor data, financial data
   - Maps columns to HomeTrack fields with confidence scoring
   - Presents mapping to team for confirmation before import
3. Document folders processed by ingestion pipeline:
   - PDFs parsed and categorized
   - Photos tagged by property (EXIF data + filename patterns)
4. Contact import from CSV (exported from phone/email)

**This is where HomeTrack's value proposition is most dramatic.** Teams going from spreadsheets to HomeTrack experience the biggest operational lift. Migration is also the simplest since there are no system-specific constraints.

**Timeline:** ~30–60 minutes depending on spreadsheet complexity.

---

## 3. ETL Pipeline Architecture

All migration paths feed into a common pipeline:

```
Source Data (API / CSV / PDF / Images)
    ↓
[Ingest Layer]
    - API connectors (FUB, Dotloop)
    - File upload handler (CSV, XLSX, PDF, ZIP, images)
    - Format normalization
    ↓
[Parse & Extract Layer]
    - CSV/XLSX column mapping (with AI-suggested mappings)
    - PDF processing: OCR → text extraction → Claude structured extraction
    - Image processing: EXIF parsing, property association
    - Contact deduplication engine
    ↓
[Schema Mapping Layer]
    - Map source fields → HomeTrack data model
    - Validate required fields
    - Flag conflicts and ambiguities for human review
    ↓
[Import Layer]
    - Create/update listings, contacts, documents, vendors, financials
    - Maintain source references (original IDs) for audit trail
    - Generate migration report for team review
```

The pipeline is designed to be **additive and non-destructive** — it never deletes source data, always creates new records in HomeTrack, and maintains references back to the source system for audit purposes.

---

## 4. Document Ingestion & Knowledge Graph

A key differentiator in HomeTrack's migration approach is that documents aren't just stored — they're **parsed and understood**. When a PDF is uploaded (whether during migration or ongoing use):

1. **OCR** (for scanned documents): Tesseract or cloud OCR for text extraction
2. **Structured extraction** (Claude API): Key terms, dates, amounts, parties, contingencies extracted into structured fields
3. **Classification**: Document auto-categorized (disclosure, contract, inspection report, marketing asset, invoice, etc.)
4. **Knowledge graph integration**: Extracted entities (people, properties, amounts, dates) linked to the listing's knowledge graph, making them searchable and cross-referenceable
5. **Disclosure-specific parsing**: California disclosure forms (TDS, SPQ, NHD) parsed into structured checklists with completion status tracking

This same pipeline handles:
- Contract uploads during active transactions
- Historical disclosure PDFs clients bring from prior transactions
- Invoice and quote documents from vendors
- Inspection reports

---

## 5. Voice & Video Ingestion

HomeTrack's field capture tools extend the ETL philosophy to real-time, unstructured inputs:

### Voice Memos
- Agent records voice memo in the field (mobile app or web)
- Audio transcribed (Whisper or equivalent)
- Claude processes transcript to extract:
  - Action items and to-dos
  - Mentioned contacts, properties, or vendors
  - Decisions or commitments made
  - Follow-up deadlines
- Extracted items auto-linked to the relevant listing
- Full transcript + extracted items appear in the listing's activity feed

### Video Walkthroughs
- Agent records video walking through a property (pre-listing walkthrough, staging review, improvement assessment)
- Processing pipeline:
  - Audio track transcribed and processed (same as voice memo)
  - Key frames extracted at intervals + on scene changes
  - Claude analyzes frames with transcription overlay:
    - Room/area identification
    - Condition notes and improvement opportunities
    - Items requiring attention (damage, maintenance, staging opportunities)
  - Timestamped annotations generated
- Output: structured walkthrough report with annotated frames, linked to listing
- Downstream uses: auto-generate improvement scope of work, share annotated walkthrough with vendors, create client-facing property assessment

---

## 6. Migration Onboarding Flow (User Experience)

The in-app migration experience follows this flow:

1. **Welcome → "Where are you coming from?"**
   - Options: Follow Up Boss, SkySlope, Dotloop, kvCORE, Spreadsheets, Other, Starting Fresh

2. **Connect or Upload**
   - API-based: OAuth authorization flow
   - File-based: Drag-and-drop upload zone for CSVs, spreadsheets, document folders, PDFs

3. **Review Mapping**
   - AI-suggested field mappings displayed in a clean review interface
   - Team confirms or adjusts mappings
   - Conflicts and duplicates flagged for manual resolution

4. **Import & Process**
   - Progress indicator showing import status
   - Documents processing async in background
   - Team can start using HomeTrack immediately; imported data appears as it's processed

5. **Migration Report**
   - Summary: X contacts imported, Y listings created, Z documents processed
   - Items requiring attention: duplicates, unmapped fields, failed document extractions
   - Quick link to review and resolve each item

---

*Migration tooling is a competitive moat. Every month a team uses HomeTrack, their operational data becomes more deeply embedded in the platform — making reverse migration increasingly impractical. The easier we make inbound migration, the harder outbound migration becomes by default.*
