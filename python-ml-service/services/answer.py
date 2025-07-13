from transformers import pipeline
import logging
import os
import gc

# Set up logging
logger = logging.getLogger(__name__)

# Set cache directory
cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/app/models')

# Lazy loading - don't load models at import time
qa_pipeline = None

def get_qa_pipeline():
    """Lazy load the QA model only when needed."""
    global qa_pipeline
    
    if qa_pipeline is None:
        try:
            qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")
            logger.info("DistilBERT QA model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading DistilBERT QA model: {e}")
            qa_pipeline = None
    
    return qa_pipeline

def answer_question(question, context):
    from transformers import pipeline
    qa = pipeline('question-answering', model='distilbert-base-cased-distilled-squad')
    result = qa({'question': question, 'context': context})
    del qa
    gc.collect()
    return result

def get_answer_from_tickets(question, tickets):
    """
    Answers a question based on the content of multiple support tickets.
    """
    # Lazy load the QA pipeline
    qa_instance = get_qa_pipeline()
    if qa_instance is None:
        raise RuntimeError("Question-answering model not available. Please check model loading.")
    
    # Combine all ticket information into a single context
    context = " ".join([f"{ticket.get('subject', '')} {ticket.get('description', '')}" for ticket in tickets])
    
    # Get the answer using the QA pipeline
    answer = qa_instance(question=question, context=context)
    
    return answer