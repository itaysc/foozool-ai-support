from transformers import pipeline
import os

# Set cache directory
cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/app/models')

# Load the summarization model with error handling
try:
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    print("BART summarization model loaded successfully")
except Exception as e:
    print(f"Error loading BART model: {e}")
    summarizer = None

def summarize_text(texts):
    """
    Summarizes an array of texts.
    :param texts: List of strings to summarize.
    :return: List of summarized texts.
    """
    if summarizer is None:
        raise RuntimeError("Summarization model not available. Please check model loading.")
    
    summaries = []

    for text in texts:
        if text.strip():  # Ensure the text is not empty
            input_length = len(text.split())

            # Dynamically set max_length (at most half of input length, minimum 10)
            max_length = min(50, max(10, input_length // 2))
            min_length = max(5, max_length // 2)  # Ensure a reasonable min_length

            summary = summarizer(
                text,
                max_length=max_length,
                min_length=min_length,
                do_sample=False
            )
            summaries.append(summary[0]["summary_text"])
        else:
            summaries.append("")  # Handle empty text gracefully

    return summaries
