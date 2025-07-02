FROM python:3.10-slim-bullseye

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    libffi-dev \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set SSL environment variables
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements/ requirements/
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements/prod.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Set model cache envs
ENV TRANSFORMERS_CACHE=/app/models
ENV SENTENCE_TRANSFORMERS_HOME=/app/models/sentence-transformers

# Create model directories
RUN mkdir -p /app/models /app/models/sentence-transformers

# Start with gunicorn in production
CMD ["gunicorn", "main:app", "--workers", "1", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"] 