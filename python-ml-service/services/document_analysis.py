"""
Document Analysis Service
Handles document classification, sentiment analysis, and topic extraction
"""

from typing import List, Dict, Optional
from services.intent_classification import classify_ticket_intent
from services.summarize import summarize_texts


def analyze_document(title: str, content: str, document_type: str, mime_type: Optional[str] = None) -> Dict:
    """
    Analyze a single document using ML models.
    Returns category, topics, sentiment, entities, summary, and confidence.
    """
    try:
        # Use existing intent classification for basic categorization
        intents = classify_ticket_intent(title, content)
        
        # Use existing summarization for document summary
        summaries = summarize_texts([f"{title} {content}"])
        
        # Basic topic extraction (can be enhanced)
        topics = intents if intents else ["general"]
        
        # Simple sentiment analysis (can be enhanced with dedicated model)
        sentiment = analyze_sentiment(content)
        
        # Basic business relevance scoring
        business_relevance = calculate_business_relevance(document_type, content)
        
        # Basic entity extraction (can be enhanced with NER model)
        key_entities = extract_basic_entities(content)
        
        # Simple confidence scoring
        confidence = calculate_confidence(content, intents)
        
        return {
            "category": intents[0] if intents else "general",
            "topics": topics,
            "sentiment": sentiment,
            "businessRelevance": business_relevance,
            "keyEntities": key_entities,
            "summary": summaries[0] if summaries else "Document summary not available",
            "confidence": confidence
        }
        
    except Exception as e:
        # Return default analysis on error
        return {
            "category": "unknown",
            "topics": [],
            "sentiment": "neutral",
            "businessRelevance": 0.5,
            "keyEntities": {
                "people": [],
                "companies": [],
                "products": [],
                "locations": []
            },
            "summary": "Analysis failed - unable to process document",
            "confidence": 0.0
        }


def classify_documents_batch(documents: List[Dict]) -> List[str]:
    """
    Classify multiple documents quickly (pre-classification).
    Returns list of categories for each document.
    """
    categories = []
    
    for doc in documents:
        try:
            # Use existing intent classification for fast categorization
            intents = classify_ticket_intent(doc["title"], doc["content"])
            category = intents[0] if intents else "general"
            categories.append(category)
        except Exception:
            categories.append("unknown")
    
    return categories


def extract_document_topics_batch(documents: List[Dict]) -> List[List[str]]:
    """
    Extract topics from multiple documents.
    Returns list of topic lists for each document.
    """
    all_topics = []
    
    for doc in documents:
        try:
            # Use existing intent classification for topic extraction
            intents = classify_ticket_intent(doc["title"], doc["content"])
            topics = intents if intents else ["general"]
            all_topics.append(topics)
        except Exception:
            all_topics.append(["unknown"])
    
    return all_topics


def analyze_sentiment(content: str) -> str:
    """
    Basic sentiment analysis using keyword matching.
    Can be enhanced with dedicated sentiment analysis model.
    """
    content_lower = content.lower()
    
    positive_words = ["good", "great", "excellent", "happy", "satisfied", "love", "amazing", "perfect", "wonderful"]
    negative_words = ["bad", "terrible", "awful", "angry", "frustrated", "issue", "problem", "hate", "worst", "disappointed"]
    
    positive_count = sum(1 for word in positive_words if word in content_lower)
    negative_count = sum(1 for word in negative_words if word in content_lower)
    
    if positive_count > negative_count:
        return "positive"
    elif negative_count > positive_count:
        return "negative"
    else:
        return "neutral"


def calculate_business_relevance(document_type: str, content: str) -> float:
    """
    Calculate business relevance score based on document type and content.
    Returns score between 0.0 and 1.0.
    """
    base_scores = {
        "meeting_summary": 0.8,
        "customer_feedback": 0.8,
        "support_issue": 0.8,
        "note": 0.6,
        "report": 0.6,
        "google_doc": 0.5,
        "link": 0.4,
        "other": 0.3
    }
    
    base_score = base_scores.get(document_type, 0.5)
    
    # Boost score for certain keywords
    content_lower = content.lower()
    business_keywords = ["customer", "client", "meeting", "issue", "problem", "feature", "requirement", "feedback"]
    
    keyword_count = sum(1 for keyword in business_keywords if keyword in content_lower)
    keyword_boost = min(keyword_count * 0.05, 0.2)  # Max 0.2 boost
    
    return min(base_score + keyword_boost, 1.0)


def extract_basic_entities(content: str) -> Dict[str, List[str]]:
    """
    Basic entity extraction using simple patterns.
    Can be enhanced with dedicated NER model.
    """
    # This is a placeholder implementation
    # In a real scenario, you would use spaCy, NLTK, or a transformer-based NER model
    
    entities = {
        "people": [],
        "companies": [],
        "products": [],
        "locations": []
    }
    
    # Basic patterns (can be enhanced)
    content_lower = content.lower()
    
    # Look for email patterns (potential people)
    import re
    emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', content)
    entities["people"].extend(emails)
    
    # Look for company-like words (capitalized, multiple words)
    company_patterns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)
    entities["companies"].extend(company_patterns[:5])  # Limit to 5
    
    return entities


def calculate_confidence(content: str, intents: List[str]) -> float:
    """
    Calculate confidence score based on content quality and classification results.
    Returns score between 0.0 and 1.0.
    """
    confidence = 0.5  # Base confidence
    
    # Boost confidence for longer, more detailed content
    if len(content) > 200:
        confidence += 0.2
    elif len(content) > 100:
        confidence += 0.1
    
    # Boost confidence if we got clear intents
    if intents and len(intents) > 0:
        confidence += 0.2
    
    # Boost confidence for structured content
    if any(marker in content for marker in ["•", "-", "1.", "2.", "3."]):
        confidence += 0.1
    
    return min(confidence, 1.0)
