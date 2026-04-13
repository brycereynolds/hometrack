# HomeTrack Temporal Worker

Processes field media (video, voice memos, text notes) captured by real estate agents. Extracts transcriptions, key frames, todos, and notes, then writes them back to the HomeTrack Postgres database.

## Setup

```bash
# Install dependencies
pip install -e .

# Copy and fill in environment variables
cp .env.example .env

# Run the worker
python -m src.worker
```

## Architecture

- **Temporal Cloud** — Workflow orchestration (namespace: `quickstart-hometrack.w8bgj`)
- **Task Queue** — `field-media-processing`
- **Workflow** — `ProcessFieldMedia` routes to the right activity chain based on media type

### Media Processing Pipelines

| Media Type | Steps |
|------------|-------|
| Video | download → extract audio → extract frames → transcribe → caption frames → extract insights → save |
| Voice Memo | download → transcribe → extract insights → save |
| Text | extract insights → save |

## Docker

```bash
docker build -t hometrack-temporal-worker .
docker run --env-file .env hometrack-temporal-worker
```
