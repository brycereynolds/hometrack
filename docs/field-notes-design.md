# Field Notes System Design

**Date:** 2026-04-14
**Status:** Design complete, ready for implementation

---

## Overview

Field notes is the core intelligence capture system for HomeTrack. Agents in the field record video walkthroughs, voice memos, and text notes about properties. The system processes these through an AI pipeline that extracts actionable items, observations, decisions, and quote requests — then surfaces them in the product for review and action.

---

## 1. Storage Architecture

```
field-notes/{teamId}/{fieldNoteId}/
├── original/
│   ├── video.mp4                    # Original upload
│   └── metadata.json               # Duration, resolution, fps, file size
├── processed/
│   ├── video_1080p.mp4              # Downscaled for playback
│   └── frames/
│       ├── frame_0000.jpg           # Every 5 seconds
│       ├── frame_0005.jpg
│       └── ...
└── artifacts/
    ├── pipeline_output.json          # Complete processing result
    ├── transcript_raw.json           # Whisper segments with timestamps
    ├── transcript_enriched.md        # Narrative with visual insights
    ├── moments.json                  # Key moments with correlations
    └── insights.json                 # Structured Pydantic output
```

---

## 2. Database Schema (New Tables)

### field_notes (upgrade existing)
The parent record for every field note capture.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | UUID |
| team_id | text FK → teams | |
| listing_id | text FK → listings | nullable for general notes |
| author_id | text FK → team_members | |
| media_type | enum | video, voice_memo, text, photo |
| status | enum | pending, processing, completed, failed |
| content_hash | text | SHA256 of original file |
| tag | enum | showing, vendor, client, general |
| text_content | text | User's typed note (if any) |
| summary | text | AI-generated summary |
| media_storage_path | text | Original file in Storage |
| processed_media_path | text | Downscaled video path |
| duration | real | Seconds (video/audio) |
| frame_count | integer | Extracted frames |
| workflow_id | text | Temporal workflow ID |
| processing_started_at | timestamp | |
| processing_completed_at | timestamp | |
| processing_error | text | Error message if failed |
| processing_stages | jsonb | [{stage, status, duration_ms}] |
| created_at | timestamp | |
| updated_at | timestamp | |

### field_note_transcripts
Raw and enriched transcript data.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| field_note_id | text FK → field_notes | cascade delete |
| raw_transcript | text | Full plain text |
| raw_segments | jsonb | [{start, end, text, speaker}] |
| language | text | e.g., "en" |
| enriched_transcript | text | Markdown with visual context |
| raw_storage_path | text | transcript_raw.json |
| enriched_storage_path | text | transcript_enriched.md |

### field_note_frames
Metadata for each extracted video frame.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| field_note_id | text FK → field_notes | cascade delete |
| frame_index | integer | Sequential order |
| timestamp | real | Seconds into video |
| storage_path | text | frames/frame_XXXX.jpg |
| caption | text | Vision model description |
| visual_description | text | Detailed frame content |

### field_note_moments
Key moments identified in the video with frame correlations.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| field_note_id | text FK → field_notes | cascade delete |
| moment_index | integer | Order in video |
| timestamp | real | When in video (seconds) |
| end_timestamp | real | End of moment span |
| category | text | topic_change, observation, decision, action_item, condition_note, visual_reference |
| description | text | What the speaker discussed |
| transcript_context | text | 60s window of surrounding speech |
| best_frame_id | text FK → field_note_frames | Most relevant frame |
| best_frame_timestamp | real | |
| ranked_frames | jsonb | [{timestamp, rank, relevance}] |
| scrub_start | real | Recommended video scrub start |
| scrub_end | real | Recommended video scrub end |
| enriched_caption | text | Combined speech + visual narrative |
| speech_visual_relationship | text | How audio relates to video |

### field_note_actions
Extracted action items as first-class entities with lifecycle tracking.

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| field_note_id | text FK → field_notes | cascade delete |
| title | text | Action item title |
| description | text | Detailed description |
| category | text | demolition, flooring, fixtures, paint, cleaning, moving, staging, quoting, general |
| priority | text | low, medium, high, urgent |
| status | text | suggested, accepted, dismissed, task_created |
| quote_needed | boolean | Needs vendor quote? |
| estimated_vendor_category | text | handyman, flooring, electrician, etc. |
| source_moment_id | text FK → field_note_moments | Where in video |
| source_timestamp | real | When mentioned |
| source_quote | text | Direct transcript quote |
| extraction_confidence | real | 0-1 |
| linked_task_id | text FK → tasks | Created task (after acceptance) |
| linked_quote_id | text FK → quotes | Created quote (after acceptance) |
| reviewed_by | text FK → team_members | Who reviewed |
| reviewed_at | timestamp | |
| metadata | jsonb | AI model info, etc. |
| created_at | timestamp | |
| updated_at | timestamp | |

### Extend existing tasks table
| Column | Type | Notes |
|--------|------|-------|
| source_field_note_action_id | text FK → field_note_actions | nullable |

---

## 3. UI Pages

### 3.1 Capture Flow (existing `/mobile/field-notes`, enhanced)

**Changes from current:**
- After save, navigate to the field note detail view instead of clearing form
- Show processing status: "Uploading..." → "Processing transcript..." → redirect to detail
- Video recording option (in addition to file picker)

### 3.2 Field Notes Tab (new: `/listings/[id]/field-notes`)

11th tab in listing detail view. Shows all field notes for this listing.

**List view:**
- Card per note: thumbnail (video/photo) or type icon, title, date, tag badge, processing status
- Filter chips: All / Videos / Voice / Text / Photos
- Sort: Newest / Oldest
- Empty state: "No field notes yet — capture your first walkthrough"

### 3.3 Field Note Detail (new: `/listings/[id]/field-notes/[noteId]`)

The centerpiece view after processing completes.

**Sections:**

**Header:** Author, date, tag badge, status badge, listing link

**Media Player:**
- Video: HTML5 player with scrub bar
- Clickable frame gallery below — click jumps video to timestamp
- Voice memo: waveform player
- Text: plain text display

**Transcript:**
- Full transcript with timestamps
- Visual insight blocks interleaved (from enriched transcript)
- Click timestamp → video jumps to that position

**Key Moments Timeline:**
- Visual timeline with category-colored dots
- Click moment → video scrubs to scrub_start, shows enriched caption
- Shows best frame thumbnail inline

**Action Items:**
- Cards for each AI-extracted action item
- Shows: title, category badge, priority badge, source quote, frame thumbnail
- Buttons: [Accept as Task] [Create Quote] [Edit] [Dismiss]
- Accept → creates task in tasks table, links back
- Create Quote → creates vendor quote request
- Dismiss → marks as dismissed, grays out

**Observations:**
- Positive findings (green) and concerns (amber)
- Each with area label, description, frame reference

**Decisions & Questions:**
- Decisions made during walkthrough
- Open questions (unanswered)

### 3.4 Activity Feed Integration

Field notes appear in listing activity feed with:
- Video thumbnail preview (3s autoplay muted)
- "View full note →" link to detail view
- Processing status badge while being processed

### 3.5 Dashboard

- Quick actions already link to capture pages
- Optional: "Recent Field Notes" widget showing latest with status

---

## 4. Action Item Lifecycle

```
AI Extraction
    ↓
[suggested] — shown in field note detail view
    ↓
User reviews → [Accept as Task] / [Create Quote] / [Edit] / [Dismiss]
    ↓
[accepted] → Task created in tasks table (linked via source_field_note_action_id)
    or
[quote_created] → Quote request created in quotes table
    or
[dismissed] → grayed out, can undo
```

---

## 5. Temporal Worker Pipeline (9 stages)

```
1. download_media      → fetch from Storage, downscale to 1080p
2. extract_audio       → ffmpeg: video → 16kHz mono MP3
3. extract_frames      → interval (5s) + scene detection, base64 encode
4. transcribe          → Whisper API + Claude speaker diarization
5. analyze_key_moments → Claude: identify 30-50 key moments with categories
6. correlate_frames    → Claude vision: match frames to moments, rank, scrub windows
7. enrich_transcript   → merge speech + visual insights into narrative
8. extract_insights    → Claude: structured extraction via Pydantic models
9. save_results        → Storage artifacts + all DB tables populated
```

**Cost:** ~$1-3 per 6-minute video
**Time:** ~5-10 minutes processing

---

## 6. Implementation Priority

### Phase A: Schema + Storage (foundation)
1. Create all 5 new database tables (Drizzle schema + migration)
2. Update temporal-worker save_results to populate all tables
3. Storage bucket structure with proper paths

### Phase B: Detail View (centerpiece)
4. Field notes list tab in listing detail
5. Field note detail page with video player + transcript + action items
6. Accept/dismiss action items flow

### Phase C: Capture Enhancement
7. Post-save redirect to detail view
8. Processing status polling/realtime updates
9. Video recording option on capture page

### Phase D: Polish
10. Frame gallery with video jump
11. Key moments timeline
12. Transcript search + highlight
13. Activity feed integration improvements
