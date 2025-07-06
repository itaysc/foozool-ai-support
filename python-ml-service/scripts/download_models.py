import asyncio
import logging
import os
import ssl
import certifi
import requests
from concurrent.futures import ThreadPoolExecutor
from transformers import DistilBertTokenizer, DistilBertModel, pipeline, AutoTokenizer, TFAutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
import torch
from huggingface_hub import HfFolder
from huggingface_hub.utils import HfHubHTTPError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_tf_intent_model():
    """Custom loader for TensorFlow intent model."""
    try:
        # Load the model explicitly as TensorFlow
        model = TFAutoModelForSequenceClassification.from_pretrained('Sarthak279/Intent', from_tf=True)
        tokenizer = AutoTokenizer.from_pretrained('Sarthak279/Intent')
        return pipeline('text-classification', model=model, tokenizer=tokenizer, local_files_only=False)
    except Exception as e:
        logger.error(f"Error loading TensorFlow intent model: {e}")
        raise

# Optimized model configurations - using smaller models where possible
MODELS = {
    'distilbert': {
        'name': 'distilbert-base-uncased',
        'type': 'transformers',
        'loader': lambda: DistilBertModel.from_pretrained('distilbert-base-uncased', local_files_only=False),
        'tokenizer': lambda: DistilBertTokenizer.from_pretrained('distilbert-base-uncased', local_files_only=False)
    },
    'intent_primary': {
        'name': 'vineetsharma/customer-support-intent-albert',
        'type': 'pipeline',
        'loader': lambda: pipeline('text-classification', model='vineetsharma/customer-support-intent-albert', local_files_only=False)
    },
    'intent_fallback': {
        'name': 'Sarthak279/Intent',
        'type': 'pipeline',
        'loader': load_tf_intent_model
    },
    'intent_final_fallback': {
        'name': 'distilbert-base-uncased-finetuned-sst-2-english',
        'type': 'pipeline',
        'loader': lambda: pipeline('text-classification', model='distilbert-base-uncased-finetuned-sst-2-english', local_files_only=False)
    },
    'summarization': {
        'name': 'facebook/bart-large-cnn',  # Correct model name
        'type': 'pipeline',
        'loader': lambda: pipeline('summarization', model='facebook/bart-large-cnn', local_files_only=False)
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

async def download_with_retry(model_key, model_config, max_retries=3, timeout=600):
    """Download a model with retries and fallback to local files."""
    retry_delay = 2
    last_error = None
    
    # Increase timeout for large models
    if 'large' in model_config['name'] or 'bart-large' in model_config['name']:
        timeout = 1200  # 20 minutes for large models
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
            # Set timeout for the download attempt
            import asyncio
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
    
    # Clear memory before each attempt
    import gc
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    # Try with SSL verification first
    try:
        if model_config['type'] == 'transformers':
            model = model_config['loader']()
            tokenizer = model_config['tokenizer']()
        elif model_config['type'] in ['pipeline', 'sentence_transformer']:
            model = model_config['loader']()
        logger.info(f"✅ Successfully downloaded {model_config['name']}")
        
        # Clear memory after successful download
        del model
        if 'tokenizer' in locals():
            del tokenizer
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
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
    logger.info("🚀 Starting model download process...")
    logger.info(f"📁 Models will be stored in: {os.environ.get('TRANSFORMERS_CACHE', '/app/models')}")
    
    # Download models sequentially to avoid memory issues
    successful = 0
    failed = 0
    
    for model_key, model_config in MODELS.items():
        logger.info(f"📥 Downloading {model_key}: {model_config['name']}")
        try:
            result = await download_with_retry(model_key, model_config)
            if result:
                successful += 1
                logger.info(f"✅ {model_key} downloaded successfully")
            else:
                failed += 1
                logger.error(f"❌ {model_key} failed to download")
                # Continue with other models even if this one fails
                logger.info(f"🔄 Skipping {model_key} and continuing with remaining models...")
        except Exception as e:
            failed += 1
            logger.error(f"❌ {model_key} failed with exception: {e}")
            logger.info(f"🔄 Skipping {model_key} and continuing with remaining models...")
        
        # Clear memory after each model download
        import gc
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Add delay between downloads to let memory settle
        if successful > 0:  # Only add delay if we've had successful downloads
            await asyncio.sleep(10)
        else:
            await asyncio.sleep(5)  # Shorter delay if no successful downloads yet
    
    # Log summary
    logger.info(f"📊 Download Summary:")
    logger.info(f"   ✅ Successful: {successful}")
    logger.info(f"   ❌ Failed: {failed}")
    
    if successful == len(MODELS):
        logger.info("🎉 All models downloaded successfully!")
        return True
    elif successful > 0:
        logger.warning("⚠️  Some models failed to download. Check the logs above for details.")
        logger.info("🔄 Continuing with available models...")
        return True  # Return True if at least some models were downloaded
    else:
        logger.error("💥 All model downloads failed!")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        exit(1) 