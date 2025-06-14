import os
import gc
import torch
from sentence_transformers import SentenceTransformer
from typing import List, Dict
from functools import lru_cache

# Set cache directory
cache_dir = os.environ.get('SENTENCE_TRANSFORMERS_HOME', '/app/models/sentence-transformers')

# Global model instance
_model = None

def get_model(model_name='all-mpnet-base-v2') -> SentenceTransformer:
    """
    Get or create the model instance. Uses a singleton pattern to avoid reloading.
    """
    global _model
    if _model is None:
        try:
            # Clear any existing model from memory
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()
            
            # Load the model
            _model = SentenceTransformer(model_name, cache_folder=cache_dir)
            
            # Set model to evaluation mode
            _model.eval()
            
            # Move to CPU and use float32 for better memory efficiency
            _model = _model.to('cpu')
            _model.half()  # Use float16 instead of float32
            
            print(f"Model {model_name} loaded successfully")
        except Exception as e:
            print(f"Error loading model {model_name}: {e}")
            raise RuntimeError(f"SentenceTransformer model {model_name} not available. Please check model loading.")
    
    return _model

@lru_cache(maxsize=1000)
def get_cached_embedding(text: str, model_name='all-mpnet-base-v2') -> List[float]:
    """
    Get embedding for a single text with caching.
    """
    model = get_model(model_name)
    with torch.no_grad():  # Disable gradient calculation
        embedding = model.encode(text, convert_to_tensor=True, normalize_embeddings=True)
        return embedding.tolist()

def get_embedded_text(tickets: List[Dict[str, str]], model_name='all-mpnet-base-v2') -> List[List[float]]:
    """
    Extract embeddings using SBERT (Sentence-BERT).
    Uses caching and memory-efficient processing.
    """
    embeddings = []
    model = get_model(model_name)
    
    # Process in smaller batches to manage memory
    batch_size = 5
    for i in range(0, len(tickets), batch_size):
        batch = tickets[i:i + batch_size]
        batch_texts = []
        
        for ticket in batch:
            # Ensure 'subject' and 'description' are not None
            subject = ticket.get("subject", "")
            description = ticket.get("description", "")
            
            # Combine subject and description, safely handling None values
            combined_text = (subject or "") + " [SEP] " + (description or "")
            batch_texts.append(combined_text)
        
        # Get embeddings for the batch
        with torch.no_grad():  # Disable gradient calculation
            batch_embeddings = model.encode(
                batch_texts,
                convert_to_tensor=True,
                normalize_embeddings=True,
                show_progress_bar=False
            )
            embeddings.extend(batch_embeddings.tolist())
        
        # Clear memory after each batch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
    
    return embeddings

def clear_model_cache():
    """
    Clear the model cache and free memory.
    """
    global _model
    if _model is not None:
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        del _model
        _model = None
    gc.collect()

