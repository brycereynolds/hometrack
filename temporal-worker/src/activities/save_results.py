import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from temporalio import activity

from src.config import logger
from src.db import get_pool


@dataclass
class SaveInput:
    listing_id: str
    team_id: str
    author_id: str
    author_name: str
    transcription: str | None
    media_type: str
    action_items: list[dict]
    observations: list[dict]
    follow_ups: list[dict]
    frame_captions: list[dict] | None = None


@activity.defn
async def save_results(input: SaveInput) -> dict:
    """Write extracted insights back to Postgres."""
    activity.heartbeat("saving results")

    pool = await get_pool()
    now = datetime.now(timezone.utc)
    created_ids: dict[str, list[str]] = {"tasks": [], "activity_items": []}

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Save transcription as activity_item
            if input.transcription:
                item_id = str(uuid.uuid4())
                activity_type = "voice_memo" if input.media_type in ("video", "voice_memo") else "note"
                metadata = None
                if input.frame_captions:
                    import json
                    metadata = json.dumps({"frame_captions": input.frame_captions})

                await conn.execute(
                    """INSERT INTO activity_items (id, team_id, listing_id, type, author_id, author_name, content, metadata, timestamp, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $9, $9)""",
                    item_id, input.team_id, input.listing_id, activity_type,
                    input.author_id, input.author_name, input.transcription,
                    metadata, now,
                )
                created_ids["activity_items"].append(item_id)

            # Save action items as tasks
            for item in input.action_items:
                task_id = str(uuid.uuid4())
                priority = item.get("priority", "medium")
                if priority not in ("low", "medium", "high", "urgent"):
                    priority = "medium"
                category = item.get("category", "general")
                if category not in ("onboarding", "improvements", "disclosures", "staging", "media", "pricing", "marketing", "showings", "offers", "escrow", "general"):
                    category = "general"

                await conn.execute(
                    """INSERT INTO tasks (id, team_id, listing_id, title, status, priority, assignee_id, task_category, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7, $8, $8)""",
                    task_id, input.team_id, input.listing_id, item["title"],
                    priority, input.author_id, category, now,
                )
                created_ids["tasks"].append(task_id)

            # Save observations as activity_items (type='note')
            for obs in input.observations:
                item_id = str(uuid.uuid4())
                import json
                metadata = json.dumps({"relevance": obs.get("relevance", ""), "source": "ai_extraction"})

                await conn.execute(
                    """INSERT INTO activity_items (id, team_id, listing_id, type, author_id, author_name, content, metadata, timestamp, created_at, updated_at)
                    VALUES ($1, $2, $3, 'note', $4, $5, $6, $7::jsonb, $8, $8, $8)""",
                    item_id, input.team_id, input.listing_id,
                    input.author_id, input.author_name, obs["content"],
                    metadata, now,
                )
                created_ids["activity_items"].append(item_id)

            # Save follow-ups as activity_items (type='note') with follow-up metadata
            for fu in input.follow_ups:
                item_id = str(uuid.uuid4())
                import json
                metadata = json.dumps({
                    "contact": fu.get("contact", ""),
                    "urgency": fu.get("urgency", ""),
                    "source": "ai_extraction",
                    "is_follow_up": True,
                })

                await conn.execute(
                    """INSERT INTO activity_items (id, team_id, listing_id, type, author_id, author_name, content, metadata, timestamp, created_at, updated_at)
                    VALUES ($1, $2, $3, 'note', $4, $5, $6, $7::jsonb, $8, $8, $8)""",
                    item_id, input.team_id, input.listing_id,
                    input.author_id, input.author_name, fu["content"],
                    metadata, now,
                )
                created_ids["activity_items"].append(item_id)

    logger.info(
        "Saved %d tasks and %d activity items for listing %s",
        len(created_ids["tasks"]), len(created_ids["activity_items"]), input.listing_id,
    )
    return created_ids
