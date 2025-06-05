from fastapi import FastAPI, HTTPException
from router import router
import logging
import sys
import os
import traceback
from services.SBERT_embedding import get_model as get_sbert_model
from services.DistilBERT_embedding import distilbert_model, distilbert_tokenizer
from services.intent_classification import intent_classifier
from services.summarize import summarizer
from services.answer import qa_pipeline

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/app/logs/app.log')
    ]
)
logger = logging.getLogger(__name__)

# Log system information
logger.info(f"Python version: {sys.version}")
logger.info(f"Current working directory: {os.getcwd()}")
logger.info(f"Directory contents: {os.listdir('.')}")
logger.info(f"Environment variables: {dict(os.environ)}")

app = FastAPI(title="Python ML API", version="1.0")

def check_model_loading(model_name: str, model_instance) -> bool:
    """Helper function to check if a model is loaded properly"""
    try:
        if model_instance is None:
            logger.error(f"{model_name} is None")
            return False
        logger.info(f"{model_name} is loaded: {type(model_instance)}")
        return True
    except Exception as e:
        logger.error(f"Error checking {model_name}: {str(e)}")
        return False

@app.on_event("startup")
async def startup_event():
    """
    Initialize all ML models during startup.
    This ensures models are loaded before the service starts accepting requests.
    """
    try:
        logger.info("Starting ML service initialization...")
        
        # Check model directories
        model_dirs = [
            "/app/models",
            "/app/models/sentence-transformers",
            "/app/models/distilbert-base-uncased"
        ]
        for dir_path in model_dirs:
            if not os.path.exists(dir_path):
                raise RuntimeError(f"Model directory does not exist: {dir_path}")
            logger.info(f"Model directory exists: {dir_path}")
            logger.info(f"Directory contents: {os.listdir(dir_path)}")
        
        # Load SBERT model
        logger.info("Loading SBERT model...")
        try:
            sbert_model = get_sbert_model()
            if not check_model_loading("SBERT", sbert_model):
                raise RuntimeError("SBERT model failed to load properly")
            logger.info("SBERT model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load SBERT model: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
        # Check DistilBERT model
        logger.info("Checking DistilBERT model...")
        if not check_model_loading("DistilBERT model", distilbert_model) or \
           not check_model_loading("DistilBERT tokenizer", distilbert_tokenizer):
            raise RuntimeError("DistilBERT model or tokenizer not available")
        logger.info("DistilBERT model loaded successfully")
        
        # Check intent classifier
        logger.info("Checking intent classifier...")
        if not check_model_loading("Intent classifier", intent_classifier):
            raise RuntimeError("Intent classification model not available")
        logger.info("Intent classification model loaded successfully")
        
        # Check summarizer
        logger.info("Checking summarizer...")
        if not check_model_loading("Summarizer", summarizer):
            raise RuntimeError("Summarization model not available")
        logger.info("Summarization model loaded successfully")
        
        # Check QA pipeline
        logger.info("Checking QA pipeline...")
        if not check_model_loading("QA pipeline", qa_pipeline):
            raise RuntimeError("QA model not available")
        logger.info("QA model loaded successfully")
        
        logger.info("All ML models loaded successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize ML service: {str(e)}")
        logger.error(traceback.format_exc())
        raise RuntimeError(f"ML service initialization failed: {str(e)}")

# Include the router that handles ML requests
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Python ML API is running!", "status": "healthy"}

@app.get("/health")
def health():
    """
    Health check endpoint that verifies all models are loaded.
    """
    try:
        # Check if all models are loaded
        models_status = {
            "sbert": check_model_loading("SBERT", get_sbert_model()),
            "distilbert": check_model_loading("DistilBERT model", distilbert_model) and 
                         check_model_loading("DistilBERT tokenizer", distilbert_tokenizer),
            "intent_classifier": check_model_loading("Intent classifier", intent_classifier),
            "summarizer": check_model_loading("Summarizer", summarizer),
            "qa_pipeline": check_model_loading("QA pipeline", qa_pipeline)
        }
        
        all_models_loaded = all(models_status.values())
        
        return {
            "status": "healthy" if all_models_loaded else "degraded",
            "service": "ml-service",
            "models": models_status,
            "python_version": sys.version,
            "working_directory": os.getcwd()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "status": "unhealthy",
            "service": "ml-service",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

if __name__ == "__main__":
    import uvicorn
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="debug",
            workers=1,
            timeout_keep_alive=120
        )
    except Exception as e:
        logger.error(f"Failed to start uvicorn server: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1)
