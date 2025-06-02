from transformers import pipeline
import os

# Set cache directory
cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/app/models')

# Load the QA model with error handling
try:
    qa_pipeline = pipeline("question-answering", model="deepset/roberta-base-squad2")
    print("RoBERTa QA model loaded successfully")
except Exception as e:
    print(f"Error loading RoBERTa QA model: {e}")
    qa_pipeline = None

def get_answer_from_tickets(question, tickets):
    """
    Answers a question based on the content of multiple support tickets.
    """
    if qa_pipeline is None:
        raise RuntimeError("Question-answering model not available. Please check model loading.")
    
    # Combine all ticket information into a single context
    context = " ".join([f"{ticket.get('subject', '')} {ticket.get('description', '')}" for ticket in tickets])
    
    # Get the answer using the QA pipeline
    answer = qa_pipeline(question=question, context=context)
    
    return answer