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
        
        # Check if specific models are available
        try:
            from services.intent_classification import get_intent_classifier
            intent_classifier = get_intent_classifier()
            model_status["intent_classifier"] = "loaded" if intent_classifier is not None else "failed"
        except Exception as e:
            model_status["intent_classifier"] = f"error: {str(e)}"
        
        # Check environment variables
        model_status["port"] = os.getenv("PORT", "8000")
        model_status["environment"] = os.getenv("ENVIRONMENT", "development")
        model_status["railway_environment"] = os.getenv("RAILWAY_ENVIRONMENT", "not_set")
        
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

@health_router.post("/health/test-intent")
async def test_intent_classification():
    """
    Test intent classification endpoint.
    """
    try:
        from services.intent_classification import classify_ticket_intent
        
        # Test with a simple refund request
        test_subject = "I want a refund"
        test_description = "The product I ordered is not working properly and I would like my money back."
        
        result = classify_ticket_intent(test_subject, test_description)
        
        return {
            "status": "success",
            "test_subject": test_subject,
            "test_description": test_description,
            "result": result,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Intent classification test failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "error": str(e),
                "timestamp": time.time()
            }
        ) 