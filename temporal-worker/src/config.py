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

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(level=getattr(logging, LOG_LEVEL), format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("hometrack.worker")
