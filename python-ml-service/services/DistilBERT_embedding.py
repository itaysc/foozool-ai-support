import torch
from transformers import DistilBertTokenizer, DistilBertModel
import os

# Set cache directory for models
cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/app/models')

# Load DistilBERT model and tokenizer with proper error handling
try:
    distilbert_model = DistilBertModel.from_pretrained(
        "distilbert-base-uncased",
        cache_dir=cache_dir,
        local_files_only=False  # Try online first, fallback to local
    )
    distilbert_tokenizer = DistilBertTokenizer.from_pretrained(
        "distilbert-base-uncased",
        cache_dir=cache_dir,
        local_files_only=False
    )
    print("DistilBERT model loaded successfully")
except Exception as e:
    print(f"Error loading DistilBERT model: {e}")
    # Try loading from local cache only
    try:
        distilbert_model = DistilBertModel.from_pretrained(
            "distilbert-base-uncased",
            cache_dir=cache_dir,
            local_files_only=True
        )
        distilbert_tokenizer = DistilBertTokenizer.from_pretrained(
            "distilbert-base-uncased",
            cache_dir=cache_dir,
            local_files_only=True
        )
        print("DistilBERT model loaded from local cache")
    except Exception as local_e:
        print(f"Failed to load DistilBERT model from cache: {local_e}")
        distilbert_model = None
        distilbert_tokenizer = None

def get_distilbert_embeddings(tickets):
    """
    Generates DistilBERT CLS token embeddings for an array of tickets.
    """
    if distilbert_model is None or distilbert_tokenizer is None:
        raise RuntimeError("DistilBERT model not available. Please check model loading.")
    
    embeddings = []
    
    for ticket in tickets:
        subject = ticket.get("subject", "")
        description = ticket.get("description", "")
        combined_text = f"{subject} [SEP] {description}"
        
        # Tokenize
        tokens = distilbert_tokenizer(combined_text, return_tensors="pt", truncation=True, padding=True)
        
        # Generate DistilBERT embeddings
        with torch.no_grad():
            output = distilbert_model(**tokens)
        
        # Extract CLS token embedding
        cls_embedding = output.last_hidden_state[:, 0, :].squeeze().tolist()
        embeddings.append(cls_embedding)
    
    return embeddings
