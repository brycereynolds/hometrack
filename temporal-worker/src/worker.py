import asyncio
import signal
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import json

from temporalio.client import Client
from temporalio.worker import Worker

from src.activities.analyze_key_moments import analyze_key_moments
from src.activities.analyze_market import analyze_market
from src.activities.caption_frames import correlate_frames
from src.activities.download_media import download_media
from src.activities.extract_audio import extract_audio
from src.activities.extract_frames import extract_frames
from src.activities.extract_insights import extract_insights
from src.activities.geocode_address import geocode_address
from src.activities.generate_enriched_transcript import generate_enriched_transcript
from src.activities.save_analysis_results import save_analysis_results
from src.activities.save_results import save_results
from src.activities.search_comps import search_comps
from src.activities.transcribe import transcribe
from src.config import (
    TASK_QUEUE,
    TEMPORAL_ADDRESS,
    TEMPORAL_API_KEY,
    TEMPORAL_NAMESPACE,
    logger,
)
from src.db import close_pool
from src.workflows.market_analysis import MarketAnalysis
from src.workflows.process_field_media import ProcessFieldMedia

# Health check state
_worker_healthy = False
_worker_started_at: str | None = None

ACTIVITIES = [
    download_media,
    extract_audio,
    extract_frames,
    transcribe,
    analyze_key_moments,
    correlate_frames,
    extract_insights,
    generate_enriched_transcript,
    save_results,
    # Market analysis activities
    geocode_address,
    search_comps,
    analyze_market,
    save_analysis_results,
]


class HealthHandler(BaseHTTPRequestHandler):
    """Simple health check endpoint for Railway/monitoring."""

    def do_GET(self) -> None:
        if self.path == "/health":
            status = 200 if _worker_healthy else 503
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "healthy" if _worker_healthy else "starting",
                "worker": "field-media-processing",
                "namespace": TEMPORAL_NAMESPACE,
                "task_queue": TASK_QUEUE,
                "activities": [a.__name__ for a in ACTIVITIES],
                "started_at": _worker_started_at,
            }).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        # Suppress default access logs
        pass


def start_health_server(port: int = 8080) -> HTTPServer:
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logger.info("Health check server started on port %d", port)
    return server


async def main() -> None:
    global _worker_healthy, _worker_started_at

    # Start health check server
    health_server = start_health_server()

    logger.info("Connecting to Temporal Cloud at %s (namespace: %s)", TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE)

    client = await Client.connect(
        target_host=TEMPORAL_ADDRESS,
        namespace=TEMPORAL_NAMESPACE,
        api_key=TEMPORAL_API_KEY,
        tls=True,
    )

    logger.info("Connected to Temporal Cloud")
    logger.info("Registering workflows: ProcessFieldMedia, MarketAnalysis")
    logger.info("Registering %d activities: %s", len(ACTIVITIES), ", ".join(a.__name__ for a in ACTIVITIES))

    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[ProcessFieldMedia, MarketAnalysis],
        activities=ACTIVITIES,
    )

    shutdown_event = asyncio.Event()

    def handle_signal() -> None:
        logger.info("Shutdown signal received")
        shutdown_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, handle_signal)

    logger.info("Starting worker on task queue: %s", TASK_QUEUE)

    async with worker:
        from datetime import datetime, timezone
        _worker_started_at = datetime.now(timezone.utc).isoformat()
        _worker_healthy = True
        logger.info("Worker is ready and polling for tasks")
        await shutdown_event.wait()

    _worker_healthy = False
    health_server.shutdown()
    await close_pool()
    logger.info("Worker shut down cleanly")


if __name__ == "__main__":
    asyncio.run(main())
