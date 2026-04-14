import json
import uuid
from datetime import datetime, timezone

from temporalio import activity

from src.config import logger
from src.db import get_pool
from src.models import FieldNoteInsights, FrameCorrelation, ProcessingResult
from src.storage import upload_to_storage


@activity.defn
async def save_results(
    field_note_id: str,
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
    duration: float | None,
    processed_media_path: str | None,
) -> dict:
    """Save full pipeline output to Supabase Storage and Postgres."""
    activity.heartbeat("saving results")

    now = datetime.now(timezone.utc)
    result = ProcessingResult(
        field_note_id=field_note_id,
        listing_id=listing_id,
        media_type=media_type,
    )
    storage_prefix = f"field-notes/{team_id}/{field_note_id}"

    insights = FieldNoteInsights(**insights_data)

    # ── 1. Upload artifacts to Storage ──────────────────────────────

    # Pipeline output JSON
    pipeline_output = {
        "field_note_id": field_note_id,
        "listing_id": listing_id,
        "content_hash": content_hash,
        "processed_at": now.isoformat(),
        "transcript": transcript_data,
        "enriched_transcript": enriched_transcript,
        "insights": insights_data,
        "correlations": correlations_data,
    }
    pipeline_json = json.dumps(pipeline_output, default=str)
    pipeline_path = f"{storage_prefix}/artifacts/pipeline_output.json"
    await upload_to_storage("field-media", pipeline_path, pipeline_json.encode(), "application/json")
    result.storage_paths["pipeline_output"] = pipeline_path
    activity.heartbeat("saved pipeline output")

    # Raw transcript JSON
    raw_transcript_path = None
    if transcript_data:
        raw_transcript_path = f"{storage_prefix}/artifacts/transcript_raw.json"
        await upload_to_storage(
            "field-media",
            raw_transcript_path,
            json.dumps(transcript_data, default=str).encode(),
            "application/json",
        )
        result.storage_paths["transcript_raw"] = raw_transcript_path

    # Enriched transcript markdown
    enriched_transcript_path = None
    if enriched_transcript:
        enriched_transcript_path = f"{storage_prefix}/artifacts/transcript_enriched.md"
        await upload_to_storage(
            "field-media",
            enriched_transcript_path,
            enriched_transcript.encode(),
            "text/markdown",
        )
        result.storage_paths["enriched_transcript"] = enriched_transcript_path

    # Individual frames
    frame_storage_map: dict[int, dict] = {}  # index -> {storage_path, timestamp}
    if frames_data:
        import base64

        for frame in frames_data:
            frame_path = f"{storage_prefix}/processed/frames/frame_{frame['index']:04d}.jpg"
            frame_bytes = base64.b64decode(frame["base64_jpeg"])
            await upload_to_storage("field-media", frame_path, frame_bytes, "image/jpeg")
            frame_storage_map[frame["index"]] = {
                "storage_path": frame_path,
                "timestamp": frame["timestamp_seconds"],
            }
        result.storage_paths["frames"] = f"{storage_prefix}/processed/frames/"
        activity.heartbeat(f"saved {len(frames_data)} frames")

    # Parse correlations
    correlations: list[FrameCorrelation] = []
    if correlations_data:
        correlations = [FrameCorrelation(**c) for c in correlations_data]

    # ── 2. Populate database tables ─────────────────────────────────

    pool = await get_pool()
    frame_count = len(frames_data) if frames_data else 0

    async with pool.acquire() as conn:
        async with conn.transaction():

            # 2a. Update field_notes record
            await conn.execute(
                """UPDATE field_notes SET
                    status = 'completed',
                    summary = $1,
                    processed_media_path = $2,
                    duration = $3,
                    frame_count = $4,
                    processing_completed_at = $5,
                    updated_at = $5
                WHERE id = $6""",
                insights.summary or None,
                processed_media_path,
                duration,
                frame_count,
                now,
                field_note_id,
            )
            activity.heartbeat("updated field_notes record")

            # 2b. Insert field_note_transcripts
            transcript_id = None
            if transcript_data:
                transcript_id = str(uuid.uuid4())
                raw_text = transcript_data.get("text", "")
                raw_segments = transcript_data.get("segments", [])
                language = transcript_data.get("language", "en")

                await conn.execute(
                    """INSERT INTO field_note_transcripts
                       (id, field_note_id, raw_transcript, raw_segments,
                        language, enriched_transcript, raw_storage_path, enriched_storage_path)
                       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)""",
                    transcript_id,
                    field_note_id,
                    raw_text,
                    json.dumps(raw_segments),
                    language,
                    enriched_transcript,
                    raw_transcript_path,
                    enriched_transcript_path,
                )
                result.transcript_id = transcript_id
                activity.heartbeat("inserted transcript")

            # 2c. Insert field_note_frames
            frame_id_map: dict[int, str] = {}  # frame_index -> id
            if frames_data:
                for frame in frames_data:
                    frame_id = str(uuid.uuid4())
                    idx = frame["index"]
                    storage_info = frame_storage_map.get(idx, {})

                    # Find caption from correlations
                    caption = None
                    visual_desc = None
                    for corr in correlations:
                        for rf in corr.ranked_frames:
                            if rf.frame_index == idx:
                                caption = rf.caption
                                visual_desc = None
                                break

                    await conn.execute(
                        """INSERT INTO field_note_frames
                           (id, field_note_id, frame_index, timestamp, storage_path,
                            caption, visual_description)
                           VALUES ($1, $2, $3, $4, $5, $6, $7)""",
                        frame_id,
                        field_note_id,
                        idx,
                        frame["timestamp_seconds"],
                        storage_info.get("storage_path"),
                        caption,
                        visual_desc,
                    )
                    frame_id_map[idx] = frame_id
                    result.frame_ids.append(frame_id)

                activity.heartbeat(f"inserted {len(frames_data)} frames")

            # 2d. Insert field_note_moments (from correlations merged with key moments)
            moment_id_map: dict[int, str] = {}  # moment_index -> id
            if correlations:
                for corr in correlations:
                    moment_id = str(uuid.uuid4())
                    midx = corr.moment_index

                    # Find best frame ID
                    best_frame_id = None
                    best_frame_timestamp = None
                    if corr.ranked_frames:
                        best = corr.ranked_frames[0]
                        best_frame_id = frame_id_map.get(best.frame_index)
                        best_frame_timestamp = best.timestamp_seconds

                    ranked_frames_json = json.dumps(
                        [
                            {
                                "timestamp": rf.timestamp_seconds,
                                "rank": i + 1,
                                "relevance": rf.relevance_score,
                            }
                            for i, rf in enumerate(corr.ranked_frames)
                        ]
                    )

                    # Get speech_visual_relationship from best frame
                    svr = None
                    if corr.ranked_frames:
                        svr = corr.ranked_frames[0].speech_visual_relationship

                    await conn.execute(
                        """INSERT INTO field_note_moments
                           (id, field_note_id, moment_index, timestamp, end_timestamp,
                            category, description, transcript_context,
                            best_frame_id, best_frame_timestamp, ranked_frames,
                            scrub_start, scrub_end, enriched_caption,
                            speech_visual_relationship)
                           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                                   $11::jsonb, $12, $13, $14, $15)""",
                        moment_id,
                        field_note_id,
                        midx,
                        corr.moment_timestamp,
                        None,  # end_timestamp filled if available
                        None,  # category from key moments
                        corr.moment_description,
                        None,  # transcript_context
                        best_frame_id,
                        best_frame_timestamp,
                        ranked_frames_json,
                        corr.scrub_window_start,
                        corr.scrub_window_end,
                        corr.enriched_caption,
                        svr,
                    )
                    moment_id_map[midx] = moment_id
                    result.moment_ids.append(moment_id)

                activity.heartbeat(f"inserted {len(correlations)} moments")

            # 2e. Insert field_note_actions
            for item in insights.action_items:
                action_id = str(uuid.uuid4())
                metadata = json.dumps({
                    "source": "ai_extraction",
                    "field_note_id": field_note_id,
                })

                await conn.execute(
                    """INSERT INTO field_note_actions
                       (id, field_note_id, title, description, category, priority,
                        status, quote_needed, estimated_vendor_category,
                        source_moment_id, source_timestamp, source_quote,
                        extraction_confidence, metadata, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, 'suggested', $7, $8,
                               $9, $10, $11, $12, $13::jsonb, $14, $14)""",
                    action_id,
                    field_note_id,
                    item.title,
                    item.description or None,
                    item.category,
                    item.priority,
                    item.quote_needed,
                    item.estimated_vendor_category,
                    None,  # source_moment_id - could be matched by timestamp
                    item.source_timestamp,
                    item.source_quote or None,
                    item.extraction_confidence,
                    metadata,
                    now,
                )
                result.action_ids.append(action_id)

            if insights.action_items:
                activity.heartbeat(f"inserted {len(insights.action_items)} actions")

            # 2f. Insert observations as activity_items (preserve existing behavior)
            for obs in insights.observations:
                item_id = str(uuid.uuid4())
                obs_metadata = json.dumps({
                    "observation_type": obs.observation_type,
                    "area": obs.area,
                    "source": "ai_extraction",
                    "field_note_id": field_note_id,
                })
                await conn.execute(
                    """INSERT INTO activity_items
                       (id, team_id, listing_id, type, author_id, author_name,
                        content, metadata, timestamp, created_at, updated_at)
                       VALUES ($1, $2, $3, 'note', $4, $5, $6, $7::jsonb, $8, $8, $8)""",
                    item_id, team_id, listing_id, author_id, author_name,
                    obs.content, obs_metadata, now,
                )
                result.activity_items_created.append(item_id)

    logger.info(
        "Saved field note %s: %d frames, %d moments, %d actions, %d activity items",
        field_note_id,
        len(result.frame_ids),
        len(result.moment_ids),
        len(result.action_ids),
        len(result.activity_items_created),
    )
    return result.model_dump()
