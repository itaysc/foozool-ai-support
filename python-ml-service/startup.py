#!/usr/bin/env python3
"""
Startup script for Railway deployment.
Handles ML dependency installation and model downloading to persistent storage.
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

def install_ml_dependencies():
    """Install ML dependencies at runtime if not available."""
    try:
        import torch
        import transformers
        import sentence_transformers
        import tensorflow
        import psutil
        logger.info("✅ ML dependencies already available")
        return True
    except ImportError:
        logger.info("📦 Installing ML dependencies at runtime...")
        try:
            # First, ensure we have a compatible NumPy version
            subprocess.check_call([
                sys.executable, "-m", "pip", "install",
                "--no-cache-dir",  # Avoid cache issues
                "numpy<2.0.0"  # Use NumPy 1.x for compatibility
            ])
            
            # Install ML dependencies with compatible versions
            subprocess.check_call([
                sys.executable, "-m", "pip", "install",
                "--no-cache-dir",  # Avoid cache issues
                "torch==2.1.0",
                "transformers==4.35.0", 
                "sentence-transformers==2.2.2",
                "tensorflow==2.15.0",  # Required for Sarthak279/Intent model
                "psutil==5.9.8"  # Required for memory monitoring
            ])
            logger.info("✅ ML dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to install ML dependencies: {e}")
            # Try with CPU-only torch as fallback
            try:
                logger.info("🔄 Trying CPU-only torch installation...")
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install",
                    "--no-cache-dir",
                    "numpy<2.0.0"  # Ensure NumPy 1.x
                ])
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install",
                    "--no-cache-dir",
                    "torch==2.1.0+cpu", "-f", "https://download.pytorch.org/whl/torch_stable.html"
                ])
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install",
                    "--no-cache-dir",
                    "transformers==4.35.0", 
                    "sentence-transformers==2.2.2",
                    "tensorflow==2.15.0",  # Required for Sarthak279/Intent model
                    "psutil==5.9.8"  # Required for memory monitoring
                ])
                logger.info("✅ ML dependencies installed with CPU-only torch")
                return True
            except subprocess.CalledProcessError as e2:
                logger.error(f"❌ CPU-only installation also failed: {e2}")
                return False

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
        # Run the model download script with real-time output
        logger.info("Starting model download script...")
        result = subprocess.run([
            sys.executable, "scripts/download_models.py"
        ], timeout=2400)  # 40 minute timeout for memory-optimized downloads
        
        if result.returncode == 0:
            # Create flag file to indicate successful download
            with open(models_downloaded_flag, 'w') as f:
                f.write(f"Downloaded at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            logger.info("Models downloaded successfully!")
            return True
        else:
            logger.error(f"Model download failed with return code: {result.returncode}")
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
    
    # Get port from environment variable (Railway sets this)
    port = os.getenv("PORT", "8000")
    logger.info(f"Starting application on port {port}")
    
    # Use Gunicorn with Uvicorn worker
    cmd = [
        "gunicorn",
        "main:app",
        "--workers", "1",
        "--worker-class", "uvicorn.workers.UvicornWorker",
        "--bind", f"0.0.0.0:{port}",
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
        
        # Install ML dependencies at runtime
        if not install_ml_dependencies():
            logger.error("Failed to install ML dependencies. Exiting...")
            sys.exit(1)
        
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