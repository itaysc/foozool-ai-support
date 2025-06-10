# routers/user_router.py
from fastapi import APIRouter, HTTPException
from services.DistilBERT_embedding import get_distilbert_embeddings
from services.SBERT_embedding import get_embedded_text
from services.extract_keywords import extract_keywords_from_embedding
from services.summarize import summarize_texts
from services.answer import get_answer_from_tickets
from services.intent_classification import classify_ticket_intent
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np

router = APIRouter()

class Ticket(BaseModel):
    subject: str
    description: str
    embedding: Optional[List[float]] = None

class QuestionRequest(BaseModel):
    question: str
    tickets: List[Ticket]

@router.post("/distilbert-embed")
async def embed_ticket(tickets: list[dict[str, str]]):
    """
    API endpoint to generate DistilBERT embeddings for multiple tickets.
    """
    embeddings = get_distilbert_embeddings(tickets)
    return embeddings

@router.post("/sbert-embed")
async def sbert_embed_tickets(tickets: list[dict[str, str]]):
    """
    API endpoint to generate SBERT embeddings for multiple tickets.
    """
    embeddings = get_embedded_text(tickets)
    return embeddings

@router.post("/extract-keywords")
async def extract_ticket_keywords(ticket: Ticket):
    """
    API endpoint to extract relevant kewords from a ticket
    """
    ticket_embedding = np.array(ticket.embedding)
    keywords = extract_keywords_from_embedding(ticket.dict(), ticket_embedding)
    return keywords

@router.post("/summarize")
async def summarize_ticket_text(tickets: List[Ticket]):
    """
    API endpoint to summarize multiple ticket descriptions
    """
    try:
        # Combine subject and description for each ticket
        texts = [f"{ticket.subject} {ticket.description}" for ticket in tickets]
        
        # Get summaries for the list of texts
        summaries = summarize_texts(texts)
        
        # Return summaries with corresponding ticket ids or other identifiers if needed
        return summaries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/answer")
async def answer_question(request: QuestionRequest):
    """
    API endpoint to answer a question based on a list of tickets.
    """
    try:
        answer = get_answer_from_tickets(request.question, [ticket.dict() for ticket in request.tickets])
        return answer
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/classify-intent")
async def classify_intent(ticket: Ticket):
    """
    API endpoint to classify the intent of a support ticket.
    """
    try:
        intents = classify_ticket_intent(ticket.subject, ticket.description)
        return intents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
