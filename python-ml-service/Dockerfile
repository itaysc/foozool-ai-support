# Ultra-fast build for Railway - minimal dependencies
FROM python:3.10-slim-bullseye as builder

WORKDIR /app

# Install only essential build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install minimal dependencies only (no ML)
COPY requirements/minimal.txt .
RUN pip install --upgrade pip
RUN pip install -r minimal.txt

# Production stage
FROM python:3.10-slim-bullseye

WORKDIR /app

# Install runtime dependencies including build tools for ML installation
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    build-essential \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set environment variables
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV CUDA_VISIBLE_DEVICES=""
ENV PYTORCH_CUDA_ALLOC_CONF="max_split_size_mb:128"

# Copy virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only essential application files
COPY main.py .
COPY startup.py .
COPY health_router.py .
COPY router/ ./router/
COPY services/ ./services/
COPY scripts/ ./scripts/

# Make startup script executable
RUN chmod +x startup.py

# Remove all unnecessary files and directories
RUN find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
RUN find . -type f -name "*.pyc" -delete
RUN find . -type f -name "*.pyo" -delete
RUN find . -type f -name "*.pyd" -delete
RUN find . -type f -name ".DS_Store" -delete
RUN find . -type f -name "*.log" -delete

# Expose port
EXPOSE 8000

# Use startup script
CMD ["python", "startup.py"] 