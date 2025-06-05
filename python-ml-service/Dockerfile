# Use Python 3.11 slim as base
FROM python:3.11-slim as base

# Create non-root user
RUN useradd -m -u 1000 appuser

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    TRANSFORMERS_CACHE=/app/models \
    SENTENCE_TRANSFORMERS_HOME=/app/models/sentence-transformers \
    PYTHONHTTPSVERIFY=0 \
    LOG_LEVEL=INFO \
    MODEL_DEVICE=cpu \
    MAX_WORKERS=1

# Create app directory and set permissions
WORKDIR /app
RUN chown appuser:appuser /app

# Install system dependencies and certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    openssl \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates \
    && mkdir -p /app/models/sentence-transformers \
    && chown -R appuser:appuser /app/models

# Switch to non-root user
USER appuser

# Add user-local bin to PATH
ENV PATH="/home/appuser/.local/bin:${PATH}"

# Stage 1: Install base requirements
FROM base as base-deps
COPY --chown=appuser:appuser python-ml-service/requirements-base.txt .
RUN pip install --user --no-cache-dir -r requirements-base.txt

# Stage 2: Install ML dependencies
FROM base-deps as ml-deps
COPY --chown=appuser:appuser python-ml-service/requirements-ml.txt .
RUN pip install --user --no-cache-dir -r requirements-ml.txt

# Stage 3: Install NLP dependencies
FROM ml-deps as nlp-deps
COPY --chown=appuser:appuser python-ml-service/requirements-nlp.txt .
RUN pip install --user --no-cache-dir -r requirements-nlp.txt

# Stage 4: Install transformer dependencies
FROM nlp-deps as transformer-deps
COPY --chown=appuser:appuser python-ml-service/requirements-transformers.txt .
# First uninstall any existing torch installations
RUN pip uninstall -y torch torchvision || true && \
    pip install --user --no-cache-dir -r requirements-transformers.txt

# Stage 5: Download models
FROM transformer-deps as model-deps
# Create a script to download models
RUN echo '#!/usr/bin/env python3\n\
import os\n\
import ssl\n\
import certifi\n\
import logging\n\
from transformers import DistilBertTokenizer, DistilBertModel\n\
from sentence_transformers import SentenceTransformer\n\
\n\
# Set up logging\n\
logging.basicConfig(level=logging.INFO)\n\
logger = logging.getLogger(__name__)\n\
\n\
# Configure SSL\n\
ssl._create_default_https_context = ssl._create_unverified_context\n\
\n\
try:\n\
    # Download DistilBERT\n\
    logger.info("Downloading DistilBERT...")\n\
    tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased", cache_dir="/app/models", local_files_only=False)\n\
    model = DistilBertModel.from_pretrained("distilbert-base-uncased", cache_dir="/app/models", local_files_only=False)\n\
    logger.info("DistilBERT downloaded successfully")\n\
\n\
    # Download Sentence Transformer\n\
    logger.info("Downloading Sentence Transformer...")\n\
    sentence_model = SentenceTransformer("all-mpnet-base-v2", cache_folder="/app/models/sentence-transformers")\n\
    logger.info("Sentence Transformer downloaded successfully")\n\
\n\
    logger.info("All models downloaded successfully!")\n\
except Exception as e:\n\
    logger.error(f"Error downloading models: {str(e)}")\n\
    raise RuntimeError(f"Failed to download models: {str(e)}")\n\
' > /app/download_models.py && chmod +x /app/download_models.py

# Run the download script
RUN python /app/download_models.py

# Stage 6: Final image
FROM model-deps as final
COPY --chown=appuser:appuser python-ml-service/ .

# Add user-local bin to PATH in the final stage
ENV PATH="/home/appuser/.local/bin:${PATH}"

# Expose port
EXPOSE 8000

# Create a startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Create log directory\n\
mkdir -p /app/logs\n\
\n\
# Function to log messages\n\
log() {\n\
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a /app/logs/startup.log\n\
}\n\
\n\
log "Starting ML service..."\n\
\n\
# Check Python environment\n\
log "Python version: $(python --version)"\n\
log "Python path: $(which python)"\n\
log "Current directory: $(pwd)"\n\
log "Directory contents: $(ls -la)"\n\
\n\
# Check model directories\n\
log "Checking model directories..."\n\
if [ ! -d "/app/models" ]; then\n\
    log "ERROR: /app/models directory does not exist"\n\
    exit 1\n\
fi\n\
\n\
if [ ! -d "/app/models/sentence-transformers" ]; then\n\
    log "ERROR: /app/models/sentence-transformers directory does not exist"\n\
    exit 1\n\
fi\n\
\n\
# Wait for models to be available with timeout\n\
log "Waiting for models to be available..."\n\
timeout=300  # 5 minutes timeout\n\
start_time=$(date +%s)\n\
while true; do\n\
    if [ -d "/app/models/sentence-transformers" ] && [ -d "/app/models/distilbert-base-uncased" ]; then\n\
        log "Models found!"\n\
        break\n\
    fi\n\
    \n\
    current_time=$(date +%s)\n\
    elapsed=$((current_time - start_time))\n\
    \n\
    if [ $elapsed -gt $timeout ]; then\n\
        log "ERROR: Timeout waiting for models after ${timeout} seconds"\n\
        log "Directory contents of /app/models:"\n\
        ls -la /app/models | tee -a /app/logs/startup.log\n\
        exit 1\n\
    fi\n\
    \n\
    log "Waiting for models... (${elapsed}s elapsed)"\n\
    sleep 5\n\
done\n\
\n\
# Check Python packages\n\
log "Checking Python packages..."\n\
pip list | tee -a /app/logs/startup.log\n\
\n\
# Start the application with proper logging\n\
log "Starting uvicorn server..."\n\
exec uvicorn main:app \\\n\
    --host 0.0.0.0 \\\n\
    --port 8000 \\\n\
    --log-level debug \\\n\
    --workers 1 \\\n\
    --timeout-keep-alive 120 \\\n\
    --proxy-headers \\\n\
    --forwarded-allow-ips "*" \\\n\
    --log-config logging.conf \\\n\
    2>&1 | tee -a /app/logs/uvicorn.log\n\
' > /app/start.sh && chmod +x /app/start.sh

# Create logging configuration
RUN echo '[loggers]\n\
keys=root,uvicorn,uvicorn.error,uvicorn.access\n\
\n\
[handlers]\n\
keys=console,file\n\
\n\
[formatters]\n\
keys=generic,access\n\
\n\
[logger_root]\n\
level=DEBUG\n\
handlers=console,file\n\
qualname=\n\
\n\
[logger_uvicorn]\n\
level=DEBUG\n\
handlers=console,file\n\
qualname=uvicorn\n\
propagate=0\n\
\n\
[logger_uvicorn.error]\n\
level=DEBUG\n\
handlers=console,file\n\
qualname=uvicorn.error\n\
propagate=0\n\
\n\
[logger_uvicorn.access]\n\
level=DEBUG\n\
handlers=console,file\n\
qualname=uvicorn.access\n\
propagate=0\n\
\n\
[handler_console]\n\
class=StreamHandler\n\
formatter=generic\n\
args=(sys.stdout,)\n\
\n\
[handler_file]\n\
class=FileHandler\n\
formatter=generic\n\
args=("/app/logs/uvicorn.log", "a")\n\
\n\
[formatter_generic]\n\
format=%(asctime)s - %(name)s - %(levelname)s - %(message)s\n\
datefmt=%Y-%m-%d %H:%M:%S\n\
class=logging.Formatter\n\
\n\
[formatter_access]\n\
format=%(asctime)s - %(name)s - %(levelname)s - %(message)s\n\
datefmt=%Y-%m-%d %H:%M:%S\n\
class=logging.Formatter\n\
' > /app/logging.conf

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R appuser:appuser /app/logs

# Run the startup script
CMD ["/app/start.sh"]
