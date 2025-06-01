from transformers import pipeline
import torch
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load intent classification model
# Try customer-specific intent classification models first
try:
    intent_classifier = pipeline(
        "text-classification",
        model="vineetsharma/customer-support-intent-albert",
        return_all_scores=True,
        device=0 if torch.cuda.is_available() else -1
    )
    logger.info("Loaded customer support intent classification model")
except Exception as e:
    logger.warning(f"Could not load customer support model, trying general intent model: {e}")
    try:
        intent_classifier = pipeline(
            "text-classification",
            model="Sarthak279/Intent",
            return_all_scores=True,
            device=0 if torch.cuda.is_available() else -1
        )
        logger.info("Loaded general intent classification model")
    except Exception as e:
        logger.warning(f"Could not load intent models, falling back to text classification: {e}")
        # Last fallback to a general text classification model (not sentiment-specific)
        intent_classifier = pipeline(
            "text-classification",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            return_all_scores=True,
            device=0 if torch.cuda.is_available() else -1
        )
        logger.info("Using general text classification model as fallback")

# Define common support ticket intent categories
INTENT_MAPPING = {
    # Sentiment-based mappings (if using fallback model)
    "POSITIVE": "satisfaction_praise",
    "NEGATIVE": "complaint_issue", 
    "NEUTRAL": "information_request",
    
    # Customer support specific intents (for proper intent models)
    "TECH_ISSUE": "technical_support",
    "BILLING_ISSUE": "billing_inquiry", 
    "ACCOUNT_ISSUE": "account_management",
    "FEATURE_REQUEST": "feature_request",
    "GENERAL_INQUIRY": "general_inquiry",
    "REFUND_REQUEST": "refund_request",
    "CANCELLATION_REQUEST": "cancellation_request",
    "INFORMATION_REQUEST": "information_request",
    "OTHER": "other",
    
    # Intent labels from Sarthak279/Intent model
    "get_refund": "refund_request",
    "change_order": "order_management",
    "contact_customer_service": "general_inquiry",
    "recover_password": "account_management",
    "create_account": "account_management",
    "check_invoices": "billing_inquiry",
    "payment_issue": "billing_inquiry",
    "place_order": "order_management",
    "delete_account": "account_management",
    "set_up_shipping_address": "order_management",
    "delivery_options": "order_management",
    "track_order": "order_management",
    "change_shipping_address": "order_management",
    "track_refund": "refund_request",
    "check_refund_policy": "information_request",
    "review": "feedback",
    "contact_human_agent": "escalation",
    "delivery_period": "information_request",
    "edit_account": "account_management",
    "registration_problems": "technical_support",
    "get_invoice": "billing_inquiry",
    "switch_account": "account_management",
    "cancel_order": "cancellation_request",
    "check_payment_methods": "information_request",
    "check_cancellation_fee": "information_request",
    "newsletter_subscription": "general_inquiry",
    "complaint": "complaint_issue"
}

def classify_ticket_intent(subject, description):
    """
    Classifies the intent of a support ticket based on subject and description.
    
    :param subject: The subject/title of the support ticket
    :param description: The detailed description of the support ticket
    :return: List of dictionaries with 'intent' and 'probability' keys
    """
    try:
        # Combine subject and description for better context
        ticket_text = f"{subject}. {description}".strip()
        
        if not ticket_text:
            logger.warning("Empty ticket text provided")
            return [{"intent": "unknown", "probability": 1.0}]
        
        # Get predictions from the model
        predictions = intent_classifier(ticket_text)
        
        # Convert to our expected format
        results = []
        for pred in predictions:
            # Map model labels to meaningful intent names
            intent_name = INTENT_MAPPING.get(pred['label'], pred['label'].lower())
            
            results.append({
                "intent": intent_name,
                "probability": round(pred['score'], 4)
            })
        
        # Sort by probability (highest first)
        results.sort(key=lambda x: x['probability'], reverse=True)
        
        # Enhanced intent classification based on keywords
        enhanced_results = _enhance_intent_classification(ticket_text, results)
        
        return enhanced_results
        
    except Exception as e:
        logger.error(f"Error classifying ticket intent: {e}")
        return [{"intent": "classification_error", "probability": 1.0}]

def _enhance_intent_classification(text, base_results):
    """
    Enhance intent classification with keyword-based rules for better accuracy.
    """
    text_lower = text.lower()
    
    # Define keyword patterns for different intents
    intent_keywords = {
        "technical_support": [
            "error", "bug", "crash", "not working", "broken", "issue", "problem",
            "malfunction", "glitch", "fails", "unable to", "can't", "doesn't work"
        ],
        "billing_inquiry": [
            "bill", "payment", "charge", "invoice", "refund", "money", "cost",
            "price", "subscription", "upgrade", "downgrade", "billing"
        ],
        "account_management": [
            "account", "login", "password", "username", "access", "permissions",
            "profile", "settings", "delete account", "close account"
        ],
        "feature_request": [
            "feature", "add", "new", "enhancement", "improvement", "suggestion",
            "would like", "could you", "please add", "wish", "want"
        ],
        "complaint_issue": [
            "disappointed", "terrible", "awful", "worst", "hate", "angry",
            "frustrated", "unacceptable", "poor", "bad service"
        ],
        "information_request": [
            "how to", "how do", "what is", "where is", "when", "why",
            "help", "guide", "tutorial", "documentation", "explain"
        ],
        "refund_request": [
            "refund", "money back", "return money", "get my money back",
            "cancel payment", "reverse charge"
        ],
        "cancellation_request": [
            "cancel", "cancellation", "stop service", "end subscription",
            "terminate", "close", "discontinue"
        ],
        "order_management": [
            "order", "delivery", "shipping", "track", "tracking number",
            "when will", "status", "change order", "modify order"
        ]
    }
    
    # Calculate keyword-based scores
    keyword_scores = {}
    for intent, keywords in intent_keywords.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            normalized_score = min(score / len(keywords) * 2, 0.9)
            keyword_scores[intent] = normalized_score
    
    # Add keyword-based results
    enhanced_results = []
    for intent, score in keyword_scores.items():
        enhanced_results.append({
            "intent": intent,
            "probability": round(score, 4)
        })
    
    # Return ML results if no keyword matches
    if not keyword_scores:
        return base_results[:3]
    
    # Merge and deduplicate results
    all_intents = {}
    
    # Add keyword results first (higher priority)
    for result in enhanced_results:
        all_intents[result["intent"]] = result["probability"]
    
    # Add ML results if not already present
    for result in base_results[:2]:
        intent = result["intent"]
        if intent not in all_intents:
            adjusted_prob = result["probability"] * 0.7
            all_intents[intent] = adjusted_prob
    
    # Convert back to list format and sort
    final_results = [
        {"intent": intent, "probability": prob}
        for intent, prob in all_intents.items()
    ]
    
    final_results.sort(key=lambda x: x['probability'], reverse=True)
    
    return final_results[:5] 