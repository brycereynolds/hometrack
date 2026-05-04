import json

from temporalio import activity

from src.config import logger
from src.db import get_pool


@activity.defn
async def update_processing_stage(field_note_id: str, stage: str, status: str = "active") -> None:
    """Update the processing_stages jsonb column on a field note.

    stage: e.g. "download", "extract_frames", "transcribe", "analyze", "correlate", "insights", "saving"
    status: "active" (in progress), "completed", or "failed"
    """
    if not field_note_id:
        return

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Read current stages
        row = await conn.fetchrow(
            "SELECT processing_stages FROM field_notes WHERE id = $1", field_note_id
        )
        if not row:
            return

        stages = json.loads(row["processing_stages"]) if row["processing_stages"] else {}
        stages[stage] = status

        await conn.execute(
            "UPDATE field_notes SET processing_stages = $1::jsonb, status = 'processing', updated_at = now() WHERE id = $2",
            json.dumps(stages),
            field_note_id,
        )
    logger.info("Stage update: %s → %s (%s)", field_note_id[:8], stage, status)
