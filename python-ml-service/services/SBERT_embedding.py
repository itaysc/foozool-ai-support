import sys
import json
import torch
import os
from sentence_transformers import SentenceTransformer
from typing import List, Dict

# Set cache directory
cache_dir = os.environ.get('SENTENCE_TRANSFORMERS_HOME', '/app/models/sentence-transformers')

def get_embedded_text(tickets: List[Dict[str, str]], model_name='all-mpnet-base-v2') -> List[List[float]]:
    """
    all-MiniLM-L6-v2
    all-mpnet-base-v2
    Extract embeddings using SBERT (Sentence-BERT).
    """
    try:
        model = SentenceTransformer(model_name, cache_folder=cache_dir)
    except Exception as e:
        print(f"Error loading model {model_name}: {e}")
        raise RuntimeError(f"SentenceTransformer model {model_name} not available. Please check model loading.")
    
    embeddings = []
    for ticket in tickets:
        # Ensure 'subject' and 'description' are not None
        subject = ticket.get("subject", "")
        description = ticket.get("description", "")
        
        # Combine subject and description, safely handling None values
        combined_text = (subject or "") + " [SEP] " + (description or "")
        
        # Get the embedding
        # all-MiniLM-L6-v2 [384] size
        # all-mpnet-base-v2 [768] size
        combined_embedding = model.encode(combined_text, convert_to_tensor=True, normalize_embeddings=True)
        embeddings.append(combined_embedding.tolist())
    
    return embeddings

