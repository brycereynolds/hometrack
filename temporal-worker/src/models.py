from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


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
    category: str  # topic_change, observation, decision, action_item, condition_note, visual_reference
    description: str
    transcript_context: str
    importance: str = "medium"  # low, medium, high
    # Correlation fields (populated after correlate_frames stage)
    best_frame_index: int | None = None
    best_frame_timestamp: float | None = None
    ranked_frames: list[RankedFrame] | None = None
    scrub_start: float | None = None
    scrub_end: float | None = None
    enriched_caption: str | None = None
    speech_visual_relationship: str | None = None
    visual_description: str | None = None


class RankedFrame(BaseModel):
    timestamp: float
    rank: int
    relevance: float


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
    enriched_caption: str | None = None
    visual_description: str | None = None
    best_frame_matches: bool = True


class ActionItem(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"  # low, medium, high, urgent
    category: str = "general"  # demolition, flooring, fixtures, paint, cleaning, moving, staging, quoting, general
    quote_needed: bool = False
    estimated_vendor_category: str | None = None  # handyman, flooring, electrician, etc.
    source_timestamp: float | None = None
    source_quote: str = ""
    extraction_confidence: float | None = None


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


class ActionMomentLink(BaseModel):
    action_index: int
    moment_indices: list[int]
    relevance: str = ""


class LinkActionsToMomentsInput(BaseModel):
    moments: list[dict]
    action_items: list[dict]


class LinkActionsToMomentsOutput(BaseModel):
    links: list[ActionMomentLink] = Field(default_factory=list)


class MarketAnalysisInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    listing_id: str = Field(alias="listingId")
    analysis_id: str = Field(alias="analysisId")
    address: str
    lat: float | None = None
    lng: float | None = None
    beds: int | None = None
    baths: float | None = None
    sqft: int | None = None
    property_type: str = Field(default="single_family", alias="propertyType")
    year_built: int | None = Field(default=None, alias="yearBuilt")
    search_params: dict = Field(default_factory=dict, alias="searchParams")


class CompListing(BaseModel):
    external_id: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    zip: str = ""
    price: float | None = None
    price_per_sqft: float | None = None
    beds: int | None = None
    baths: float | None = None
    sqft: int | None = None
    lot_sqft: int | None = None
    year_built: int | None = None
    sold_date: str | None = None
    days_on_market: int | None = None
    status: str = ""
    distance_miles: float | None = None
    lat: float | None = None
    lng: float | None = None
    photo_url: str | None = None


class MarketAnalysisResult(BaseModel):
    suggested_low: float | None = None
    suggested_high: float | None = None
    confidence: float = 0.0
    confidence_factors: dict = Field(default_factory=dict)
    reasoning: str = ""
    stats: dict = Field(default_factory=dict)
    strategy: dict = Field(default_factory=dict)
    key_factors: dict = Field(default_factory=dict)
    market_trend: str = "unknown"
    outliers: list[str] = Field(default_factory=list)
    computed_stats: dict = Field(default_factory=dict)


class DocumentLineItem(BaseModel):
    description: str
    quantity: float | None = None
    unit_price: float | None = None
    amount: float | None = None


class DocumentExtractionResult(BaseModel):
    document_type: str  # receipt, invoice, quote, inspection, permit, other
    vendor_name: str | None = None
    date: str | None = None
    line_items: list[DocumentLineItem] = Field(default_factory=list)
    total_amount: float | None = None
    raw_text: str | None = None
    confidence: float = 0.0


class ExtractDocumentDataInput(BaseModel):
    storage_path: str
    content_type: str
    workflow_id: str


class FieldMediaInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    media_type: str = Field(alias="mediaType")
    storage_path: str = Field(alias="storagePath")
    listing_id: str = Field(alias="listingId")
    team_id: str = Field(alias="teamId")
    author_id: str = Field(alias="authorId")
    author_name: str = Field(alias="authorName")
    content_hash: str = Field(default="", alias="contentHash")
    metadata: dict = Field(default_factory=dict)


class ProcessingResult(BaseModel):
    field_note_id: str
    listing_id: str
    media_type: str
    tasks_created: list[str] = Field(default_factory=list)
    activity_items_created: list[str] = Field(default_factory=list)
    storage_paths: dict = Field(default_factory=dict)
    transcript_id: str | None = None
    frame_ids: list[str] = Field(default_factory=list)
    moment_ids: list[str] = Field(default_factory=list)
    action_ids: list[str] = Field(default_factory=list)
