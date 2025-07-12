from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging
from sentence_transformers import SentenceTransformer

# Set up logging
logger = logging.getLogger(__name__)

# Lazy loading - don't load models at import time
_keyword_model = None

def get_keyword_model():
    """Lazy load the keyword extraction model only when needed."""
    global _keyword_model
    
    if _keyword_model is None:
        try:
            _keyword_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Keyword extraction model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading keyword extraction model: {e}")
            _keyword_model = None
    
    return _keyword_model

def extract_keywords_from_embedding(ticket, embedding, top_n=5):
    """
    Extracts key phrases from a ticket using its SBERT embedding.
    
    :param ticket: Dictionary containing 'subject' and 'description'.
    :param embedding: Precomputed SBERT embedding (numpy array).
    :param top_n: Number of key phrases to return.
    :return: List of extracted key phrases.
    """
    try:
        # Lazy load the model
        model = get_keyword_model()
        if model is None:
            return []
        
        text = f"{ticket['subject']} {ticket['description']}".strip()

        # Tokenize and get unique words
        words = list(set(text.lower().split()))
        if not words:
            return []  # No keywords to extract

        # Ensure embedding is 2D
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)

        # ✅ Encode each word using SBERT
        word_embeddings = np.array([model.encode(word) for word in words])

        if word_embeddings.size == 0:  # No valid words
            return []

        # Compute cosine similarity
        similarities = cosine_similarity(embedding, word_embeddings)[0]

        # Get the top N words based on similarity scores
        top_indices = np.argsort(similarities)[-top_n:][::-1]
        top_keywords = [words[i] for i in top_indices]

        return top_keywords

    except Exception as e:
        logger.error(f"Error in extract_keywords_from_embedding: {str(e)}")
        return []  # Return empty list on failure
