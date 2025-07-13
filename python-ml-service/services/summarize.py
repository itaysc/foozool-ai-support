import os
import re
import logging
from typing import List

import torch
from transformers import pipeline
import gc

# Set up logging
logger = logging.getLogger(__name__)

# Set cache directory for transformers
cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/app/models')

# Lazy loading - don't load models at import time
summarizer = None

def get_summarizer():
    """Lazy load the summarization model only when needed."""
    global summarizer
    
    if summarizer is None:
        try:
            logger.info("Loading BART summarization model...")
            
            # Try to load with reduced memory usage - use the model that's actually downloaded
            summarizer = pipeline(
                "summarization",
                model="sshleifer/distilbart-cnn-6-6",  # Use the model from download script
                tokenizer="sshleifer/distilbart-cnn-6-6",
                device=-1,  # Force CPU usage to avoid GPU memory issues
                model_kwargs={
                    "cache_dir": cache_dir,
                    "low_cpu_mem_usage": True,
                    "torch_dtype": torch.float32  # Use float32 instead of float16
                }
            )
            logger.info("BART summarization model loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading BART summarization model: {e}")
            logger.info("Attempting to load with alternative configuration...")
            
            try:
                # Try with even more conservative settings
                summarizer = pipeline(
                    "summarization",
                    model="sshleifer/distilbart-cnn-6-6",
                    device=-1,
                    model_kwargs={
                        "cache_dir": cache_dir,
                        "low_cpu_mem_usage": True,
                        "torch_dtype": torch.float32
                    }
                )
                logger.info("BART summarization model loaded with alternative configuration.")
            except Exception as e2:
                logger.error(f"Failed to load BART model with alternative config: {e2}")
                logger.info("Trying fallback model...")
                
                try:
                    # Try with the original model as fallback
                    summarizer = pipeline(
                        "summarization",
                        model="facebook/bart-base-cnn",
                        device=-1,
                        model_kwargs={
                            "cache_dir": cache_dir,
                            "low_cpu_mem_usage": True,
                            "torch_dtype": torch.float32
                        }
                    )
                    logger.info("BART summarization model loaded with fallback model.")
                except Exception as e3:
                    logger.error(f"Failed to load any BART model: {e3}")
                    summarizer = None
    
    return summarizer


def simple_summarize(text: str, max_words: int = 50) -> str:
    """
    Simple fallback summarization that extracts key sentences.
    """
    # Remove extra whitespace and split into sentences
    text = re.sub(r'\s+', ' ', text.strip())
    sentences = re.split(r'[.!?]+', text)
    
    # Filter out very short sentences
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    if not sentences:
        return text[:max_words * 5] + "..." if len(text) > max_words * 5 else text
    
    # Take the first few sentences that fit within max_words
    summary = ""
    for sentence in sentences:
        if len(summary.split()) + len(sentence.split()) <= max_words:
            summary += sentence + ". "
        else:
            break
    
    return summary.strip() or text[:max_words * 5] + "..."


def preprocess_conversation(text: str, max_words: int = 700) -> str:
    """
    Preprocesses a Zendesk-style conversation.
    - Removes greetings/closings
    - Strips excessive line breaks and whitespace
    - Truncates to `max_words`
    """
    if not text:
        return ""
        
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


def summarize_text(text, max_summary_len=50, min_summary_len=10):
    from transformers import pipeline
    summarizer = pipeline('summarization', model='sshleifer/distilbart-cnn-6-6')
    result = summarizer(text, max_length=max_summary_len, min_length=min_summary_len, do_sample=False, truncation=True)
    del summarizer
    gc.collect()
    return result[0]['summary_text'] if result else ''


def summarize_texts(texts: List[str], max_summary_len: int = 50, min_summary_len: int = 10) -> List[str]:
    """
    Summarizes a list of text strings using the BART summarizer.
    Falls back to simple summarization if BART is not available.
    """
    # Lazy load the summarizer
    summarizer_instance = get_summarizer()
    
    if summarizer_instance is None:
        logger.warning("BART model not available, using fallback summarization")
        return [simple_summarize(text, max_summary_len) for text in texts]

    # Preprocess each conversation before summarization
    preprocessed_texts = [preprocess_conversation(text) for text in texts]

    # Calculate dynamic max_length and min_length based on input lengths
    summaries = []
    for i, text in enumerate(preprocessed_texts):
        try:
            # Tokenize the text to get actual token count
            tokens = summarizer_instance.tokenizer(text, return_tensors="pt", truncation=True)
            input_length = tokens['input_ids'].shape[1]
            
            # Adjust max_length to be less than input_length, with a minimum of 8
            dynamic_max_length = min(max_summary_len, max(8, input_length - 1))
            
            # Adjust min_length to be less than max_length, with a minimum of 5
            dynamic_min_length = min(min_summary_len, max(5, dynamic_max_length - 5))
            
            # Run summarization for this single text
            summary = summarizer_instance(
                text,
                max_length=dynamic_max_length,
                min_length=dynamic_min_length,
                do_sample=False,
                truncation=True
            )
            
            summaries.append(summary[0]["summary_text"])
            
        except Exception as e:
            logger.warning(f"Error summarizing text {i}, using fallback: {e}")
            summaries.append(simple_summarize(text, max_summary_len))

    return summaries

