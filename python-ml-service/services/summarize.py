import os
import re
from typing import List

import torch
from transformers import pipeline

# Set cache directory for transformers
cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/app/models')

# Load the summarization model
try:
    summarizer = pipeline(
        "summarization",
        model="facebook/bart-large-cnn",
        tokenizer="facebook/bart-large-cnn",
        device=0 if torch.cuda.is_available() else -1,  # Use GPU if available
        model_kwargs={"cache_dir": cache_dir}
    )
    print("✅ BART summarization model loaded.")
except Exception as e:
    print(f"❌ Error loading summarization model: {e}")
    summarizer = None


def preprocess_conversation(text: str, max_words: int = 700) -> str:
    """
    Preprocesses a Zendesk-style conversation.
    - Removes greetings/closings
    - Strips excessive line breaks and whitespace
    - Truncates to `max_words`
    """
    greetings = re.compile(r"\b(hi|hello|hey|dear|good (morning|afternoon|evening))\b[:,]?", re.IGNORECASE)
    closings = re.compile(r"\b(thank[s]?|regards|best|cheers|sincerely)\b[:,]?", re.IGNORECASE)

    lines = text.splitlines()
    cleaned = []
    for line in lines:
        line = line.strip()
        if not line or greetings.match(line) or closings.match(line):
            continue
        cleaned.append(line)

    cleaned_text = " ".join(cleaned)
    words = cleaned_text.split()
    return " ".join(words[:max_words])


def summarize_texts(texts: List[str], max_summary_len: int = 50, min_summary_len: int = 10) -> List[str]:
    """
    Summarizes a list of text strings using the BART summarizer.
    Each text is preprocessed before summarization.
    """
    if summarizer is None:
        raise RuntimeError("Summarization model not available.")

    # Preprocess each conversation before summarization
    preprocessed_texts = [preprocess_conversation(text) for text in texts]

    # Calculate dynamic max_length and min_length based on input lengths
    summaries = []
    for text in preprocessed_texts:
        # Tokenize the text to get actual token count
        tokens = summarizer.tokenizer(text, return_tensors="pt", truncation=True)
        input_length = tokens['input_ids'].shape[1]
        
        # Adjust max_length to be less than input_length, with a minimum of 8
        dynamic_max_length = min(max_summary_len, max(8, input_length - 1))
        
        # Adjust min_length to be less than max_length, with a minimum of 5
        dynamic_min_length = min(min_summary_len, max(5, dynamic_max_length - 5))
        
        # Run summarization for this single text
        summary = summarizer(
            text,
            max_length=dynamic_max_length,
            min_length=dynamic_min_length,
            do_sample=False,
            truncation=True
        )
        
        summaries.append(summary[0]["summary_text"])

    return summaries

