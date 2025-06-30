from fastapi import APIRouter
from fastapi.responses import JSONResponse
import os
import time
import logging

logger = logging.getLogger(__name__)

health_router = APIRouter()

@health_router.get("/health")
async def health_check():
    """
    Basic health check endpoint for the ML service.
    """
    try:
        health_status = {
            "status": "healthy",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "version": "1.0",
            "timestamp": time.time(),
            "service": "python-ml-api"
        }
        return health_status
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time(),
                "service": "python-ml-api"
            }
        )

@health_router.get("/health/ml-models")
async def ml_models_health_check():
    """
    ML models health check endpoint.
    """
    try:
        # Check if key ML models can be imported
        model_status = {}
        
        try:
            from transformers import DistilBertTokenizer, DistilBertModel
            model_status["distilbert"] = "available"
        except Exception as e:
            model_status["distilbert"] = f"error: {str(e)}"
        
        try:
            from sentence_transformers import SentenceTransformer
            model_status["sentence_transformer"] = "available"
        except Exception as e:
            model_status["sentence_transformer"] = f"error: {str(e)}"
        
        try:
            from transformers import pipeline
            model_status["pipeline"] = "available"
        except Exception as e:
            model_status["pipeline"] = f"error: {str(e)}"
        
        # Check model cache directories
        cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/app/models')
        sbert_dir = os.environ.get('SENTENCE_TRANSFORMERS_HOME', '/app/models/sentence-transformers')
        
        model_status["cache_directory"] = "exists" if os.path.exists(cache_dir) else "missing"
        model_status["sbert_directory"] = "exists" if os.path.exists(sbert_dir) else "missing"
        
        health_status = {
            "status": "healthy" if all("error" not in str(v) for v in model_status.values()) else "degraded",
            "models": model_status,
            "environment": os.getenv("ENVIRONMENT", "development"),
            "version": "1.0",
            "timestamp": time.time(),
            "service": "python-ml-api"
        }
        return health_status
    except Exception as e:
        logger.error(f"ML models health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "models": "error",
                "error": str(e),
                "timestamp": time.time(),
                "service": "python-ml-api"
            }
        ) 