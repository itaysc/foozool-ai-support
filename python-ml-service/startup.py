#!/usr/bin/env python3
"""
Startup script for Railway deployment.
Handles model downloading to persistent storage and application startup.
"""

import os
import sys
import logging
import subprocess
import time
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_persistent_storage():
    """Set up model directories in Railway's persistent storage."""
    # Railway mounts persistent storage at /data
    persistent_data_dir = "/data"
    models_dir = os.path.join(persistent_data_dir, "models")
    
    # Create directories if they don't exist
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(os.path.join(models_dir, "sentence-transformers"), exist_ok=True)
    
    # Set environment variables to use persistent storage
    os.environ["TRANSFORMERS_CACHE"] = models_dir
    os.environ["SENTENCE_TRANSFORMERS_HOME"] = os.path.join(models_dir, "sentence-transformers")
    
    logger.info(f"Persistent storage setup complete. Models will be stored in: {models_dir}")
    return models_dir

def download_models_if_needed(models_dir):
    """Download models if they don't exist in persistent storage."""
    models_downloaded_flag = os.path.join(models_dir, ".models_downloaded")
    
    if os.path.exists(models_downloaded_flag):
        logger.info("Models already downloaded, skipping download...")
        return True
    
    logger.info("Models not found in persistent storage. Starting download...")
    
    try:
        # Run the model download script
        result = subprocess.run([
            sys.executable, "scripts/download_models.py"
        ], capture_output=True, text=True, timeout=1800)  # 30 minute timeout
        
        if result.returncode == 0:
            # Create flag file to indicate successful download
            with open(models_downloaded_flag, 'w') as f:
                f.write(f"Downloaded at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info("Models downloaded successfully!")
            return True
        else:
            logger.error(f"Model download failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("Model download timed out after 30 minutes")
        return False
    except Exception as e:
        logger.error(f"Error during model download: {str(e)}")
        return False

def start_application():
    """Start the FastAPI application with Gunicorn."""
    logger.info("Starting application...")
    
    # Use Gunicorn with Uvicorn worker
    cmd = [
        "gunicorn",
        "main:app",
        "--workers", "1",
        "--worker-class", "uvicorn.workers.UvicornWorker",
        "--bind", "0.0.0.0:8000",
        "--timeout", "120",
        "--keep-alive", "5"
    ]
    
    # Start the application
    os.execvp("gunicorn", cmd)

def main():
    """Main startup function."""
    logger.info("Starting Railway deployment...")
    
    # Check if we're in production (Railway sets RAILWAY_ENVIRONMENT)
    is_production = os.getenv("RAILWAY_ENVIRONMENT") == "production"
    
    if is_production:
        logger.info("Production environment detected. Setting up persistent storage...")
        
        # Set up persistent storage
        models_dir = setup_persistent_storage()
        
        # Download models if needed
        if not download_models_if_needed(models_dir):
            logger.error("Failed to download models. Exiting...")
            sys.exit(1)
    else:
        logger.info("Development environment detected. Using local storage...")
        # In development, use local storage
        os.environ["TRANSFORMERS_CACHE"] = "./models"
        os.environ["SENTENCE_TRANSFORMERS_HOME"] = "./models/sentence-transformers"
    
    # Start the application
    start_application()

if __name__ == "__main__":
    main() 