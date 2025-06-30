from fastapi import APIRouter
from fastapi.responses import JSONResponse
import os
import time
import logging

logger = logging.getLogger(__name__)

health_router = APIRouter()

@health_router.get("/api/v1/health")
async def health_check():
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