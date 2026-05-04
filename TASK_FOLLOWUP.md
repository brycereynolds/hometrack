# Task Follow-Up: Field Notes Video Pipeline

Session: 2026-05-03

## What's Working
- TUS resumable uploads through SvelteKit proxy (no file size limit)
- Full Temporal workflow: download → extract audio/frames → transcribe → key moments → vision correlation → enriched transcript → insights → save
- Processing stages update in real-time via DB polling
- Retry button on failed notes (cleans up old data, re-triggers workflow)
- Video playback via signed URLs
- Frame images via signed URLs (fetched client-side)
- TokenTap routing for all Anthropic calls (with workflow ID as trace)
- Model: claude-sonnet-4-6 for all LLM calls

## Critical Follow-Ups

### 1. Thumbnail Strategy (OPEN QUESTION)
Currently every frame/thumbnail requires a signed URL fetched at page load. This is wasteful. Bucket should NOT be public (walkthroughs are private client content).

Possible approaches — needs more thought:
- **Long-lived signed URL on save**: During `save_results`, pick the best frame, generate a signed URL with long expiry (e.g., 7 days), store it on `field_notes.thumbnailUrl`. Regenerate periodically or on access if expired.
- **Caching proxy**: Serve frames through an app endpoint that caches signed URLs server-side with a TTL.
- **Separate public thumbnails bucket**: Copy just the selected thumbnail frame to a public bucket during processing. Keeps walkthrough video private but thumbnails accessible.
- **CDN with signed cookies**: More complex but scales better.

TBD — need to decide based on how often thumbnails are shown (list pages, dashboard, etc.) and whether expiry management is worth the complexity.

### 2. Note Detail Page Layout Redesign
Current: single column, video at top, everything scrolls below.
Desired:
- **Left**: Video player (sticky/fixed while scrolling)
- **Right**: Scrollable key moments with clickable timestamps that jump the video
- Empty state when processing hasn't completed yet
- Frame thumbnails as a horizontal strip below the video
- Transcript rendered as proper markdown (now fixed with `marked`)

### 3. Action Items → Tasks Integration
Action items extracted from videos need to connect to the rest of the system:
- **Assign** action items to team members
- **Convert** action items to tasks on the listing
- **Link** to vendor categories for quote requests
- If an action item matches an existing task, suggest linking them
- Show action items on the listing detail page under a "Tasks" or "To Do" section
- Action item status flow: suggested → accepted → task_created → completed

### 4. Notes List Page
- Frame thumbnail images are broken (same signed URL issue as detail page)
- Need the thumbnail strategy resolved (see #1)

### 5. Voice Memo & Text Processing
- Voice memo and text workflows have no processing stage updates in the UI
- Need to add `_set_stage` calls to `_process_voice_memo` and `_process_text` in the workflow
- Voice memos should show a simpler stage set (no frames/vision steps)

### 6. Enriched Transcript Display
- Now rendering via `marked()` — but the enriched transcript format (from `generate_enriched_transcript`) includes raw markdown with `**Inspector**:` and `*Visual*:` annotations
- Could be improved with custom rendering: speaker labels as colored badges, visual annotations as collapsible sections, timestamps as clickable links

### 7. Frame Storage Cleanup
- `extract_frames` stores frames under `_frames/{md5_hash}/` — if the same video is reprocessed, old frames from failed runs are orphaned
- Retry endpoint deletes DB records but not storage files
- Need a cleanup step or use the field_note_id as the storage prefix instead of an MD5 hash

### 8. Scene Detection
- ffmpeg scene detection currently fails with a warning ("Scene detection failed, using interval frames only")
- The `-frame_pts 1` flag may be incompatible with the current ffmpeg version
- Non-critical since interval-based extraction works, but scene detection would produce better key frames

### 9. Listing Connection
- Field notes can be associated with a listing (`listingId`)
- When a note has a listing, action items and observations should appear on the listing page
- Activity items are already being written to `activity_items` table with `listing_id`
- Need UI on the listing detail page to surface these

### 10. Processing Stages UX Polish
- Current: single progress bar with step name and count
- Consider: animate stage transitions, show estimated time remaining
- Consider: show a summary of what was found so far (e.g., "Found 3 action items" after insights complete)

## Technical Debt
- `datetime.utcnow()` used in save_results (naive datetime) — should use timezone-aware
- Docstring in transcribe.py says "Claude Haiku" but now uses Sonnet 4.6
- `generate_enriched_transcript.py` — not audited in detail, may have similar model ID issues
- Duplicate `import anthropic` in some activity files (no longer needed since using `get_anthropic_client`)
- Test script (`temporal-worker/test_pipeline.py`) has hardcoded credentials — should use env vars or be gitignored

## Environment Notes
- Dev Supabase: kong-dev-1145.up.railway.app
- Prod Supabase: hometrack-58495.up.railway.app
- App's `SUPABASE_URL` determines which environment — always verify before debugging
- Storage S3 bucket name in MinIO: `stub`
- TokenTap env vars (`TOKENTAP_URL`, `TOKENTAP_KEY`) needed in both `app/.env` and `temporal-worker/.env`
