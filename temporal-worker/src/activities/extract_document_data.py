import base64
import json
import os
import tempfile

from temporalio import activity

from src.config import get_anthropic_client, logger
from src.models import DocumentExtractionResult
from src.storage import download_from_storage

EXTRACTION_PROMPT = """\
You are analyzing a document image from a real estate field visit. \
Extract all structured data you can find.

Identify the document type and extract:

1. DOCUMENT TYPE: One of: receipt, invoice, quote, inspection, permit, other
2. VENDOR/COMPANY NAME: The business or person who issued the document
3. DATE: The date on the document (ISO format YYYY-MM-DD if possible)
4. LINE ITEMS: Each item/service listed with:
   - description: What the item or service is
   - quantity: Number of units (null if not listed)
   - unit_price: Price per unit (null if not listed)
   - amount: Total for this line (null if not listed)
5. TOTAL AMOUNT: The final total on the document
6. RAW TEXT: All readable text from the document, preserving layout
7. CONFIDENCE: 0.0-1.0 how readable/clear the document is

Return as JSON:
{{
  "document_type": "receipt",
  "vendor_name": "ABC Plumbing",
  "date": "2025-03-15",
  "line_items": [
    {{"description": "Kitchen faucet replacement", "quantity": 1, "unit_price": 250.00, "amount": 250.00}}
  ],
  "total_amount": 250.00,
  "raw_text": "...",
  "confidence": 0.9
}}

If the image is NOT a document (e.g. a property photo with no text), return:
{{
  "document_type": "other",
  "vendor_name": null,
  "date": null,
  "line_items": [],
  "total_amount": null,
  "raw_text": null,
  "confidence": 0.0
}}

Only return the JSON object, no other text."""


def _is_pdf(content_type: str, storage_path: str) -> bool:
    return content_type == "application/pdf" or storage_path.lower().endswith(".pdf")


def _image_media_type(content_type: str, storage_path: str) -> str:
    """Return a valid media type for the Anthropic vision API."""
    ext = os.path.splitext(storage_path)[1].lower()
    mapping = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".heic": "image/jpeg",  # will be converted
    }
    if content_type in ("image/jpeg", "image/png", "image/gif", "image/webp"):
        return content_type
    return mapping.get(ext, "image/jpeg")


async def _download_file(storage_path: str) -> tuple[str, bytes]:
    """Download file from storage and return (local_path, raw_bytes)."""
    ext = os.path.splitext(storage_path)[1] or ".bin"
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    tmp.close()
    await download_from_storage("field-media", storage_path, tmp.name)
    with open(tmp.name, "rb") as f:
        data = f.read()
    return tmp.name, data


@activity.defn
async def extract_document_data(
    storage_path: str,
    content_type: str,
    workflow_id: str,
) -> dict:
    """Extract structured document data from a photo or PDF using Claude vision."""
    activity.heartbeat("downloading file")

    local_path, file_bytes = await _download_file(storage_path)

    try:
        if _is_pdf(content_type, storage_path):
            result = await _extract_from_pdf(file_bytes, workflow_id)
        else:
            media_type = _image_media_type(content_type, storage_path)
            # Convert HEIC to JPEG if needed
            if storage_path.lower().endswith(".heic"):
                file_bytes = _convert_heic_to_jpeg(local_path)
                media_type = "image/jpeg"
            result = await _extract_from_image(file_bytes, media_type)
    finally:
        try:
            os.unlink(local_path)
        except OSError:
            pass

    logger.info(
        "Document extraction: type=%s vendor=%s total=%s items=%d confidence=%.2f",
        result.document_type,
        result.vendor_name,
        result.total_amount,
        len(result.line_items),
        result.confidence,
    )

    return result.model_dump()


def _convert_heic_to_jpeg(heic_path: str) -> bytes:
    """Convert HEIC to JPEG using sips (macOS) or ImageMagick."""
    import subprocess

    jpeg_path = heic_path + ".jpg"
    # Try sips first (macOS native)
    result = subprocess.run(
        ["sips", "-s", "format", "jpeg", heic_path, "--out", jpeg_path],
        capture_output=True,
    )
    if result.returncode != 0:
        # Try ImageMagick convert
        result = subprocess.run(
            ["convert", heic_path, jpeg_path],
            capture_output=True,
        )
    if result.returncode != 0:
        # Fallback: just read the raw bytes and hope Claude handles it
        with open(heic_path, "rb") as f:
            return f.read()

    with open(jpeg_path, "rb") as f:
        data = f.read()
    try:
        os.unlink(jpeg_path)
    except OSError:
        pass
    return data


async def _extract_from_image(image_bytes: bytes, media_type: str) -> DocumentExtractionResult:
    """Send a single image to Claude vision for extraction."""
    activity.heartbeat("extracting from image")

    b64 = base64.standard_b64encode(image_bytes).decode("ascii")

    client = get_anthropic_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": EXTRACTION_PROMPT,
                    },
                ],
            },
        ],
    )

    return _parse_response(message.content[0].text)


async def _extract_from_pdf(pdf_bytes: bytes, workflow_id: str) -> DocumentExtractionResult:
    """Extract data from a PDF by sending pages as images to Claude."""
    activity.heartbeat("extracting from PDF")

    # Try to extract text first for context
    extracted_text = _extract_pdf_text(pdf_bytes)

    # Convert first pages to images for vision
    page_images = _pdf_to_images(pdf_bytes, max_pages=5)

    if not page_images:
        # No image conversion available; use text-only extraction
        if extracted_text:
            return await _extract_from_text(extracted_text)
        return DocumentExtractionResult(document_type="other", confidence=0.0)

    content: list[dict] = []
    for i, (img_bytes, img_type) in enumerate(page_images):
        b64 = base64.standard_b64encode(img_bytes).decode("ascii")
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": img_type,
                "data": b64,
            },
        })

    if extracted_text:
        content.append({
            "type": "text",
            "text": f"EXTRACTED TEXT FROM PDF (for reference):\n{extracted_text[:3000]}",
        })

    content.append({
        "type": "text",
        "text": EXTRACTION_PROMPT,
    })

    client = get_anthropic_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[{"role": "user", "content": content}],
    )

    return _parse_response(message.content[0].text)


async def _extract_from_text(text: str) -> DocumentExtractionResult:
    """Fallback: extract from raw text only (no vision)."""
    client = get_anthropic_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": f"DOCUMENT TEXT:\n{text[:4000]}\n\n{EXTRACTION_PROMPT}",
            },
        ],
    )
    return _parse_response(message.content[0].text)


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    """Try to extract text from PDF using available libraries."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages = []
        for page in doc:
            pages.append(page.get_text())
        doc.close()
        return "\n\n".join(pages).strip()
    except ImportError:
        pass

    try:
        import pypdf

        import io
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages).strip()
    except ImportError:
        pass

    return ""


def _pdf_to_images(pdf_bytes: bytes, max_pages: int = 5) -> list[tuple[bytes, str]]:
    """Convert PDF pages to JPEG images. Returns list of (image_bytes, media_type)."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        images = []
        for i, page in enumerate(doc):
            if i >= max_pages:
                break
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("jpeg")
            images.append((img_bytes, "image/jpeg"))
        doc.close()
        return images
    except ImportError:
        pass

    return []


def _parse_response(raw: str) -> DocumentExtractionResult:
    """Parse Claude's JSON response into a DocumentExtractionResult."""
    raw = raw.strip()

    # Handle markdown code blocks
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        data = json.loads(raw)
        return DocumentExtractionResult(**data)
    except (json.JSONDecodeError, Exception) as e:
        logger.error("Failed to parse document extraction: %s — raw: %s", e, raw[:200])
        return DocumentExtractionResult(document_type="other", confidence=0.0)
