# Railway Deployment with Persistent Storage

This guide explains how to deploy the Python ML service to Railway using persistent storage for models, which significantly reduces the Docker image size.

## Problem Solved

- **Original Issue**: Docker image size of 9.3GB exceeded Railway's 4GB limit
- **Solution**: Use Railway's persistent storage to store models separately from the Docker image
- **Result**: Docker image size reduced to ~500MB, models stored in persistent volume

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Docker Image  │    │  Railway Volume  │    │   Application   │
│   (~500MB)      │    │  (/data/models)  │    │   (FastAPI)     │
│                 │    │                  │    │                 │
│ - Python        │    │ - DistilBERT     │    │ - Loads models  │
│ - Dependencies  │    │ - BART Base      │    │   from volume   │
│ - App Code      │    │ - Sentence       │    │ - Serves API    │
│                 │    │   Transformers   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Setup Instructions

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Set up Persistent Storage

```bash
# Run the setup script
./setup-railway-storage.sh

# Or manually:
railway login
railway volume create models-storage --size 10GB
```

### 3. Deploy to Railway

```bash
# Deploy the application
railway up
```

## How It Works

### Startup Process

1. **Container Starts**: The Docker container starts with only the application code (~500MB)
2. **Storage Check**: The startup script checks if models exist in persistent storage (`/data/models`)
3. **Model Download**: If models don't exist, they're downloaded to persistent storage
4. **Application Start**: The FastAPI application starts and loads models from persistent storage

### Model Optimization

The following optimizations were made to reduce model sizes:

| Original Model | Optimized Model | Size Reduction |
|----------------|-----------------|----------------|
| `facebook/bart-large-cnn` | `facebook/bart-base-cnn` | ~1.6GB → ~500MB |
| `vineetsharma/customer-support-intent-albert` | `distilbert-base-uncased` | ~500MB → ~250MB |
| `deepset/roberta-base-squad2` | `distilbert-base-cased-distilled-squad` | ~500MB → ~250MB |
| `all-mpnet-base-v2` | `all-MiniLM-L6-v2` | ~500MB → ~100MB |

**Total Size Reduction**: ~3.5GB → ~1.1GB

## Configuration Files

### Dockerfile
- Uses Python 3.10 slim image
- Installs only necessary dependencies
- Uses startup script for model management

### startup.py
- Handles persistent storage setup
- Downloads models on first run
- Manages environment variables

### railway.toml
- Configures Railway deployment
- Sets up volume mounting
- Defines health checks

## Benefits

1. **Smaller Image**: Docker image reduced from 9.3GB to ~500MB
2. **Faster Deployments**: Subsequent deployments skip model downloads
3. **Cost Effective**: Stays within Railway's free tier limits
4. **Persistent Models**: Models survive container restarts
5. **Scalable**: Can easily upgrade to larger models if needed

## Monitoring

### Health Check
The application provides a health endpoint at `/health` that Railway uses to monitor the service.

### Logs
Monitor the startup process:
```bash
railway logs
```

Look for:
- ✅ Model download success messages
- 📊 Download summary
- 🎉 All models downloaded successfully

## Troubleshooting

### Model Download Failures
If models fail to download:
1. Check network connectivity
2. Verify Railway volume is properly mounted
3. Check logs for specific error messages
4. Increase timeout in `startup.py` if needed

### Storage Issues
If persistent storage isn't working:
1. Verify volume exists: `railway volume list`
2. Check volume size: `railway volume show models-storage`
3. Ensure proper mounting in `railway.toml`

### Performance
- First deployment will take longer due to model downloads
- Subsequent deployments will be much faster
- Models are cached in persistent storage

## Cost Optimization

- **Free Tier**: 4GB image limit, 10GB storage
- **Pro Tier**: 8GB image limit, 100GB storage
- **Enterprise**: Custom limits

With this setup, you can stay within the free tier limits while using large ML models.

## Future Improvements

1. **Model Compression**: Use quantized models for even smaller sizes
2. **Lazy Loading**: Load models only when needed
3. **CDN Integration**: Use external CDN for model distribution
4. **Model Versioning**: Implement model version management 