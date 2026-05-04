import os
import logging

from dotenv import load_dotenv

load_dotenv()

# Temporal Cloud
TEMPORAL_API_KEY = os.environ["TEMPORAL_API_KEY"]
TEMPORAL_NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "quickstart-hometrack.w8bgj")
TEMPORAL_ADDRESS = os.getenv("TEMPORAL_ADDRESS", "us-west-2.aws.api.temporal.io:7233")
TASK_QUEUE = "field-media-processing"

# Database
DATABASE_URL = os.environ["DATABASE_URL"]

# Supabase Storage
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# AI APIs
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

# TokenTap proxy (routes Anthropic calls for usage tracking)
TOKENTAP_URL = os.getenv("TOKENTAP_URL", "")
TOKENTAP_KEY = os.getenv("TOKENTAP_KEY", "")

# Realty API (direct — zillow.realtyapi.io)
REALTY_API_KEY = os.getenv("REALTY_API_KEY", "")
REALTY_API_HOST = os.getenv("REALTY_API_HOST", "zillow.realtyapi.io")

def get_anthropic_client(
    user_id: str = "",
    session_id: str = "",
    trace_id: str = "",
) -> "anthropic.AsyncAnthropic":
    """Get an Anthropic client, routing through TokenTap when configured.

    When called from a Temporal activity, automatically uses the workflow ID
    as trace/session if not explicitly provided.
    """
    import anthropic

    # Auto-detect Temporal activity context for tracing
    if not trace_id or not session_id:
        try:
            from temporalio import activity as _act
            info = _act.info()
            if not trace_id:
                trace_id = info.workflow_id
            if not session_id:
                session_id = info.workflow_id
        except Exception:
            pass

    if TOKENTAP_URL and TOKENTAP_KEY:
        headers: dict[str, str] = {}
        if user_id:
            headers["X-TokenTap-User"] = user_id
        if session_id:
            headers["X-TokenTap-Session"] = session_id
        if trace_id:
            headers["X-TokenTap-Trace"] = trace_id
        return anthropic.AsyncAnthropic(
            api_key=TOKENTAP_KEY,
            base_url=f"{TOKENTAP_URL}/anthropic",
            default_headers=headers or None,
        )
    return anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)


# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(level=getattr(logging, LOG_LEVEL), format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("hometrack.worker")
