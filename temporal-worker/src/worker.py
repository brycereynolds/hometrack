import asyncio
import signal

from temporalio.client import Client
from temporalio.worker import Worker

from src.activities.analyze_key_moments import analyze_key_moments
from src.activities.caption_frames import correlate_frames
from src.activities.download_media import download_media
from src.activities.extract_audio import extract_audio
from src.activities.extract_frames import extract_frames
from src.activities.extract_insights import extract_insights
from src.activities.generate_enriched_transcript import generate_enriched_transcript
from src.activities.save_results import save_results
from src.activities.transcribe import transcribe
from src.config import (
    TASK_QUEUE,
    TEMPORAL_ADDRESS,
    TEMPORAL_API_KEY,
    TEMPORAL_NAMESPACE,
    logger,
)
from src.db import close_pool
from src.workflows.process_field_media import ProcessFieldMedia


async def main() -> None:
    logger.info("Connecting to Temporal Cloud at %s (namespace: %s)", TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE)

    client = await Client.connect(
        target_host=TEMPORAL_ADDRESS,
        namespace=TEMPORAL_NAMESPACE,
        api_key=TEMPORAL_API_KEY,
        tls=True,
    )

    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[ProcessFieldMedia],
        activities=[
            download_media,
            extract_audio,
            extract_frames,
            transcribe,
            analyze_key_moments,
            correlate_frames,
            extract_insights,
            generate_enriched_transcript,
            save_results,
        ],
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
        await shutdown_event.wait()

    await close_pool()
    logger.info("Worker shut down")


if __name__ == "__main__":
    asyncio.run(main())
