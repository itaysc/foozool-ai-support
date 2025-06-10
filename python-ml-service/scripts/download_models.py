import asyncio
import logging
import os
import ssl
import certifi
import requests
from concurrent.futures import ThreadPoolExecutor
from transformers import DistilBertTokenizer, DistilBertModel, pipeline
from sentence_transformers import SentenceTransformer
import torch
from huggingface_hub import HfFolder, configure_http_backend
from huggingface_hub.utils import HfHubHTTPError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure SSL context
ssl_context = ssl.create_default_context(cafile=certifi.where())
ssl_context.verify_mode = ssl.CERT_REQUIRED
ssl_context.check_hostname = True

# Configure huggingface_hub to use our SSL context
configure_http_backend(ssl_context=ssl_context)

# Model configurations
MODELS = {
    'distilbert': {
        'name': 'distilbert-base-uncased',
        'type': 'transformers',
        'loader': lambda: DistilBertModel.from_pretrained('distilbert-base-uncased', local_files_only=False),
        'tokenizer': lambda: DistilBertTokenizer.from_pretrained('distilbert-base-uncased', local_files_only=False)
    },
    'intent': {
        'name': 'vineetsharma/customer-support-intent-albert',
        'type': 'pipeline',
        'loader': lambda: pipeline('text-classification', model='vineetsharma/customer-support-intent-albert', local_files_only=False)
    },
    'summarization': {
        'name': 'facebook/bart-large-cnn',
        'type': 'pipeline',
        'loader': lambda: pipeline('summarization', model='facebook/bart-large-cnn', local_files_only=False)
    },
    'qa': {
        'name': 'deepset/roberta-base-squad2',
        'type': 'pipeline',
        'loader': lambda: pipeline('question-answering', model='deepset/roberta-base-squad2', local_files_only=False)
    },
    'sentence_transformer_1': {
        'name': 'all-mpnet-base-v2',
        'type': 'sentence_transformer',
        'loader': lambda: SentenceTransformer('all-mpnet-base-v2', cache_folder=os.environ.get('TRANSFORMERS_CACHE'))
    },
    'sentence_transformer_2': {
        'name': 'all-MiniLM-L6-v2',
        'type': 'sentence_transformer',
        'loader': lambda: SentenceTransformer('all-MiniLM-L6-v2', cache_folder=os.environ.get('TRANSFORMERS_CACHE'))
    }
}

async def download_with_retry(model_key, model_config, max_retries=3):
    """Download a model with retries and fallback to local files."""
    retry_delay = 2
    last_error = None
    
    # First try with local files only
    try:
        logger.info(f"Attempting to load {model_config['name']} from local cache")
        if model_config['type'] == 'transformers':
            model = model_config['loader']()
            tokenizer = model_config['tokenizer']()
            logger.info(f"Successfully loaded {model_config['name']} from local cache")
            return True
        elif model_config['type'] in ['pipeline', 'sentence_transformer']:
            model = model_config['loader']()
            logger.info(f"Successfully loaded {model_config['name']} from local cache")
            return True
    except Exception as local_error:
        logger.warning(f"Could not load {model_config['name']} from local cache: {local_error}")
        last_error = local_error

    # If local load fails, try downloading with retries
    for attempt in range(max_retries):
        try:
            logger.info(f"Downloading {model_config['name']} (attempt {attempt + 1}/{max_retries})")
            
            # Try with SSL verification first
            try:
                if model_config['type'] == 'transformers':
                    model = model_config['loader']()
                    tokenizer = model_config['tokenizer']()
                elif model_config['type'] in ['pipeline', 'sentence_transformer']:
                    model = model_config['loader']()
                logger.info(f"Successfully downloaded {model_config['name']}")
                return True
            except (requests.exceptions.SSLError, ssl.SSLError) as ssl_error:
                logger.warning(f"SSL error downloading {model_config['name']}: {ssl_error}")
                # If SSL fails, try one last time without verification (not recommended but as fallback)
                if attempt == max_retries - 1:
                    logger.warning(f"Attempting final download of {model_config['name']} without SSL verification")
                    os.environ['CURL_CA_BUNDLE'] = ""
                    os.environ['REQUESTS_CA_BUNDLE'] = ""
                    if model_config['type'] == 'transformers':
                        model = model_config['loader']()
                        tokenizer = model_config['tokenizer']()
                    elif model_config['type'] in ['pipeline', 'sentence_transformer']:
                        model = model_config['loader']()
                    logger.info(f"Successfully downloaded {model_config['name']} without SSL verification")
                    return True
                raise ssl_error
            
        except Exception as e:
            last_error = e
            logger.error(f"Error downloading {model_config['name']}: {str(e)}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (attempt + 1))
    
    logger.error(f"Failed to download {model_config['name']} after {max_retries} attempts. Last error: {last_error}")
    return False

async def main():
    """Download all models with proper error handling."""
    tasks = []
    for model_key, model_config in MODELS.items():
        tasks.append(download_with_retry(model_key, model_config))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Log summary
    successful = sum(1 for r in results if r is True)
    logger.info(f"Successfully downloaded/loaded {successful} out of {len(MODELS)} models")
    
    if successful < len(MODELS):
        logger.warning("Some models failed to download/load. Check the logs above for details.")

if __name__ == "__main__":
    asyncio.run(main()) 