# Use Python with pre-compiled libraries for better performance
FROM python:3.10

WORKDIR /app

# Install system dependencies including ca-certificates for SSL
RUN apt-get update && apt-get install -y \
    build-essential \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Update CA certificates
RUN update-ca-certificates

# Set SSL environment variables
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# Copy only requirements first for better Docker layer caching
COPY python-ml-service/requirements.txt /app/requirements.txt

# Install dependencies with pip cache and optimizations
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Set up model cache directories
ENV TRANSFORMERS_CACHE=/app/models
ENV SENTENCE_TRANSFORMERS_HOME=/app/models/sentence-transformers
RUN mkdir -p /app/models /app/models/sentence-transformers

# Copy the application code
COPY python-ml-service /app

# Comment out the problematic model pre-downloading step
# Models will be downloaded at runtime when first needed
# RUN python -c "from transformers import DistilBertTokenizer, DistilBertModel, pipeline; from sentence_transformers import SentenceTransformer; print('Downloading models...'); DistilBertModel.from_pretrained('distilbert-base-uncased'); DistilBertTokenizer.from_pretrained('distilbert-base-uncased'); pipeline('summarization', model='facebook/bart-large-cnn'); pipeline('question-answering', model='deepset/roberta-base-squad2'); SentenceTransformer('all-mpnet-base-v2'); SentenceTransformer('all-MiniLM-L6-v2'); print('All models downloaded successfully!')"

# Expose port
EXPOSE 8000

# Use uvicorn with optimized settings for production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--workers", "1"]
