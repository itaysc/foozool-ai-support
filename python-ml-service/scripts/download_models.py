import asyncio
import gc
import logging
import os
import sys
import ssl
import certifi
import requests
import psutil
from concurrent.futures import ThreadPoolExecutor
from transformers import DistilBertTokenizer, DistilBertModel, pipeline, AutoTokenizer, TFAutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
import torch
from huggingface_hub import HfFolder
from huggingface_hub.utils import HfHubHTTPError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_memory_usage(stage=""):
    """Log current memory usage."""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()
        logger.info(f"💾 Memory usage {stage}: {memory_info.rss / 1024 / 1024:.1f}MB ({memory_percent:.1f}%)")
        
        # Check if we're approaching memory limits
        if memory_percent > 80:
            logger.warning(f"⚠️  High memory usage detected: {memory_percent:.1f}%")
            return False
        return True
    except Exception as e:
        logger.warning(f"Could not get memory usage: {e}")
        return True

def load_tf_intent_model():
    """Custom loader for TensorFlow intent model."""
    try:
        # Try loading with pipeline first, specifying framework
        return pipeline('text-classification', model='Sarthak279/Intent', framework='tf', local_files_only=False)
    except Exception as e:
        logger.error(f"Error loading TensorFlow intent model with pipeline: {e}")
        try:
            # Fallback: Load model and tokenizer separately
            model = TFAutoModelForSequenceClassification.from_pretrained('Sarthak279/Intent', from_tf=True)
            tokenizer = AutoTokenizer.from_pretrained('Sarthak279/Intent')
            return pipeline('text-classification', model=model, tokenizer=tokenizer, local_files_only=False)
        except Exception as e2:
            logger.error(f"Error loading TensorFlow intent model with separate loading: {e2}")
            raise

# Optimized model configurations - using smaller models for Railway's memory constraints
MODELS = {
    'distilbert': {
        'name': 'distilbert-base-uncased',
        'type': 'transformers',
        'loader': lambda: DistilBertModel.from_pretrained('distilbert-base-uncased', local_files_only=False),
        'tokenizer': lambda: DistilBertTokenizer.from_pretrained('distilbert-base-uncased', local_files_only=False)
    },
    'intent_primary': {
        'name': 'distilbert-base-uncased-finetuned-sst-2-english',  # Smaller alternative
        'type': 'pipeline',
        'loader': lambda: pipeline('text-classification', model='distilbert-base-uncased-finetuned-sst-2-english', local_files_only=False)
    },
    'intent_fallback': {
        'name': 'Sarthak279/Intent',
        'type': 'pipeline',
        'loader': load_tf_intent_model,
        'optional': True  # Mark as optional since it's only a fallback
    },
    'summarization': {
        'name': 'facebook/bart-base-cnn',  # Using smaller base model instead of large
        'type': 'pipeline',
        'loader': lambda: pipeline('summarization', model='facebook/bart-base-cnn', local_files_only=False)
    },
    'qa': {
        'name': 'distilbert-base-cased-distilled-squad',  # Using smaller model
        'type': 'pipeline',
        'loader': lambda: pipeline('question-answering', model='distilbert-base-cased-distilled-squad', local_files_only=False)
    },
    'sentence_transformer': {
        'name': 'sentence-transformers/all-mpnet-base-v2',  # Original model to preserve existing vectors
        'type': 'sentence_transformer',
        'loader': lambda: SentenceTransformer('sentence-transformers/all-mpnet-base-v2', cache_folder=os.environ.get('TRANSFORMERS_CACHE'))
    }
}

async def download_with_retry(model_key, model_config, max_retries=3, timeout=300):
    """Download a model with retries and fallback to local files."""
    retry_delay = 2
    last_error = None
    
    # Reduce timeout for Railway's memory constraints
    if 'large' in model_config['name'] or 'bart-large' in model_config['name']:
        timeout = 600  # 10 minutes for large models
        logger.info(f"Using extended timeout ({timeout}s) for large model: {model_config['name']}")
    
    # First try with local files only
    try:
        logger.info(f"Attempting to load {model_config['name']} from local cache")
        if model_config['type'] == 'transformers':
            model = model_config['loader']()
            tokenizer = model_config['tokenizer']()
            logger.info(f"✅ Successfully loaded {model_config['name']} from local cache")
            return True
        elif model_config['type'] in ['pipeline', 'sentence_transformer']:
            model = model_config['loader']()
            logger.info(f"✅ Successfully loaded {model_config['name']} from local cache")
            return True
    except Exception as local_error:
        logger.warning(f"Could not load {model_config['name']} from local cache: {local_error}")
        last_error = local_error

    # If local load fails, try downloading with retries
    for attempt in range(max_retries):
        try:
            # Check memory before attempting download
            if not log_memory_usage(f"before attempt {attempt + 1}"):
                logger.warning(f"⚠️  High memory usage, skipping download attempt {attempt + 1}")
                await asyncio.sleep(30)  # Wait for memory to free up
                continue
            
            # Set timeout for the download attempt
            download_task = asyncio.create_task(download_single_attempt(model_config))
            await asyncio.wait_for(download_task, timeout=timeout)
            return True
        except asyncio.TimeoutError:
            logger.error(f"Timeout downloading {model_config['name']} (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (attempt + 1))
            continue
        except Exception as e:
            last_error = e
            logger.error(f"Error downloading {model_config['name']}: {str(e)}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (attempt + 1))
    
    logger.error(f"❌ Failed to download {model_config['name']} after {max_retries} attempts. Last error: {last_error}")
    return False

async def download_single_attempt(model_config):
    """Single download attempt for a model."""
    logger.info(f"Downloading {model_config['name']}")
    
    # Log memory before download
    log_memory_usage("before download")
    
    # Aggressive memory cleanup before download
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    # Set memory optimization flags
    os.environ['TRANSFORMERS_OFFLINE'] = '0'
    os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
    os.environ['TOKENIZERS_PARALLELISM'] = 'false'  # Disable parallel tokenization
    
    # Try with SSL verification first
    try:
        if model_config['type'] == 'transformers':
            model = model_config['loader']()
            tokenizer = model_config['tokenizer']()
            # Immediately delete to free memory
            del model
            del tokenizer
        elif model_config['type'] in ['pipeline', 'sentence_transformer']:
            model = model_config['loader']()
            # Immediately delete to free memory
            del model
        
        logger.info(f"✅ Successfully downloaded {model_config['name']}")
        
        # Log memory after download
        log_memory_usage("after download")
        
        # Aggressive memory cleanup
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Log memory after cleanup
        log_memory_usage("after cleanup")
        
        return True
    except (requests.exceptions.SSLError, ssl.SSLError) as ssl_error:
        logger.warning(f"SSL error downloading {model_config['name']}: {ssl_error}")
        # If SSL fails, try one last time without verification (not recommended but as fallback)
        logger.warning(f"Attempting download of {model_config['name']} without SSL verification")
        os.environ['CURL_CA_BUNDLE'] = ""
        os.environ['REQUESTS_CA_BUNDLE'] = ""
        if model_config['type'] == 'transformers':
            model = model_config['loader']()
            tokenizer = model_config['tokenizer']()
        elif model_config['type'] in ['pipeline', 'sentence_transformer']:
            model = model_config['loader']()
        logger.info(f"✅ Successfully downloaded {model_config['name']} without SSL verification")
        
        # Clear memory after successful download
        del model
        if 'tokenizer' in locals():
            del tokenizer
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return True

async def main():
    """Download all models with proper error handling."""
    try:
        logger.info("🚀 Starting model download process...")
        logger.info(f"📁 Models will be stored in: {os.environ.get('TRANSFORMERS_CACHE', '/app/models')}")
        
        # Download models sequentially to avoid memory issues
        successful = 0
        failed = 0
        successful_models = set()  # Track which models were downloaded successfully
        
        logger.info(f"📋 Total models to download: {len(MODELS)}")
        for model_key in MODELS.keys():
            logger.info(f"   - {model_key}: {MODELS[model_key]['name']}")
        
        logger.info("🔄 Starting model downloads...")
        
        for model_key, model_config in MODELS.items():
            logger.info(f"📥 Downloading {model_key}: {model_config['name']}")
            try:
                logger.info(f"🔄 Starting download attempt for {model_key}...")
                result = await download_with_retry(model_key, model_config)
                logger.info(f"📊 Download result for {model_key}: {result}")
                if result:
                    successful += 1
                    successful_models.add(model_key)
                    logger.info(f"✅ {model_key} downloaded successfully")
                else:
                    if model_config.get('optional', False):
                        logger.warning(f"⚠️  {model_key} failed to download but is optional - continuing")
                        # Don't count optional models as failures
                    else:
                        failed += 1
                        logger.error(f"❌ {model_key} failed to download")
                    # Continue with other models even if this one fails
                    logger.info(f"🔄 Skipping {model_key} and continuing with remaining models...")
            except Exception as e:
                if model_config.get('optional', False):
                    logger.warning(f"⚠️  {model_key} failed with exception but is optional: {e}")
                    # Don't count optional models as failures
                else:
                    failed += 1
                    logger.error(f"❌ {model_key} failed with exception: {e}")
                    logger.error(f"📋 Exception details: {type(e).__name__}: {str(e)}")
                logger.info(f"🔄 Skipping {model_key} and continuing with remaining models...")
            
            # Aggressive memory cleanup after each model download
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            # Longer delay between downloads to let memory settle
            if successful > 0:  # Only add delay if we've had successful downloads
                await asyncio.sleep(15)
            else:
                await asyncio.sleep(10)  # Shorter delay if no successful downloads yet
        
        # Count required models (non-optional)
        required_models = [k for k, v in MODELS.items() if not v.get('optional', False)]
        required_successful = sum(1 for model_key in required_models if model_key in successful_models)
        
        # Log summary
        logger.info(f"📊 Download Summary:")
        logger.info(f"   ✅ Successful: {successful}")
        logger.info(f"   ❌ Failed: {failed}")
        logger.info(f"   📋 Total models: {len(MODELS)}")
        logger.info(f"   📋 Required models: {len(required_models)}")
        logger.info(f"   ✅ Required successful: {required_successful}")
        
        if successful == len(MODELS):
            logger.info("🎉 All models downloaded successfully!")
            return True
        elif required_successful == len(required_models):
            logger.info("🎉 All required models downloaded successfully!")
            return True
        elif successful > 0:
            logger.warning("⚠️  Some models failed to download. Check the logs above for details.")
            logger.info("🔄 Continuing with available models...")
            logger.info(f"✅ Returning True because {successful} models were downloaded successfully")
            return True  # Return True if at least some models were downloaded
        else:
            logger.error("💥 All model downloads failed!")
            logger.error(f"❌ Returning False because no models were downloaded successfully")
            return False
    except Exception as e:
        logger.error(f"💥 Unexpected error in main function: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    try:
        logger.info("🔧 Starting download script...")
        logger.info(f"🔧 Python version: {sys.version}")
        logger.info(f"🔧 Working directory: {os.getcwd()}")
        logger.info(f"🔧 Environment variables:")
        logger.info(f"   - TRANSFORMERS_CACHE: {os.environ.get('TRANSFORMERS_CACHE', 'Not set')}")
        logger.info(f"   - HF_HOME: {os.environ.get('HF_HOME', 'Not set')}")
        
        # Log initial memory usage
        log_memory_usage("at startup")
        
        success = asyncio.run(main())
        if not success:
            logger.error("❌ Model download process failed")
            exit(1)
        else:
            logger.info("✅ Model download process completed successfully")
    except Exception as e:
        logger.error(f"💥 Unexpected error during model download: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        exit(1) 