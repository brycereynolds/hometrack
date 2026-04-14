# /// script
# requires-python = ">=3.11"
#
# [marimo]
# requirements = [
#     "marimo",
#     "anthropic>=0.40.0",
#     "openai>=1.0.0",
#     "pydantic>=2.0.0",
#     "python-dotenv>=1.0.0",
# ]
# ///

import marimo

__generated_with = "0.13.0"
app = marimo.App(width="medium", app_title="HomeTrack Field Notes Pipeline")


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell
def _(mo):
    mo.md(
        """
        # HomeTrack Field Notes Pipeline

        Process walkthrough videos into structured property insights.
        Upload a video, configure processing parameters, and extract
        action items, observations, decisions, and quote requests.
        """
    )
    return


# ---------------------------------------------------------------------------
# Imports & environment
# ---------------------------------------------------------------------------
@app.cell
def _():
    import base64
    import hashlib
    import json
    import os
    import subprocess
    import tempfile
    import time
    from pathlib import Path
    from typing import Literal

    from dotenv import load_dotenv
    from pydantic import BaseModel, Field

    # Load .env — check notebooks/ first, then hometrack root
    _notebook_dir = Path(__file__).resolve().parent
    _root_dir = _notebook_dir.parent
    load_dotenv(_notebook_dir / ".env")  # notebooks/.env (overrides)
    load_dotenv(_root_dir / ".env")      # hometrack/.env (fallback)

    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    CACHE_DIR = Path(tempfile.gettempdir()) / "hometrack_field_notes_cache"
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    return (
        ANTHROPIC_API_KEY,
        CACHE_DIR,
        Field,
        Literal,
        OPENAI_API_KEY,
        Path,
        base64,
        hashlib,
        json,
        os,
        subprocess,
        tempfile,
        time,
        BaseModel,
    )


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
@app.cell
def _(BaseModel, Field, Literal):
    class ActionItem(BaseModel):
        title: str
        category: Literal[
            "demolition",
            "flooring",
            "fixtures",
            "paint",
            "cleaning",
            "moving",
            "staging",
            "quoting",
            "general",
        ]
        priority: Literal["low", "medium", "high", "urgent"]
        description: str
        timestamp_start: float
        timestamp_end: float
        best_frame_timestamp: float | None = None
        needs_quote: bool = False
        estimated_vendor_category: str | None = None

    class PropertyObservation(BaseModel):
        description: str
        sentiment: Literal["positive", "concern", "neutral"]
        area: str
        timestamp: float
        best_frame_timestamp: float | None = None

    class Decision(BaseModel):
        description: str
        reasoning: str
        made_by: str
        timestamp: float

    class QuoteRequest(BaseModel):
        scope: str
        vendor_category: str
        urgency: Literal["low", "medium", "high"]
        related_action_items: list[str] = Field(default_factory=list)
        estimated_area: str = ""

    class QuestionRaised(BaseModel):
        question: str
        answered: bool = False
        answer: str | None = None
        timestamp: float = 0.0

    class NotableMoment(BaseModel):
        description: str
        timestamp: float
        category: str = ""
        best_frame_timestamp: float | None = None

    class FieldNoteInsights(BaseModel):
        summary: str
        property_address: str | None = None
        property_details: dict | None = None
        action_items: list[ActionItem] = Field(default_factory=list)
        observations: list[PropertyObservation] = Field(default_factory=list)
        decisions: list[Decision] = Field(default_factory=list)
        quotes_needed: list[QuoteRequest] = Field(default_factory=list)
        questions_raised: list[QuestionRaised] = Field(default_factory=list)
        notable_moments: list[NotableMoment] = Field(default_factory=list)

    return (
        ActionItem,
        Decision,
        FieldNoteInsights,
        NotableMoment,
        PropertyObservation,
        QuestionRaised,
        QuoteRequest,
    )


# ---------------------------------------------------------------------------
# UI: File upload & configuration
# ---------------------------------------------------------------------------
@app.cell
def _(mo):
    video_upload = mo.ui.file(
        filetypes=[".mp4", ".mov", ".avi", ".mkv", ".webm"],
        label="Upload walkthrough video",
    )
    video_upload
    return (video_upload,)


@app.cell
def _(mo):
    resolution_slider = mo.ui.slider(
        start=360, stop=1080, step=60, value=480, label="Downscale resolution (px)"
    )
    frame_interval_slider = mo.ui.slider(
        start=1, stop=30, step=1, value=5, label="Frame extraction interval (sec)"
    )
    scene_threshold_slider = mo.ui.slider(
        start=0.1, stop=0.9, step=0.05, value=0.3, label="Scene change threshold"
    )
    use_scene_detection = mo.ui.checkbox(value=False, label="Enable scene detection")

    config_stack = mo.vstack(
        [
            mo.md("### Processing Configuration"),
            mo.hstack([resolution_slider, frame_interval_slider]),
            mo.hstack([scene_threshold_slider, use_scene_detection]),
        ]
    )
    config_stack
    return (
        frame_interval_slider,
        resolution_slider,
        scene_threshold_slider,
        use_scene_detection,
    )


@app.cell
def _(mo):
    analysis_model = mo.ui.dropdown(
        options={
            "claude-haiku-4-5-20251001": "Haiku 4.5 (fast/cheap)",
            "claude-sonnet-4-6-20250514": "Sonnet 4.6 (balanced)",
            "claude-opus-4-6-20250514": "Opus 4.6 (best quality)",
        },
        value="claude-sonnet-4-6-20250514",
        label="Analysis model",
    )
    vision_model = mo.ui.dropdown(
        options={
            "claude-haiku-4-5-20251001": "Haiku 4.5 (fast/cheap)",
            "claude-sonnet-4-6-20250514": "Sonnet 4.6 (balanced)",
            "claude-opus-4-6-20250514": "Opus 4.6 (best quality)",
        },
        value="claude-haiku-4-5-20251001",
        label="Vision model (frame analysis)",
    )
    synthesis_model = mo.ui.dropdown(
        options={
            "claude-sonnet-4-6-20250514": "Sonnet 4.6 (balanced)",
            "claude-opus-4-6-20250514": "Opus 4.6 (best quality)",
        },
        value="claude-sonnet-4-6-20250514",
        label="Synthesis model (final insights)",
    )

    mo.vstack(
        [
            mo.md("### Model Selection"),
            mo.hstack([analysis_model, vision_model, synthesis_model]),
        ]
    )
    return analysis_model, synthesis_model, vision_model


# ---------------------------------------------------------------------------
# Stage 1: Video preprocessing (downscale + cache)
# ---------------------------------------------------------------------------
@app.cell
def _(CACHE_DIR, Path, hashlib, mo, resolution_slider, subprocess, video_upload):
    mo.stop(not video_upload.value, mo.md("*Upload a video to begin.*"))

    _raw_bytes = video_upload.value[0].contents
    _video_hash = hashlib.sha256(_raw_bytes[:64_000]).hexdigest()[:16]
    _res = resolution_slider.value

    # Write upload to temp file
    _upload_path = CACHE_DIR / f"upload_{_video_hash}.mp4"
    if not _upload_path.exists():
        _upload_path.write_bytes(_raw_bytes)

    # Downscale
    preprocessed_video_path = CACHE_DIR / f"preprocessed_{_video_hash}_{_res}p.mp4"
    if not preprocessed_video_path.exists():
        _cmd = [
            "ffmpeg", "-y", "-i", str(_upload_path),
            "-vf", f"scale=-2:{_res}",
            "-c:v", "libx264", "-preset", "fast", "-crf", "28",
            "-c:a", "aac", "-b:a", "64k",
            str(preprocessed_video_path),
        ]
        _result = subprocess.run(_cmd, capture_output=True, text=True)
        if _result.returncode != 0:
            mo.stop(True, mo.md(f"**ffmpeg error:** {_result.stderr[:500]}"))

    # Get video info
    _probe_cmd = [
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_format", "-show_streams", str(preprocessed_video_path),
    ]
    _probe = subprocess.run(_probe_cmd, capture_output=True, text=True)
    import json as _json
    _info = _json.loads(_probe.stdout)
    _duration = float(_info["format"]["duration"])
    _video_stream = next(
        (s for s in _info["streams"] if s["codec_type"] == "video"), {}
    )

    video_meta = {
        "duration": _duration,
        "width": int(_video_stream.get("width", 0)),
        "height": int(_video_stream.get("height", 0)),
        "hash": _video_hash,
    }

    mo.md(
        f"""
        ### Stage 1: Video Preprocessed

        | Property | Value |
        |----------|-------|
        | Duration | {_duration:.1f}s ({_duration/60:.1f} min) |
        | Resolution | {video_meta['width']}x{video_meta['height']} |
        | File | `{preprocessed_video_path.name}` |
        | Cache | `{CACHE_DIR}` |
        """
    )
    return preprocessed_video_path, video_meta


# ---------------------------------------------------------------------------
# Stage 2: Frame extraction
# ---------------------------------------------------------------------------
@app.cell
def _(
    CACHE_DIR,
    Path,
    base64,
    frame_interval_slider,
    mo,
    preprocessed_video_path,
    scene_threshold_slider,
    subprocess,
    use_scene_detection,
    video_meta,
):
    _interval = frame_interval_slider.value
    _hash = video_meta["hash"]
    _frames_dir = CACHE_DIR / f"frames_{_hash}_{_interval}s"
    _frames_dir.mkdir(exist_ok=True)

    # Interval-based extraction
    existing_frames = sorted(_frames_dir.glob("frame_*.jpg"))
    if not existing_frames:
        _cmd = [
            "ffmpeg", "-i", str(preprocessed_video_path),
            "-vf", f"fps=1/{_interval}",
            "-q:v", "4",
            str(_frames_dir / "frame_%05d.jpg"),
        ]
        subprocess.run(_cmd, capture_output=True, text=True)
        existing_frames = sorted(_frames_dir.glob("frame_*.jpg"))

    # Scene-detection extraction (optional)
    scene_frames = []
    if use_scene_detection.value:
        _scene_dir = CACHE_DIR / f"scenes_{_hash}"
        _scene_dir.mkdir(exist_ok=True)
        if not list(_scene_dir.glob("scene_*.jpg")):
            _threshold = scene_threshold_slider.value
            _cmd = [
                "ffmpeg", "-i", str(preprocessed_video_path),
                "-vf", f"select='gt(scene,{_threshold})',showinfo",
                "-vsync", "vfr",
                "-q:v", "4",
                str(_scene_dir / "scene_%05d.jpg"),
            ]
            subprocess.run(_cmd, capture_output=True, text=True)
        scene_frames = sorted(_scene_dir.glob("scene_*.jpg"))

    # Build frame list with timestamps
    all_frames = []
    for i, fp in enumerate(existing_frames):
        ts = i * _interval
        all_frames.append({
            "path": fp,
            "timestamp": ts,
            "source": "interval",
            "index": i,
        })
    for i, fp in enumerate(scene_frames):
        all_frames.append({
            "path": fp,
            "timestamp": None,  # scene frames don't have exact timestamps without parsing
            "source": "scene",
            "index": len(existing_frames) + i,
        })

    # Pre-encode frames as base64 for API calls
    frame_images = []
    for f in all_frames:
        _data = f["path"].read_bytes()
        f["base64"] = base64.b64encode(_data).decode("utf-8")
        frame_images.append(f)

    # Show sample frames
    _sample_indices = list(range(0, len(frame_images), max(1, len(frame_images) // 6)))[:6]
    _sample_html = ""
    for idx in _sample_indices:
        _f = frame_images[idx]
        _ts_label = f"{_f['timestamp']:.0f}s" if _f["timestamp"] is not None else "scene"
        _sample_html += f'<img src="data:image/jpeg;base64,{_f["base64"]}" style="max-width:180px;margin:4px;" title="{_ts_label}"><br><small>{_ts_label}</small>&nbsp;&nbsp;'

    mo.md(
        f"""
        ### Stage 2: Frames Extracted

        - **Interval frames:** {len(existing_frames)} (every {_interval}s)
        - **Scene frames:** {len(scene_frames)}
        - **Total frames:** {len(frame_images)}

        #### Sample frames
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
        {_sample_html}
        </div>
        """
    )
    return all_frames, frame_images


# ---------------------------------------------------------------------------
# Stage 3: Transcription (Whisper + optional speaker diarization)
# ---------------------------------------------------------------------------
@app.cell
def _(CACHE_DIR, OPENAI_API_KEY, json, mo, preprocessed_video_path, subprocess, video_meta):
    _hash = video_meta["hash"]
    _transcript_cache = CACHE_DIR / f"transcript_{_hash}.json"

    if _transcript_cache.exists():
        transcript_data = json.loads(_transcript_cache.read_text())
    else:
        mo.stop(
            not OPENAI_API_KEY,
            mo.md("**Set OPENAI_API_KEY in .env for Whisper transcription.**"),
        )

        # Extract audio
        _audio_path = CACHE_DIR / f"audio_{_hash}.mp3"
        if not _audio_path.exists():
            _cmd = [
                "ffmpeg", "-y", "-i", str(preprocessed_video_path),
                "-vn", "-acodec", "libmp3lame", "-b:a", "64k",
                str(_audio_path),
            ]
            subprocess.run(_cmd, capture_output=True, text=True)

        # Whisper API call (verbose JSON for word-level timestamps)
        from openai import OpenAI

        _client = OpenAI(api_key=OPENAI_API_KEY)
        with open(_audio_path, "rb") as _f:
            _response = _client.audio.transcriptions.create(
                model="whisper-1",
                file=_f,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        transcript_data = {
            "text": _response.text,
            "segments": [
                {
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text,
                }
                for seg in (_response.segments or [])
            ],
            "language": getattr(_response, "language", "en"),
        }

        _transcript_cache.write_text(json.dumps(transcript_data, indent=2))

    # Display transcript summary
    _seg_count = len(transcript_data.get("segments", []))
    _text_preview = transcript_data["text"][:600]

    mo.md(
        f"""
        ### Stage 3: Transcription

        - **Segments:** {_seg_count}
        - **Language:** {transcript_data.get('language', 'unknown')}

        > {_text_preview}{"..." if len(transcript_data["text"]) > 600 else ""}
        """
    )
    return (transcript_data,)


# ---------------------------------------------------------------------------
# Stage 4: Key moment analysis
# ---------------------------------------------------------------------------
@app.cell
def _(ANTHROPIC_API_KEY, CACHE_DIR, analysis_model, json, mo, transcript_data, video_meta):
    _hash = video_meta["hash"]
    _model = analysis_model.value
    _moments_cache = CACHE_DIR / f"moments_{_hash}_{_model}.json"

    if _moments_cache.exists():
        key_moments = json.loads(_moments_cache.read_text())
    else:
        mo.stop(
            not ANTHROPIC_API_KEY,
            mo.md("**Set ANTHROPIC_API_KEY in .env.**"),
        )

        import anthropic

        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        _segments_text = "\n".join(
            f"[{s['start']:.1f}s - {s['end']:.1f}s] {s['text']}"
            for s in transcript_data.get("segments", [])
        )

        _response = _client.messages.create(
            model=_model,
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are analyzing a transcript from a property walkthrough video for a real estate renovation company called HomeTrack.

Identify key moments in this walkthrough. For each moment, provide:
- timestamp_start and timestamp_end (in seconds)
- type: one of "action_item", "observation", "decision", "question", "notable"
- summary: brief description
- details: relevant context
- priority: "low", "medium", "high", or "urgent" (for action items)
- area: which part of the property (kitchen, bathroom, bedroom, exterior, etc.)

Focus on:
1. Repairs or work that needs to be done
2. Condition observations (good and bad)
3. Decisions made about the property
4. Questions raised during the walkthrough
5. Notable findings or concerns

Transcript:
{_segments_text}

Return a JSON array of moment objects. Return ONLY valid JSON, no markdown.""",
                }
            ],
        )

        _text = _response.content[0].text.strip()
        if _text.startswith("```"):
            _text = _text.split("\n", 1)[1].rsplit("```", 1)[0]
        key_moments = json.loads(_text)

        _moments_cache.write_text(json.dumps(key_moments, indent=2))

    mo.md(
        f"""
        ### Stage 4: Key Moments Identified

        Found **{len(key_moments)}** key moments in the walkthrough.

        | Time | Type | Area | Summary |
        |------|------|------|---------|
        """
        + "\n".join(
            f"| {m.get('timestamp_start', 0):.0f}s | {m.get('type', '')} | {m.get('area', '')} | {m.get('summary', '')[:60]} |"
            for m in key_moments[:15]
        )
        + ("\n| ... | ... | ... | ... |" if len(key_moments) > 15 else "")
    )
    return (key_moments,)


# ---------------------------------------------------------------------------
# Stage 5: Frame-moment correlation (vision model)
# ---------------------------------------------------------------------------
@app.cell
def _(
    ANTHROPIC_API_KEY,
    CACHE_DIR,
    frame_images,
    json,
    key_moments,
    mo,
    video_meta,
    vision_model,
):
    _hash = video_meta["hash"]
    _model = vision_model.value
    _corr_cache = CACHE_DIR / f"correlations_{_hash}_{_model}.json"

    if _corr_cache.exists():
        frame_correlations = json.loads(_corr_cache.read_text())
    else:
        mo.stop(
            not ANTHROPIC_API_KEY,
            mo.md("**Set ANTHROPIC_API_KEY in .env.**"),
        )

        import anthropic

        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        frame_correlations = []

        # For each key moment, find the best matching frame within a scrub window
        _scrub_window = 10  # seconds before/after the moment

        for _moment in key_moments:
            _ts = _moment.get("timestamp_start", 0)
            _candidates = [
                f for f in frame_images
                if f["timestamp"] is not None
                and abs(f["timestamp"] - _ts) <= _scrub_window
            ]

            if not _candidates:
                # Fall back to closest frame
                _timed = [f for f in frame_images if f["timestamp"] is not None]
                if _timed:
                    _candidates = [min(_timed, key=lambda f: abs(f["timestamp"] - _ts))]

            if not _candidates:
                frame_correlations.append({
                    "moment": _moment,
                    "best_frame_index": None,
                    "frame_description": "No frame available",
                    "relevance_score": 0,
                })
                continue

            # Send candidate frames to vision model for ranking
            _image_content = []
            for _cf in _candidates[:5]:  # max 5 candidates per moment
                _image_content.extend([
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": _cf["base64"],
                        },
                    },
                    {
                        "type": "text",
                        "text": f"Frame index {_cf['index']} at {_cf['timestamp']}s",
                    },
                ])

            _image_content.append({
                "type": "text",
                "text": f"""Which frame best captures this moment from a property walkthrough?

Moment: {_moment.get('summary', '')}
Type: {_moment.get('type', '')}
Area: {_moment.get('area', '')}

Respond with JSON: {{"best_frame_index": <index>, "description": "<what you see>", "relevance_score": <1-10>}}
Return ONLY valid JSON.""",
            })

            _response = _client.messages.create(
                model=_model,
                max_tokens=500,
                messages=[{"role": "user", "content": _image_content}],
            )

            _text = _response.content[0].text.strip()
            if _text.startswith("```"):
                _text = _text.split("\n", 1)[1].rsplit("```", 1)[0]
            try:
                _result = json.loads(_text)
            except json.JSONDecodeError:
                _result = {
                    "best_frame_index": _candidates[0]["index"],
                    "description": "Parse error",
                    "relevance_score": 1,
                }

            frame_correlations.append({
                "moment": _moment,
                "best_frame_index": _result.get("best_frame_index"),
                "frame_description": _result.get("description", ""),
                "relevance_score": _result.get("relevance_score", 0),
            })

        _corr_cache.write_text(json.dumps(frame_correlations, indent=2))

    # Rank frames by relevance
    ranked_frames = sorted(
        [c for c in frame_correlations if c["best_frame_index"] is not None],
        key=lambda c: c.get("relevance_score", 0),
        reverse=True,
    )

    mo.md(
        f"""
        ### Stage 5: Frame-Moment Correlation

        Correlated **{len(frame_correlations)}** moments with frames.
        Top-ranked frames by relevance:

        | Score | Moment | Frame Description |
        |-------|--------|-------------------|
        """
        + "\n".join(
            f"| {r.get('relevance_score', 0)} | {r['moment'].get('summary', '')[:40]} | {r.get('frame_description', '')[:50]} |"
            for r in ranked_frames[:10]
        )
    )
    return frame_correlations, ranked_frames


# ---------------------------------------------------------------------------
# Stage 6: Enriched transcript generation
# ---------------------------------------------------------------------------
@app.cell
def _(
    ANTHROPIC_API_KEY,
    CACHE_DIR,
    analysis_model,
    frame_correlations,
    json,
    mo,
    transcript_data,
    video_meta,
):
    _hash = video_meta["hash"]
    _model = analysis_model.value
    _enriched_cache = CACHE_DIR / f"enriched_{_hash}_{_model}.json"

    if _enriched_cache.exists():
        enriched_transcript = json.loads(_enriched_cache.read_text())
    else:
        mo.stop(
            not ANTHROPIC_API_KEY,
            mo.md("**Set ANTHROPIC_API_KEY in .env.**"),
        )

        import anthropic

        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        # Build context from correlations
        _visual_context = "\n".join(
            f"[{c['moment'].get('timestamp_start', 0):.0f}s] "
            f"Visual: {c.get('frame_description', 'N/A')} | "
            f"Moment: {c['moment'].get('summary', '')}"
            for c in frame_correlations
        )

        _segments_text = "\n".join(
            f"[{s['start']:.1f}s] {s['text']}"
            for s in transcript_data.get("segments", [])
        )

        _response = _client.messages.create(
            model=_model,
            max_tokens=8192,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are creating an enriched transcript of a property walkthrough for HomeTrack, a real estate renovation company.

Combine the speech transcript with visual observations to create a rich, timestamped narrative.

For each section, include:
- timestamp (seconds)
- speaker text (from transcript)
- visual_context (what the camera shows)
- area (which part of the property)
- annotations (action items, observations, or decisions noted)

Original transcript:
{_segments_text}

Visual observations from frame analysis:
{_visual_context}

Return a JSON object with:
- "sections": array of enriched sections
- "speakers": identified speakers and their roles if apparent
- "property_flow": order of areas visited

Return ONLY valid JSON.""",
                }
            ],
        )

        _text = _response.content[0].text.strip()
        if _text.startswith("```"):
            _text = _text.split("\n", 1)[1].rsplit("```", 1)[0]
        enriched_transcript = json.loads(_text)

        _enriched_cache.write_text(json.dumps(enriched_transcript, indent=2))

    _section_count = len(enriched_transcript.get("sections", []))
    _speakers = enriched_transcript.get("speakers", [])
    _flow = enriched_transcript.get("property_flow", [])

    mo.md(
        f"""
        ### Stage 6: Enriched Transcript

        - **Sections:** {_section_count}
        - **Speakers:** {', '.join(str(s) for s in _speakers) if _speakers else 'Unknown'}
        - **Property flow:** {' -> '.join(str(a) for a in _flow) if _flow else 'N/A'}
        """
    )
    return (enriched_transcript,)


# ---------------------------------------------------------------------------
# Stage 7: HomeTrack insight synthesis
# ---------------------------------------------------------------------------
@app.cell
def _(
    ANTHROPIC_API_KEY,
    CACHE_DIR,
    FieldNoteInsights,
    enriched_transcript,
    frame_correlations,
    json,
    key_moments,
    mo,
    synthesis_model,
    transcript_data,
    video_meta,
):
    _hash = video_meta["hash"]
    _model = synthesis_model.value
    _insights_cache = CACHE_DIR / f"insights_{_hash}_{_model}.json"

    if _insights_cache.exists():
        _raw = json.loads(_insights_cache.read_text())
        insights = FieldNoteInsights.model_validate(_raw)
    else:
        mo.stop(
            not ANTHROPIC_API_KEY,
            mo.md("**Set ANTHROPIC_API_KEY in .env.**"),
        )

        import anthropic

        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        _schema = FieldNoteInsights.model_json_schema()

        _context = json.dumps(
            {
                "transcript": transcript_data["text"],
                "key_moments": key_moments,
                "enriched_sections": enriched_transcript.get("sections", []),
                "visual_correlations": [
                    {
                        "timestamp": c["moment"].get("timestamp_start", 0),
                        "summary": c["moment"].get("summary", ""),
                        "visual": c.get("frame_description", ""),
                    }
                    for c in frame_correlations
                ],
            },
            indent=2,
        )

        _response = _client.messages.create(
            model=_model,
            max_tokens=8192,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are the insight synthesis engine for HomeTrack, a real estate renovation company.

Analyze this property walkthrough data and produce structured insights.

Your output MUST conform exactly to this JSON schema:
{json.dumps(_schema, indent=2)}

Focus on extracting:
1. **Action items** — Every repair, task, or piece of work mentioned. Categorize by trade (demolition, flooring, fixtures, paint, cleaning, moving, staging, quoting, general). Set needs_quote=true for anything requiring a vendor.
2. **Property observations** — Condition notes, both positive and concerning. Note the area of the property.
3. **Decisions** — Any decisions made during the walkthrough, with reasoning.
4. **Quotes needed** — Aggregate vendor work that needs pricing. Group by vendor category.
5. **Questions** — Both answered and unanswered questions from the walkthrough.
6. **Notable moments** — Anything else significant.

Include timestamps (in seconds) for all items where available.
If a property address or details (beds, baths, sqft) are mentioned, capture them.

Walkthrough data:
{_context}

Return ONLY valid JSON matching the schema. No markdown.""",
                }
            ],
        )

        _text = _response.content[0].text.strip()
        if _text.startswith("```"):
            _text = _text.split("\n", 1)[1].rsplit("```", 1)[0]

        _raw = json.loads(_text)
        insights = FieldNoteInsights.model_validate(_raw)

        _insights_cache.write_text(json.dumps(_raw, indent=2))

    mo.md(
        f"""
        ### Stage 7: HomeTrack Insights

        **Summary:** {insights.summary}

        **Property:** {insights.property_address or 'Not identified'}
        """
    )
    return (insights,)


# ---------------------------------------------------------------------------
# Results display
# ---------------------------------------------------------------------------
@app.cell
def _(insights, mo):
    # Action items table
    _action_rows = "\n".join(
        f"| {a.priority} | {a.category} | {a.title} | {'Yes' if a.needs_quote else 'No'} | {a.estimated_vendor_category or '-'} |"
        for a in insights.action_items
    )

    mo.md(
        f"""
        ## Action Items ({len(insights.action_items)})

        | Priority | Category | Title | Needs Quote | Vendor |
        |----------|----------|-------|-------------|--------|
        {_action_rows}
        """
    )
    return


@app.cell
def _(insights, mo):
    _obs_rows = "\n".join(
        f"| {o.sentiment} | {o.area} | {o.description[:80]} |"
        for o in insights.observations
    )

    mo.md(
        f"""
        ## Observations ({len(insights.observations)})

        | Sentiment | Area | Description |
        |-----------|------|-------------|
        {_obs_rows}
        """
    )
    return


@app.cell
def _(insights, mo):
    _dec_rows = "\n".join(
        f"| {d.made_by} | {d.description[:60]} | {d.reasoning[:60]} |"
        for d in insights.decisions
    )

    mo.md(
        f"""
        ## Decisions ({len(insights.decisions)})

        | Made By | Decision | Reasoning |
        |---------|----------|-----------|
        {_dec_rows}
        """
    )
    return


@app.cell
def _(insights, mo):
    _quote_rows = "\n".join(
        f"| {q.vendor_category} | {q.urgency} | {q.scope[:60]} | {q.estimated_area} |"
        for q in insights.quotes_needed
    )

    mo.md(
        f"""
        ## Quotes Needed ({len(insights.quotes_needed)})

        | Vendor | Urgency | Scope | Area |
        |--------|---------|-------|------|
        {_quote_rows}
        """
    )
    return


@app.cell
def _(insights, mo):
    _q_rows = "\n".join(
        f"| {'Answered' if q.answered else 'Open'} | {q.question} | {q.answer or '-'} |"
        for q in insights.questions_raised
    )

    mo.md(
        f"""
        ## Questions ({len(insights.questions_raised)})

        | Status | Question | Answer |
        |--------|----------|--------|
        {_q_rows}
        """
    )
    return


# ---------------------------------------------------------------------------
# Export to JSON
# ---------------------------------------------------------------------------
@app.cell
def _(insights, json, mo):
    _export_data = insights.model_dump(mode="json")
    _export_json = json.dumps(_export_data, indent=2)

    export_download = mo.download(
        data=_export_json.encode("utf-8"),
        filename="field_notes_insights.json",
        mimetype="application/json",
        label="Download Insights JSON",
    )

    mo.vstack([
        mo.md("## Export"),
        export_download,
        mo.accordion({"Raw JSON": mo.md(f"```json\n{_export_json}\n```")}),
    ])
    return


if __name__ == "__main__":
    app.run()
