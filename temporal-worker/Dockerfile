FROM python:3.12-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml .
RUN pip install .
COPY src/ src/

CMD ["python", "-m", "src.worker"]
