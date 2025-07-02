# syntax=docker/dockerfile:1.4
FROM python:3.10-slim-bullseye as builder

# Set build arguments
ARG BUILDPLATFORM
ARG TARGETPLATFORM
ARG PIP_NO_CACHE_DIR=1
ARG PIP_DISABLE_PIP_VERSION_CHECK=1
ARG ENVIRONMENT=production
ARG DEBUG=false

# Use BuildKit cache mount for apt
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies with BuildKit cache mount
WORKDIR /build
COPY ./requirements/base.txt ./requirements/ml.txt ./requirements/prod.txt ./requirements/dev.txt ./

# Install dependencies based on environment
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir --upgrade pip && \
    if [ "$ENVIRONMENT" = "development" ]; then \
        pip install --no-cache-dir -r dev.txt debugpy; \
    else \
        pip install --no-cache-dir -r prod.txt; \
    fi

# Add a new stage for model caching
FROM python:3.10-slim-bullseye as model-cache

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install SSL certificates in the model-cache stage
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# Set SSL environment variables for model-cache stage
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# Set up model cache directories
RUN mkdir -p /app/models /app/models/sentence-transformers

ENV TRANSFORMERS_CACHE=/app/models
ENV SENTENCE_TRANSFORMERS_HOME=/app/models/sentence-transformers

# Copy only the model download script
WORKDIR /app
COPY <<EOF /app/scripts/download_models.py
import asyncio
import os
from transformers import DistilBertTokenizer, DistilBertModel, pipeline
from sentence_transformers import SentenceTransformer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def download_model(model_func, *args, **kwargs):
    try:
        await asyncio.to_thread(model_func, *args, **kwargs)
        logger.info(f"Successfully downloaded model: {args[0] if args else kwargs.get('model', 'unknown')}")
    except Exception as e:
        logger.error(f"Error downloading model: {e}")

async def main():
    cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/app/models')
    models = [
        (DistilBertModel.from_pretrained, "distilbert-base-uncased", {"cache_dir": cache_dir}),
        (DistilBertTokenizer.from_pretrained, "distilbert-base-uncased", {"cache_dir": cache_dir}),
        (pipeline, "summarization", {"model": "facebook/bart-large-cnn", "cache_dir": cache_dir}),
        (pipeline, "question-answering", {"model": "deepset/roberta-base-squad2", "cache_dir": cache_dir}),
        (SentenceTransformer, "all-mpnet-base-v2", {"cache_folder": cache_dir}),
        (SentenceTransformer, "all-MiniLM-L6-v2", {"cache_folder": cache_dir})
    ]
    
    tasks = [download_model(func, *args, **kwargs) for func, *args, kwargs in models]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
EOF

# Download models in a separate stage
RUN --mount=type=cache,target=/app/models,id=ml-models-cache,mode=0777 \
    python /app/scripts/download_models.py

# Final stage
FROM python:3.10-slim-bullseye

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install runtime dependencies only with BuildKit cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# Set SSL environment variables
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# Create model directories
RUN mkdir -p /app/models /app/models/sentence-transformers

# Copy models from the model-cache stage
COPY --from=model-cache /app/models /app/models/

ENV TRANSFORMERS_CACHE=/app/models
ENV SENTENCE_TRANSFORMERS_HOME=/app/models/sentence-transformers

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Use different commands based on environment and debug mode
CMD if [ "$ENVIRONMENT" = "development" ]; then \
        if [ "$DEBUG" = "true" ]; then \
            python -m debugpy --listen 0.0.0.0:5678 --wait-for-client -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload; \
        else \
            uvicorn main:app --host 0.0.0.0 --port 8000 --reload; \
        fi \
    else \
        gunicorn main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000; \
    fi 