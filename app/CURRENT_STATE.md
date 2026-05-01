# HomeTrack — Current State (April 30, 2026)

Context file for the next agent picking up this work.

## Critical Bugs (Must Fix First)

### 1. TUS Upload Not Working
- **Symptom**: File uploads fail almost immediately with "1 file failed to upload"
- **What was done**: Implemented TUS resumable uploads via `tus-js-client` to replace signed URL + XHR PUT (which was limited to 50MB by Supabase Storage's standard upload limit)
- **Flow**: Browser → `/api/field-media/tus-token` (get credentials) → `tus-js-client` uploads to `{SUPABASE_URL}/storage/v1/upload/resumable` in 6MB chunks → `/api/field-media/complete` (create DB record + trigger workflow)
- **Files**: `src/lib/upload.ts`, `src/routes/api/field-media/tus-token/+server.ts`, upload logic in `CaptureModal.svelte` and `mobile/field-notes/+page.svelte`
- **Likely issue**: The TUS upload may be failing because of auth (using service role key in browser), CORS, or the TUS endpoint path. Needs a test script to isolate.
- **Test approach**: Write a standalone Node.js script that uploads a file via TUS to confirm the endpoint works, then debug the browser-side.
- **Small files (screenshots, <50MB) DID work** with the old signed URL approach. The file IS in the bucket at `field-media/{teamId}/{listingId or "general"}/{timestamp}.{ext}` — Supabase Studio just doesn't show nested folders at root level.

### 2. CaptureModal Position Broken
- **Symptom**: Modal appears at the bottom of the window instead of centered
- **Likely cause**: Recent changes to Dialog.Content class (drag-and-drop overlay, isDragOver conditional classes) broke the positioning
- **File**: `src/lib/components/shared/CaptureModal.svelte` — look at the `<Dialog.Content>` element classes

### 3. Auto-Navigation After Save
- **Symptom**: After clicking "Save Note", the page navigates away within 2 seconds even though upload is still in progress
- **Root cause**: The `save()` function in CaptureModal sets `saveComplete = true` after the text note is created (via `/api/notes`), but before attachments finish uploading. The `beforeNavigate` guard then fires because the page navigates.
- **Fix needed**: Don't set `saveComplete = true` until ALL attachments are done uploading. The save flow should be: create note → upload all attachments → THEN show success state.

## Infrastructure (Railway Self-Hosted Supabase)

### Services and Their Env Vars

| Service | Key Env Vars |
|---------|-------------|
| **Supabase Storage** | `UPLOAD_FILE_SIZE_LIMIT=10737418240`, `UPLOAD_FILE_SIZE_LIMIT_STANDARD=10737418240`, `STORAGE_BACKEND=s3`, `STORAGE_S3_BUCKET=stub` |
| **Kong** (API Gateway) | `KONG_NGINX_PROXY_CLIENT_MAX_BODY_SIZE=10g` |
| **S3 (Minio)** | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, port 9000 |
| **Postgres** | Standard Supabase Postgres |
| **GoTrue Auth** | Standard Supabase auth |

### Storage Buckets (Created in Supabase)
- `field-media` — videos, photos, frames, pipeline artifacts (10GB limit)
- `voice-memos` — audio recordings (500MB limit)
- `documents` — document uploads, branding (50MB limit)

Bucket limits set via SQL:
```sql
UPDATE storage.buckets SET file_size_limit = 10737418240 WHERE id = 'field-media';
UPDATE storage.buckets SET file_size_limit = 524288000 WHERE id = 'voice-memos';
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'documents';
```

### Upload Size Discovery
- Standard uploads (single PUT) are capped at `UPLOAD_FILE_SIZE_LIMIT_STANDARD` — confirmed 50MB works, 100MB returns 413
- TUS resumable uploads use `UPLOAD_FILE_SIZE_LIMIT` (10GB) — NOT YET CONFIRMED WORKING
- The `UPLOAD_FILE_SIZE_LIMIT_STANDARD` env var may not be taking effect despite being set to 10GB
- `SELECT current_setting('app.settings.file_size_limit', true)` returns NULL

### App Env Vars (`.env`)
- `DATABASE_URL` — Postgres connection string (supabase_admin user)
- `SUPABASE_URL` — Kong gateway URL
- `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — Supabase auth keys
- `ANTHROPIC_API_KEY` — for AI features
- `TOKENTAP_URL` / `TOKENTAP_KEY` — LLM proxy for chat agent
- `TEMPORAL_API_KEY` — Temporal Cloud for async workflows
- `BODY_SIZE_LIMIT=10737418240` — SvelteKit adapter-node body limit
- `OPENAI_API_KEY` — for temporal worker

### RLS Permissions Granted
```sql
GRANT ALL ON chat_conversations TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON field_note_comments TO authenticated;
GRANT ALL ON field_note_attachments TO authenticated;
```

## What Was Built Today

### Map Search Features
- Draggable radius circle with "Move Radius" toggle (default is pan mode)
- Polygon drawing with leaflet-draw, point-in-polygon filtering in Temporal workflow
- `searchArea` JSONB column on listings (persisted, restored on page load)
- Analysis modal adapts to active search mode (radius slider vs polygon info)
- Files: `src/routes/(app)/listings/[id]/listing/+page.svelte`, `src/routes/(app)/listings/[id]/listing/+page.server.ts`, `temporal-worker/src/workflows/market_analysis.py`

### Notes System Consolidation
- Top-level `/notes` page showing all notes across listings
- Standalone `/notes/[noteId]` detail page
- "Notes" in sidebar navigation
- CaptureModal: removed tags (AI handles), allows attachment-only saves
- Post-save shows success state with "View Details" / "Capture Another"
- `field_note_attachments` table — one note, many files
- `field_note_comments` table — threaded comments with @mentions
- Comment thread component with @mention autocomplete
- Processing status banner with stage progress + polling
- Files: `src/routes/(app)/notes/`, `src/lib/components/shared/CommentThread.svelte`, `src/lib/server/db/schema/field-note-attachment.ts`, `src/lib/server/db/schema/field-note-comment.ts`

### AI Chat Agent
- `/chat` page with streaming responses via Token Tap proxy
- Floating chat FAB (bottom-right on every page)
- Chat history with conversation list dropdown
- System prompt with full team context (listings, notes, contacts, tasks)
- Read-only for now (no tool use — won't hallucinate actions)
- `chat_conversations` + `chat_messages` tables
- Token Tap integration: `X-TokenTap-Key`, `X-TokenTap-User`, `X-TokenTap-Session`, `X-TokenTap-Trace` headers
- Model: `claude-sonnet-4-6`
- BaseURL: `{TOKENTAP_URL}/anthropic` (JS SDK adds /v1 itself, unlike Python SDK)
- Files: `src/lib/server/llm.ts`, `src/routes/api/chat/`, `src/routes/(app)/chat/+page.svelte`, `src/lib/components/shared/ChatWidget.svelte`

### Type Safety
- Fixed all 89 svelte-check errors (was 89, now 0)
- Central `src/lib/types.ts` with composite types (ListingWithProperty, MomentWithFrame, etc.)
- No `as any` scattered through codebase

### Responsive
- Tab breakpoint `md` → `lg` on listing detail pages
- CaptureModal widened to `sm:max-w-lg`

### Other
- Landing page: real avatars + "thousands of real estate teams"
- Attachment preview: card-style rows (filename, size, progress bar)
- PDF support added to file picker
- Drag-and-drop on CaptureModal (whole dialog is drop target)

## Schema Changes (Migrations Applied)
- `0002`: `search_area` JSONB on listings
- `0003`: `field_note_attachments` table
- `0004`: `field_note_comments` table
- `0005`: `chat_conversations` + `chat_messages` tables

## Tech Stack
- SvelteKit with Svelte 5 (runes mode), Tailwind CSS v4, Drizzle ORM
- Self-hosted Supabase on Railway (Kong, GoTrue, Storage/Minio, Postgres)
- Temporal Cloud for async workflows (namespace: quickstart-hometrack.w8bgj)
- Python temporal-worker with 13 activities, 2 workflows
- Token Tap for LLM observability/tracing
- tus-js-client for resumable uploads (NOT YET WORKING)
