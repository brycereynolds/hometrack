from dataclasses import dataclass
from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from src.activities.caption_frames import FrameCaption, caption_frames
    from src.activities.download_media import DownloadResult, download_media
    from src.activities.extract_audio import extract_audio
    from src.activities.extract_frames import FrameData, extract_frames
    from src.activities.extract_insights import InsightResults, extract_insights
    from src.activities.save_results import SaveInput, save_results
    from src.activities.transcribe import TranscriptionResult, transcribe


@dataclass
class FieldMediaInput:
    media_type: str          # "video", "voice_memo", "text"
    storage_path: str        # Path in Supabase Storage
    listing_id: str          # Which listing this is for
    team_id: str             # Team context
    author_id: str           # Who captured it (team_member.id)
    author_name: str         # Display name
    metadata: dict           # Additional context (tags, duration, etc.)


@workflow.defn
class ProcessFieldMedia:
    @workflow.run
    async def run(self, input: FieldMediaInput) -> dict:
        if input.media_type == "video":
            return await self._process_video(input)
        elif input.media_type == "voice_memo":
            return await self._process_voice_memo(input)
        elif input.media_type == "text":
            return await self._process_text(input)
        else:
            raise ValueError(f"Unknown media_type: {input.media_type}")

    async def _process_video(self, input: FieldMediaInput) -> dict:
        # 1. Download
        download_result: DownloadResult = await workflow.execute_activity(
            download_media, input.storage_path,
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )

        # 2. Extract audio and frames in parallel
        audio_path: str = await workflow.execute_activity(
            extract_audio, download_result.local_path,
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=5),
        )

        frame_list: list[FrameData] = await workflow.execute_activity(
            extract_frames, download_result.local_path,
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(minutes=5),
        )

        # 3. Transcribe audio
        transcript: TranscriptionResult = await workflow.execute_activity(
            transcribe, audio_path,
            start_to_close_timeout=timedelta(minutes=15),
            heartbeat_timeout=timedelta(minutes=5),
        )

        # 4. Caption frames with transcript context
        captions: list[FrameCaption] = await workflow.execute_activity(
            caption_frames, args=[frame_list, transcript.segments],
            start_to_close_timeout=timedelta(minutes=20),
            heartbeat_timeout=timedelta(minutes=5),
        )

        # 5. Extract insights from enriched transcript
        caption_texts = [c.caption for c in captions]
        insights: InsightResults = await workflow.execute_activity(
            extract_insights, args=[transcript.full_text, caption_texts],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )

        # 6. Save results
        save_input = SaveInput(
            listing_id=input.listing_id,
            team_id=input.team_id,
            author_id=input.author_id,
            author_name=input.author_name,
            transcription=transcript.full_text,
            media_type=input.media_type,
            action_items=insights.action_items,
            observations=insights.observations,
            follow_ups=insights.follow_ups,
            frame_captions=[
                {"index": c.index, "timestamp": c.timestamp_seconds, "caption": c.caption}
                for c in captions
            ],
        )
        result = await workflow.execute_activity(
            save_results, save_input,
            start_to_close_timeout=timedelta(minutes=2),
        )
        return result

    async def _process_voice_memo(self, input: FieldMediaInput) -> dict:
        # 1. Download
        download_result: DownloadResult = await workflow.execute_activity(
            download_media, input.storage_path,
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )

        # 2. Transcribe (already audio, skip extraction)
        transcript: TranscriptionResult = await workflow.execute_activity(
            transcribe, download_result.local_path,
            start_to_close_timeout=timedelta(minutes=15),
            heartbeat_timeout=timedelta(minutes=5),
        )

        # 3. Extract insights
        insights: InsightResults = await workflow.execute_activity(
            extract_insights, args=[transcript.full_text, None],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )

        # 4. Save results
        save_input = SaveInput(
            listing_id=input.listing_id,
            team_id=input.team_id,
            author_id=input.author_id,
            author_name=input.author_name,
            transcription=transcript.full_text,
            media_type=input.media_type,
            action_items=insights.action_items,
            observations=insights.observations,
            follow_ups=insights.follow_ups,
        )
        result = await workflow.execute_activity(
            save_results, save_input,
            start_to_close_timeout=timedelta(minutes=2),
        )
        return result

    async def _process_text(self, input: FieldMediaInput) -> dict:
        # Text content is passed in metadata
        text = input.metadata.get("text", "")

        # 1. Extract insights directly
        insights: InsightResults = await workflow.execute_activity(
            extract_insights, args=[text, None],
            start_to_close_timeout=timedelta(minutes=5),
            heartbeat_timeout=timedelta(minutes=2),
        )

        # 2. Save results
        save_input = SaveInput(
            listing_id=input.listing_id,
            team_id=input.team_id,
            author_id=input.author_id,
            author_name=input.author_name,
            transcription=text,
            media_type=input.media_type,
            action_items=insights.action_items,
            observations=insights.observations,
            follow_ups=insights.follow_ups,
        )
        result = await workflow.execute_activity(
            save_results, save_input,
            start_to_close_timeout=timedelta(minutes=2),
        )
        return result
