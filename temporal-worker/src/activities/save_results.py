import json
import uuid
from datetime import datetime, timezone

from temporalio import activity

from src.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, logger
from src.db import get_pool
from src.models import FieldNoteInsights, ProcessingResult
from src.storage import upload_to_storage


@activity.defn
async def save_results(
    listing_id: str,
    team_id: str,
    author_id: str,
    author_name: str,
    media_type: str,
    content_hash: str,
    transcript_data: dict | None,
    enriched_transcript: str | None,
    insights_data: dict,
    frames_data: list[dict] | None,
    correlations_data: list[dict] | None,
) -> dict:
    """Save full pipeline output to Supabase Storage and Postgres."""
    activity.heartbeat("saving results")

    now = datetime.now(timezone.utc)
    result = ProcessingResult(listing_id=listing_id, media_type=media_type)
    storage_prefix = f"field-notes/{listing_id}/{content_hash}"

    insights = FieldNoteInsights(**insights_data)

    # 1. Save full pipeline output JSON to Supabase Storage
    pipeline_output = {
        "listing_id": listing_id,
        "content_hash": content_hash,
        "processed_at": now.isoformat(),
        "transcript": transcript_data,
        "enriched_transcript": enriched_transcript,
        "insights": insights_data,
        "correlations": correlations_data,
    }
    pipeline_json = json.dumps(pipeline_output, default=str)
    pipeline_path = f"{storage_prefix}/pipeline_output.json"
    await upload_to_storage("field-media", pipeline_path, pipeline_json.encode(), "application/json")
    result.storage_paths["pipeline_output"] = pipeline_path
    activity.heartbeat("saved pipeline output")

    # 2. Save individual frames to Supabase Storage
    frame_storage_paths: list[dict] = []
    if frames_data:
        import base64
        for frame in frames_data:
            frame_path = f"{storage_prefix}/frames/frame_{frame['index']:04d}.jpg"
            frame_bytes = base64.b64decode(frame["base64_jpeg"])
            await upload_to_storage("field-media", frame_path, frame_bytes, "image/jpeg")
            frame_storage_paths.append({
                "index": frame["index"],
                "timestamp": frame["timestamp_seconds"],
                "storage_path": frame_path,
            })
        result.storage_paths["frames"] = f"{storage_prefix}/frames/"
        activity.heartbeat(f"saved {len(frames_data)} frames")

    # 3. Save enriched transcript to Storage
    if enriched_transcript:
        transcript_path = f"{storage_prefix}/enriched_transcript.md"
        await upload_to_storage("field-media", transcript_path, enriched_transcript.encode(), "text/markdown")
        result.storage_paths["enriched_transcript"] = transcript_path

    pool = await get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():
            # 4. Create field_note_processing record
            processing_id = str(uuid.uuid4())
            await conn.execute(
                """INSERT INTO field_note_processing
                   (id, team_id, listing_id, content_hash, media_type, status,
                    pipeline_output_path, frame_count, moment_count, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8, $9, $9)
                   ON CONFLICT (content_hash) DO UPDATE SET
                       status = 'completed',
                       pipeline_output_path = $6,
                       updated_at = $9""",
                processing_id, team_id, listing_id, content_hash, media_type,
                pipeline_path,
                len(frames_data) if frames_data else 0,
                len(correlations_data) if correlations_data else 0,
                now,
            )
            result.processing_record_id = processing_id

            # 5. Insert action items as tasks
            for item in insights.action_items:
                priority = item.priority
                if priority not in ("low", "medium", "high", "urgent"):
                    priority = "medium"
                category = item.category
                if category not in ("onboarding", "improvements", "disclosures", "staging", "media", "pricing", "marketing", "showings", "offers", "escrow", "general"):
                    category = "general"

                task_id = str(uuid.uuid4())
                metadata = json.dumps({
                    "source": "ai_extraction",
                    "processing_id": processing_id,
                    "quote_needed": item.quote_needed,
                    "source_quote": item.source_quote,
                })
                await conn.execute(
                    """INSERT INTO tasks
                       (id, team_id, listing_id, title, description, status, priority,
                        assignee_id, task_category, metadata, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7, $8, $9::jsonb, $10, $10)""",
                    task_id, team_id, listing_id, item.title, item.description,
                    priority, author_id, category, metadata, now,
                )
                result.tasks_created.append(task_id)

            # 6. Insert observations as activity_items
            for obs in insights.observations:
                item_id = str(uuid.uuid4())
                metadata = json.dumps({
                    "observation_type": obs.observation_type,
                    "area": obs.area,
                    "source": "ai_extraction",
                    "processing_id": processing_id,
                })
                await conn.execute(
                    """INSERT INTO activity_items
                       (id, team_id, listing_id, type, author_id, author_name,
                        content, metadata, timestamp, created_at, updated_at)
                       VALUES ($1, $2, $3, 'note', $4, $5, $6, $7::jsonb, $8, $8, $8)""",
                    item_id, team_id, listing_id, author_id, author_name,
                    obs.content, metadata, now,
                )
                result.activity_items_created.append(item_id)

            # 7. Insert enriched transcript as activity_item
            if enriched_transcript:
                item_id = str(uuid.uuid4())
                metadata = json.dumps({
                    "source": "ai_extraction",
                    "processing_id": processing_id,
                    "storage_path": result.storage_paths.get("enriched_transcript", ""),
                    "frame_references": frame_storage_paths,
                })
                activity_type = "voice_memo" if media_type in ("video", "voice_memo") else "note"
                await conn.execute(
                    """INSERT INTO activity_items
                       (id, team_id, listing_id, type, author_id, author_name,
                        content, metadata, timestamp, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $9, $9)""",
                    item_id, team_id, listing_id, activity_type,
                    author_id, author_name, enriched_transcript, metadata, now,
                )
                result.activity_items_created.append(item_id)

    logger.info(
        "Saved %d tasks and %d activity items for listing %s (processing: %s)",
        len(result.tasks_created), len(result.activity_items_created),
        listing_id, processing_id,
    )
    return result.model_dump()
