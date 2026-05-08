import json
import uuid
from datetime import datetime, timezone

from temporalio import activity

import httpx

from src.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, logger
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
    action_moment_links: dict | None = None,
) -> dict:
    """Save full pipeline output to Supabase Storage and Postgres."""
    activity.heartbeat("saving results")

    now = datetime.utcnow()
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

    # Individual frames — already uploaded to storage by extract_frames activity.
    # frame["path"] contains the storage path (e.g. _frames/abc123/frame_0001.jpg)
    frame_storage_map: dict[int, dict] = {}  # index -> {storage_path, timestamp}
    if frames_data:
        for frame in frames_data:
            frame_storage_map[frame["index"]] = {
                "storage_path": frame.get("path", ""),
                "timestamp": frame["timestamp_seconds"],
            }
        result.storage_paths["frames"] = f"{storage_prefix}/processed/frames/"
        activity.heartbeat(f"mapped {len(frames_data)} frames")

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

            # 2c-ii. Copy frames to public bucket and set thumbnail
            thumbnail_url = None
            if frames_data and frame_id_map:
                try:
                    public_bucket = "field-media-public"
                    auth_headers = {
                        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                        "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    }
                    public_urls: dict[int, str] = {}  # frame_index -> public_url

                    async with httpx.AsyncClient(timeout=120) as http:
                        for frame in frames_data:
                            idx = frame["index"]
                            storage_path = frame.get("path", "")
                            if not storage_path:
                                continue

                            # Download frame bytes from private bucket
                            dl_url = f"{SUPABASE_URL}/storage/v1/object/field-media/{storage_path}"
                            dl_resp = await http.get(dl_url, headers=auth_headers)
                            if dl_resp.status_code != 200:
                                logger.warning("Failed to download frame %d: %s", idx, dl_resp.status_code)
                                continue

                            # Upload to public bucket
                            public_path = f"thumbnails/{field_note_id}/frame_{idx:04d}.jpg"
                            up_url = f"{SUPABASE_URL}/storage/v1/object/{public_bucket}/{public_path}"
                            up_resp = await http.put(
                                up_url,
                                headers={**auth_headers, "Content-Type": "image/jpeg", "x-upsert": "true"},
                                content=dl_resp.content,
                            )
                            if up_resp.status_code == 404:
                                up_resp = await http.post(
                                    up_url,
                                    headers={**auth_headers, "Content-Type": "image/jpeg"},
                                    content=dl_resp.content,
                                )

                            if up_resp.status_code in (200, 201):
                                frame_public_url = f"{SUPABASE_URL}/storage/v1/object/public/{public_bucket}/{public_path}"
                                public_urls[idx] = frame_public_url

                                # Update frame record with public_url
                                frame_id = frame_id_map.get(idx)
                                if frame_id:
                                    await conn.execute(
                                        "UPDATE field_note_frames SET public_url = $1 WHERE id = $2",
                                        frame_public_url,
                                        frame_id,
                                    )
                            else:
                                logger.warning("Failed to upload frame %d to public bucket: %s", idx, up_resp.status_code)

                    # Select thumbnail: best frame from highest-importance moment, or frame 0
                    if public_urls:
                        if correlations:
                            # Use best frame from first correlation (highest importance)
                            for corr in correlations:
                                if corr.ranked_frames:
                                    best_idx = corr.ranked_frames[0].frame_index
                                    if best_idx in public_urls:
                                        thumbnail_url = public_urls[best_idx]
                                        break
                        if not thumbnail_url and 0 in public_urls:
                            thumbnail_url = public_urls[0]
                        if not thumbnail_url:
                            # Fallback to first available
                            thumbnail_url = next(iter(public_urls.values()))

                    if thumbnail_url:
                        await conn.execute(
                            "UPDATE field_notes SET thumbnail_url = $1 WHERE id = $2",
                            thumbnail_url,
                            field_note_id,
                        )

                    activity.heartbeat(f"copied {len(public_urls)} frames to public bucket")
                    logger.info("Public thumbnails: %d/%d frames, thumbnail=%s", len(public_urls), len(frames_data), thumbnail_url)

                except Exception:
                    logger.exception("Failed to copy frames to public bucket (non-fatal)")

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

            # 2f. Insert quotes_needed as field_note_actions with quote_needed=true
            for quote in insights.quotes_needed:
                action_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO field_note_actions
                       (id, field_note_id, title, description, category, priority,
                        status, quote_needed, estimated_vendor_category,
                        extraction_confidence, metadata, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, 'suggested', true, $7, 0.8, $8::jsonb, $9, $9)""",
                    action_id,
                    field_note_id,
                    f"Get quote: {quote.description}",
                    quote.description,
                    "quoting",
                    quote.priority,
                    quote.trade or "",
                    json.dumps({"source": "ai_extraction", "type": "quote_request"}),
                    now,
                )
                result.action_ids.append(action_id)

            if insights.quotes_needed:
                activity.heartbeat(f"inserted {len(insights.quotes_needed)} quote requests")

            # 2g. Insert decisions as activity_items
            for decision in insights.decisions:
                item_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO activity_items
                       (id, team_id, listing_id, type, author_name, content,
                        metadata, timestamp, created_at, updated_at)
                       VALUES ($1, $2, $3, 'note', $4, $5, $6::jsonb, $7, $7, $7)""",
                    item_id, team_id, listing_id,
                    author_name,
                    f"Decision: {decision.content}",
                    json.dumps({"type": "decision", "decided_by": decision.decided_by, "source": "ai_extraction"}),
                    now,
                )
                result.activity_items_created.append(item_id)

            if insights.decisions:
                activity.heartbeat(f"inserted {len(insights.decisions)} decisions")

            # 2h. Insert questions_raised as activity_items
            for question in insights.questions_raised:
                item_id = str(uuid.uuid4())
                await conn.execute(
                    """INSERT INTO activity_items
                       (id, team_id, listing_id, type, author_name, content,
                        metadata, timestamp, created_at, updated_at)
                       VALUES ($1, $2, $3, 'note', $4, $5, $6::jsonb, $7, $7, $7)""",
                    item_id, team_id, listing_id,
                    author_name,
                    f"Question: {question.content}",
                    json.dumps({"type": "question", "directed_to": question.directed_to, "source": "ai_extraction"}),
                    now,
                )
                result.activity_items_created.append(item_id)

            if insights.questions_raised:
                activity.heartbeat(f"inserted {len(insights.questions_raised)} questions")

            # 2i. Insert observations as activity_items (preserve existing behavior)
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

            # 2j. Insert action-moment links into junction table
            if action_moment_links and moment_id_map and result.action_ids:
                links = action_moment_links.get("links", [])
                link_count = 0
                for link in links:
                    action_idx = link.get("action_index")
                    moment_indices = link.get("moment_indices", [])
                    relevance = link.get("relevance", "")

                    if action_idx is None or action_idx >= len(result.action_ids):
                        continue
                    action_db_id = result.action_ids[action_idx]

                    for mi in moment_indices:
                        moment_db_id = moment_id_map.get(mi)
                        if not moment_db_id:
                            continue
                        link_id = str(uuid.uuid4())
                        await conn.execute(
                            """INSERT INTO field_note_action_moments
                               (id, action_id, moment_id, relevance, created_at)
                               VALUES ($1, $2, $3, $4, $5)""",
                            link_id,
                            action_db_id,
                            moment_db_id,
                            relevance or None,
                            now,
                        )
                        link_count += 1

                if link_count:
                    activity.heartbeat(f"inserted {link_count} action-moment links")

    logger.info(
        "Saved field note %s: %d frames, %d moments, %d actions (%d quotes), %d activity items",
        field_note_id,
        len(result.frame_ids),
        len(result.moment_ids),
        len(result.action_ids),
        len(insights.quotes_needed),
        len(result.activity_items_created),
    )
    return result.model_dump()
