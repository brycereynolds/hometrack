from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from src.activities.analyze_key_moments import analyze_key_moments
    from src.activities.caption_frames import correlate_frames
    from src.activities.download_media import download_media
    from src.activities.extract_audio import extract_audio
    from src.activities.extract_document_data import extract_document_data
    from src.activities.extract_frames import extract_frames
    from src.activities.extract_insights import extract_insights
    from src.activities.generate_enriched_transcript import generate_enriched_transcript
    from src.activities.link_actions_to_moments import link_actions_to_moments
    from src.activities.save_results import save_results
    from src.activities.transcribe import transcribe
    from src.activities.update_stage import update_processing_stage
    from src.models import FieldMediaInput

RETRY_POLICY = RetryPolicy(maximum_attempts=3)
STAGE_TIMEOUT = timedelta(seconds=10)
STAGE_RETRY = RetryPolicy(maximum_attempts=2)


@workflow.defn
class ProcessFieldMedia:
    @workflow.run
    async def run(self, input_data: dict) -> dict:
        input = FieldMediaInput(**input_data)

        if input.media_type == "video":
            return await self._process_video(input)
        elif input.media_type == "voice_memo":
            return await self._process_voice_memo(input)
        elif input.media_type == "text":
            return await self._process_text(input)
        elif input.media_type in ("photo", "pdf"):
            return await self._process_photo(input)
        else:
            raise ValueError(f"Unknown media_type: {input.media_type}")

    async def _set_stage(self, field_note_id: str, stage: str, status: str = "active") -> None:
        """Update processing stage in the DB (fire-and-forget, non-blocking)."""
        if not field_note_id:
            return
        await workflow.execute_activity(
            update_processing_stage,
            args=[field_note_id, stage, status],
            start_to_close_timeout=STAGE_TIMEOUT,
            retry_policy=STAGE_RETRY,
        )

    async def _process_video(self, input: FieldMediaInput) -> dict:
        field_note_id = input.metadata.get("fieldNoteId", "") or input.metadata.get("field_note_id", "")

        await self._set_stage(field_note_id, "download", "active")
        download_result: dict = await workflow.execute_activity(
            download_media, input.storage_path,
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=3),
            retry_policy=RETRY_POLICY,
        )
        local_path = download_result["local_path"]
        content_hash = download_result["content_hash"]
        await self._set_stage(field_note_id, "download", "completed")

        await self._set_stage(field_note_id, "extract", "active")
        audio_path: str = await workflow.execute_activity(
            extract_audio, local_path,
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=5),
            retry_policy=RETRY_POLICY,
        )
        frames_data: list[dict] = await workflow.execute_activity(
            extract_frames, local_path,
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=5),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "extract", "completed")

        await self._set_stage(field_note_id, "transcribe", "active")
        transcript_data: dict = await workflow.execute_activity(
            transcribe, audio_path,
            start_to_close_timeout=timedelta(minutes=15),
            heartbeat_timeout=timedelta(minutes=5),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "transcribe", "completed")

        await self._set_stage(field_note_id, "moments", "active")
        moments_data: list[dict] = await workflow.execute_activity(
            analyze_key_moments, transcript_data,
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "moments", "completed")

        await self._set_stage(field_note_id, "vision", "active")
        correlations_data: list[dict] = await workflow.execute_activity(
            correlate_frames, args=[frames_data, moments_data],
            start_to_close_timeout=timedelta(minutes=30),
            heartbeat_timeout=timedelta(minutes=5),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "vision", "completed")

        await self._set_stage(field_note_id, "insights", "active")
        enriched_transcript: str = await workflow.execute_activity(
            generate_enriched_transcript,
            args=[transcript_data, moments_data, correlations_data],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
            retry_policy=RETRY_POLICY,
        )
        corr_summary = _build_correlations_summary(correlations_data)
        insights_data: dict = await workflow.execute_activity(
            extract_insights,
            args=[enriched_transcript, corr_summary],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "insights", "completed")

        await self._set_stage(field_note_id, "linking", "active")
        action_moment_links: dict = await workflow.execute_activity(
            link_actions_to_moments,
            args=[moments_data, insights_data.get("action_items", [])],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "linking", "completed")

        duration = _get_duration(transcript_data)

        await self._set_stage(field_note_id, "saving", "active")
        result: dict = await workflow.execute_activity(
            save_results,
            args=[
                field_note_id, input.listing_id, input.team_id,
                input.author_id, input.author_name, input.media_type,
                content_hash, transcript_data, enriched_transcript,
                insights_data, frames_data, correlations_data,
                duration, None, action_moment_links,
            ],
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=5),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "saving", "completed")
        return result

    async def _process_voice_memo(self, input: FieldMediaInput) -> dict:
        field_note_id = input.metadata.get("fieldNoteId", "") or input.metadata.get("field_note_id", "")

        download_result: dict = await workflow.execute_activity(
            download_media, input.storage_path,
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
            retry_policy=RETRY_POLICY,
        )
        local_path = download_result["local_path"]
        content_hash = download_result["content_hash"]

        transcript_data: dict = await workflow.execute_activity(
            transcribe, local_path,
            start_to_close_timeout=timedelta(minutes=15),
            heartbeat_timeout=timedelta(minutes=5),
            retry_policy=RETRY_POLICY,
        )

        transcript_with_type = {**transcript_data, "media_type": "voice_memo"}
        moments_data: list[dict] = await workflow.execute_activity(
            analyze_key_moments, transcript_with_type,
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
            retry_policy=RETRY_POLICY,
        )

        enriched_transcript: str = await workflow.execute_activity(
            generate_enriched_transcript,
            args=[transcript_data, moments_data, []],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
            retry_policy=RETRY_POLICY,
        )

        insights_data: dict = await workflow.execute_activity(
            extract_insights,
            args=[enriched_transcript, None],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
            retry_policy=RETRY_POLICY,
        )

        action_moment_links: dict = await workflow.execute_activity(
            link_actions_to_moments,
            args=[moments_data, insights_data.get("action_items", [])],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
            retry_policy=RETRY_POLICY,
        )

        duration = _get_duration(transcript_data)

        result: dict = await workflow.execute_activity(
            save_results,
            args=[
                field_note_id, input.listing_id, input.team_id,
                input.author_id, input.author_name, input.media_type,
                content_hash, transcript_data, enriched_transcript,
                insights_data, None, None,
                duration, None, action_moment_links,
            ],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
            retry_policy=RETRY_POLICY,
        )
        return result

    async def _process_text(self, input: FieldMediaInput) -> dict:
        field_note_id = input.metadata.get("fieldNoteId", "") or input.metadata.get("field_note_id", "")
        text = input.metadata.get("text", "")
        content_hash = input.content_hash or f"text_{field_note_id}"

        insights_data: dict = await workflow.execute_activity(
            extract_insights,
            args=[text, None],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
            retry_policy=RETRY_POLICY,
        )

        result: dict = await workflow.execute_activity(
            save_results,
            args=[
                field_note_id, input.listing_id, input.team_id,
                input.author_id, input.author_name, input.media_type,
                content_hash, None, text, insights_data,
                None, None, None, None, None,
            ],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
            retry_policy=RETRY_POLICY,
        )
        return result


    async def _process_photo(self, input: FieldMediaInput) -> dict:
        field_note_id = input.metadata.get("fieldNoteId", "") or input.metadata.get("field_note_id", "")
        content_type = input.metadata.get("contentType", "") or input.metadata.get("content_type", "image/jpeg")
        content_hash = input.content_hash or f"photo_{field_note_id}"

        await self._set_stage(field_note_id, "download", "active")

        # Extract document data via Claude vision
        await self._set_stage(field_note_id, "extract", "active")
        doc_data: dict = await workflow.execute_activity(
            extract_document_data,
            args=[input.storage_path, content_type, workflow.info().workflow_id],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "extract", "completed")

        # Build text from extraction for insights
        raw_text = doc_data.get("raw_text") or ""
        doc_type = doc_data.get("document_type", "other")
        vendor = doc_data.get("vendor_name") or ""
        doc_date = doc_data.get("date") or ""
        total = doc_data.get("total_amount")
        line_items = doc_data.get("line_items", [])

        # Build a text description for extract_insights
        text_parts = []
        if doc_type != "other":
            text_parts.append(f"Document type: {doc_type}")
        if vendor:
            text_parts.append(f"Vendor: {vendor}")
        if doc_date:
            text_parts.append(f"Date: {doc_date}")
        if total is not None:
            text_parts.append(f"Total: ${total:.2f}")
        if line_items:
            text_parts.append("Line items:")
            for item in line_items:
                desc = item.get("description", "")
                amt = item.get("amount")
                amt_str = f" - ${amt:.2f}" if amt is not None else ""
                text_parts.append(f"  - {desc}{amt_str}")
        if raw_text:
            text_parts.append(f"\nRaw text:\n{raw_text}")

        enriched_text = "\n".join(text_parts) if text_parts else "Photo with no document content detected."

        # Extract insights from the document text
        await self._set_stage(field_note_id, "insights", "active")
        insights_data: dict = await workflow.execute_activity(
            extract_insights,
            args=[enriched_text, None],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "insights", "completed")

        # Merge document line items as additional cost-type action items
        if line_items and doc_type in ("receipt", "invoice", "quote"):
            existing_actions = insights_data.get("action_items", [])
            for item in line_items:
                desc = item.get("description", "")
                amt = item.get("amount")
                qty = item.get("quantity")
                unit_price = item.get("unit_price")

                detail_parts = []
                if vendor:
                    detail_parts.append(f"Vendor: {vendor}")
                if doc_date:
                    detail_parts.append(f"Date: {doc_date}")
                if qty is not None and unit_price is not None:
                    detail_parts.append(f"Qty: {qty} x ${unit_price:.2f}")
                if amt is not None:
                    detail_parts.append(f"Amount: ${amt:.2f}")

                existing_actions.append({
                    "title": desc or f"Cost from {vendor or doc_type}",
                    "description": " | ".join(detail_parts),
                    "priority": "medium",
                    "category": "cost",
                    "quote_needed": doc_type == "quote",
                    "estimated_vendor_category": None,
                    "source_timestamp": None,
                    "source_quote": "",
                    "extraction_confidence": doc_data.get("confidence", 0.0),
                })
            insights_data["action_items"] = existing_actions

        # Save results
        await self._set_stage(field_note_id, "saving", "active")
        result: dict = await workflow.execute_activity(
            save_results,
            args=[
                field_note_id, input.listing_id, input.team_id,
                input.author_id, input.author_name, input.media_type,
                content_hash, None, enriched_text, insights_data,
                None, None, None, None, None,
            ],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
            retry_policy=RETRY_POLICY,
        )
        await self._set_stage(field_note_id, "saving", "completed")

        # Attach document extraction metadata to the result
        result["document_extraction"] = doc_data
        return result


def _build_correlations_summary(correlations_data: list[dict]) -> str:
    """Build a text summary of frame correlations for the insights extractor."""
    if not correlations_data:
        return ""
    lines = []
    for corr in correlations_data:
        desc = corr.get("moment_description", "")
        ts = corr.get("moment_timestamp", 0)
        frames = corr.get("ranked_frames", [])
        if frames:
            best = frames[0]
            lines.append(
                f"- [{ts:.0f}s] {desc}: {best.get('caption', '')} "
                f"(relevance: {best.get('relevance_score', 0):.1f})"
            )
    return "\n".join(lines)


def _get_duration(transcript_data: dict | None) -> float | None:
    """Derive duration from the last segment's end timestamp."""
    if not transcript_data:
        return None
    segments = transcript_data.get("segments", [])
    if segments:
        return segments[-1].get("end")
    return None
