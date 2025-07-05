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
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

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

# Make startup script executable
RUN chmod +x startup.py

# Expose port
EXPOSE 8000

# Use the startup script that handles persistent storage
CMD ["python", "startup.py"] 