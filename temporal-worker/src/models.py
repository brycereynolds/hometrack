from __future__ import annotations

from pydantic import BaseModel, Field


class ExtractedFrame(BaseModel):
    index: int
    timestamp_seconds: float
    path: str
    base64_jpeg: str


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str
    speaker: str | None = None


class KeyMoment(BaseModel):
    timestamp: float
    end_timestamp: float | None = None
    category: str  # visual_reference, observation, decision, action_item, topic_change
    description: str
    transcript_context: str
    importance: str = "medium"  # low, medium, high


class CorrelatedFrame(BaseModel):
    frame_index: int
    timestamp_seconds: float
    relevance_score: float
    caption: str
    speech_visual_relationship: str
    storage_path: str | None = None


class FrameCorrelation(BaseModel):
    moment_index: int
    moment_description: str
    moment_timestamp: float
    ranked_frames: list[CorrelatedFrame]
    scrub_window_start: float
    scrub_window_end: float


class ActionItem(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"  # low, medium, high, urgent
    category: str = "general"  # improvements, staging, media, marketing, disclosures, general
    quote_needed: bool = False
    source_timestamp: float | None = None
    source_quote: str = ""


class PropertyObservation(BaseModel):
    content: str
    observation_type: str = "neutral"  # positive, concern, neutral
    area: str = ""  # kitchen, bathroom, exterior, etc.
    source_timestamp: float | None = None


class Decision(BaseModel):
    content: str
    decided_by: str = ""
    source_timestamp: float | None = None


class QuoteRequest(BaseModel):
    description: str
    trade: str = ""  # plumber, electrician, painter, etc.
    priority: str = "medium"
    source_quote: str = ""


class QuestionRaised(BaseModel):
    content: str
    directed_to: str = ""
    source_timestamp: float | None = None


class FieldNoteInsights(BaseModel):
    action_items: list[ActionItem] = Field(default_factory=list)
    observations: list[PropertyObservation] = Field(default_factory=list)
    decisions: list[Decision] = Field(default_factory=list)
    quotes_needed: list[QuoteRequest] = Field(default_factory=list)
    questions_raised: list[QuestionRaised] = Field(default_factory=list)
    summary: str = ""


class FieldMediaInput(BaseModel):
    media_type: str          # "video", "voice_memo", "text"
    storage_path: str        # Path in Supabase Storage
    listing_id: str          # Which listing this is for
    team_id: str             # Team context
    author_id: str           # Who captured it (team_member.id)
    author_name: str         # Display name
    metadata: dict = Field(default_factory=dict)


class ProcessingResult(BaseModel):
    listing_id: str
    media_type: str
    tasks_created: list[str] = Field(default_factory=list)
    activity_items_created: list[str] = Field(default_factory=list)
    storage_paths: dict = Field(default_factory=dict)
    processing_record_id: str | None = None
