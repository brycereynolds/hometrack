from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from src.activities.analyze_key_moments import analyze_key_moments
    from src.activities.caption_frames import correlate_frames
    from src.activities.download_media import download_media
    from src.activities.extract_audio import extract_audio
    from src.activities.extract_frames import extract_frames
    from src.activities.extract_insights import extract_insights
    from src.activities.generate_enriched_transcript import generate_enriched_transcript
    from src.activities.save_results import save_results
    from src.activities.transcribe import transcribe
    from src.models import FieldMediaInput


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
        else:
            raise ValueError(f"Unknown media_type: {input.media_type}")

    async def _process_video(self, input: FieldMediaInput) -> dict:
        field_note_id = input.metadata.get("field_note_id", "")

        # 1. Download + downscale
        download_result: dict = await workflow.execute_activity(
            download_media, input.storage_path,
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=3),
        )
        local_path = download_result["local_path"]
        content_hash = download_result["content_hash"]

        # 2. Extract audio
        audio_path: str = await workflow.execute_activity(
            extract_audio, local_path,
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=5),
        )

        # 3. Extract frames (interval-based with scene detection merge)
        frames_data: list[dict] = await workflow.execute_activity(
            extract_frames, local_path,
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=5),
        )

        # 4. Transcribe with speaker diarization
        transcript_data: dict = await workflow.execute_activity(
            transcribe, audio_path,
            start_to_close_timeout=timedelta(minutes=15),
            heartbeat_timeout=timedelta(minutes=5),
        )

        # 5. Analyze key moments
        moments_data: list[dict] = await workflow.execute_activity(
            analyze_key_moments, transcript_data,
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
        )

        # 6. Correlate frames with key moments (vision)
        correlations_data: list[dict] = await workflow.execute_activity(
            correlate_frames, args=[frames_data, moments_data],
            start_to_close_timeout=timedelta(minutes=30),
            heartbeat_timeout=timedelta(minutes=5),
        )

        # 7. Generate enriched transcript
        enriched_transcript: str = await workflow.execute_activity(
            generate_enriched_transcript,
            args=[transcript_data, moments_data, correlations_data],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
        )

        # 8. Extract insights (HomeTrack-specific with Pydantic)
        corr_summary = _build_correlations_summary(correlations_data)
        insights_data: dict = await workflow.execute_activity(
            extract_insights,
            args=[enriched_transcript, corr_summary],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
        )

        # Derive duration from transcript if available
        duration = _get_duration(transcript_data)

        # 9. Save results (full storage + all DB tables)
        result: dict = await workflow.execute_activity(
            save_results,
            args=[
                field_note_id, input.listing_id, input.team_id,
                input.author_id, input.author_name, input.media_type,
                content_hash, transcript_data, enriched_transcript,
                insights_data, frames_data, correlations_data,
                duration, None,
            ],
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=5),
        )
        return result

    async def _process_voice_memo(self, input: FieldMediaInput) -> dict:
        field_note_id = input.metadata.get("field_note_id", "")

        # 1. Download
        download_result: dict = await workflow.execute_activity(
            download_media, input.storage_path,
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )
        local_path = download_result["local_path"]
        content_hash = download_result["content_hash"]

        # 2. Transcribe with diarization (already audio, skip extraction)
        transcript_data: dict = await workflow.execute_activity(
            transcribe, local_path,
            start_to_close_timeout=timedelta(minutes=15),
            heartbeat_timeout=timedelta(minutes=5),
        )

        # 3. Analyze key moments (voice-only prompt, no visual references)
        transcript_with_type = {**transcript_data, "media_type": "voice_memo"}
        moments_data: list[dict] = await workflow.execute_activity(
            analyze_key_moments, transcript_with_type,
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
        )

        # 4. Generate enriched transcript (no frames/correlations)
        enriched_transcript: str = await workflow.execute_activity(
            generate_enriched_transcript,
            args=[transcript_data, moments_data, []],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=3),
        )

        # 5. Extract insights
        insights_data: dict = await workflow.execute_activity(
            extract_insights,
            args=[enriched_transcript, None],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )

        duration = _get_duration(transcript_data)

        # 6. Save results
        result: dict = await workflow.execute_activity(
            save_results,
            args=[
                field_note_id, input.listing_id, input.team_id,
                input.author_id, input.author_name, input.media_type,
                content_hash, transcript_data, enriched_transcript,
                insights_data, None, None,
                duration, None,
            ],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )
        return result

    async def _process_text(self, input: FieldMediaInput) -> dict:
        field_note_id = input.metadata.get("field_note_id", "")
        text = input.metadata.get("text", "")
        content_hash = input.content_hash or f"text_{field_note_id}"

        # 1. Extract insights directly from text
        insights_data: dict = await workflow.execute_activity(
            extract_insights,
            args=[text, None],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )

        # 2. Save results
        result: dict = await workflow.execute_activity(
            save_results,
            args=[
                field_note_id, input.listing_id, input.team_id,
                input.author_id, input.author_name, input.media_type,
                content_hash, None, text, insights_data,
                None, None, None, None,
            ],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )
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
