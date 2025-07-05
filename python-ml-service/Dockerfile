# Multi-stage build to reduce image size
FROM python:3.10-slim-bullseye as builder

WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    libffi-dev \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements/ requirements/
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements/prod.txt

# Production stage
FROM python:3.10-slim-bullseye

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set SSL environment variables
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# Force CPU-only usage to reduce memory and size
ENV CUDA_VISIBLE_DEVICES=""
ENV PYTORCH_CUDA_ALLOC_CONF="max_split_size_mb:128"

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

# Make startup script executable
RUN chmod +x startup.py

# Remove unnecessary files to reduce image size
RUN rm -rf /app/venv /app/.git /app/__pycache__ /app/*/__pycache__ /app/*/*/__pycache__

# Expose port
EXPOSE 8000

# Use the startup script that handles persistent storage
CMD ["python", "startup.py"] 