#!/usr/bin/env python3
"""
Startup script to verify ML models are loaded before starting the FastAPI app.
This ensures Railway has all the necessary models available.
"""

import os
import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_models():
    """Verify that all required ML models are available."""
    logger.info("Verifying ML models are available...")
    
    # Set environment variables
    os.environ.setdefault('TRANSFORMERS_CACHE', '/app/models')
    os.environ.setdefault('SENTENCE_TRANSFORMERS_HOME', '/app/models/sentence-transformers')
    
    # Check if model directories exist
    models_dir = Path(os.environ['TRANSFORMERS_CACHE'])
    sbert_dir = Path(os.environ['SENTENCE_TRANSFORMERS_HOME'])
    
    if not models_dir.exists():
        logger.warning(f"Models directory {models_dir} does not exist")
    else:
        logger.info(f"Models directory {models_dir} exists")
    
    if not sbert_dir.exists():
        logger.warning(f"SBERT directory {sbert_dir} does not exist")
    else:
        logger.info(f"SBERT directory {sbert_dir} exists")
    
    # Try to import and verify key models
    try:
        from transformers import DistilBertTokenizer, DistilBertModel
        logger.info("✅ DistilBERT models can be imported")
    except Exception as e:
        logger.error(f"❌ Failed to import DistilBERT models: {e}")
        return False
    
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("✅ SentenceTransformer can be imported")
    except Exception as e:
        logger.error(f"❌ Failed to import SentenceTransformer: {e}")
        return False
    
    try:
        from transformers import pipeline
        logger.info("✅ Transformers pipeline can be imported")
    except Exception as e:
        logger.error(f"❌ Failed to import transformers pipeline: {e}")
        return False
    
    logger.info("✅ All ML model imports successful")
    return True

def main():
    """Main startup function."""
    logger.info("Starting ML service verification...")
    
    if not verify_models():
        logger.error("❌ Model verification failed. Exiting.")
        sys.exit(1)
    
    logger.info("✅ Model verification successful. Starting FastAPI application...")
    
    # Import and run the main application
    from main import app
    import uvicorn
    
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False  # Disable reload in production
    )

if __name__ == "__main__":
    main() 