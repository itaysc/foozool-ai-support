from transformers import pipeline
import torch
import logging
import os
import re
from typing import List, Dict, Tuple, Set
from collections import defaultdict, Counter

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set cache directory
cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/app/models')

# Load intent classification model with proper error handling
intent_classifier = None

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
        try:
            # Last fallback to a general text classification model (not sentiment-specific)
            intent_classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                return_all_scores=True,
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info("Using general text classification model as fallback")
        except Exception as fallback_e:
            logger.error(f"Failed to load any classification model: {fallback_e}")
            intent_classifier = None

# Enhanced intent mapping with synonyms and variations
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

# Enhanced phrase-based patterns for better context understanding
PHRASE_PATTERNS = {
    "refund_request": [
        r"\b(want|need|would like)\s+(a\s+)?refund\b",
        r"\bget\s+my\s+money\s+back\b",
        r"\breturn\s+(this|the|my)\s+(item|product|order|purchase)\b",
        r"\bmoney\s+back\s+guarantee\b",
        r"\brefund\s+(my|the)\s+(order|payment|purchase)\b",
        r"\bcompensation\s+for\b",
        r"\breimbursement\s+for\b",
        # Added more comprehensive money-related patterns
        r"\b(want|need|give me)\s+my\s+money\b",
        r"\b(want|need)\s+my\s+money\s+back\b",
        r"\bgive\s+me\s+my\s+money\s+back\b",
        r"\breturn\s+my\s+money\b",
        r"\bmoney\s+returned\b",
        r"\bpay\s+me\s+back\b",
        r"\bowe\s+me\s+money\b",
        r"\b(want|need)\s+(the|my)\s+money\s+(back|returned)\b",
        r"\b(want|expect)\s+(full|complete)?\s*refund\b",
        r"\bmoney\s+back\s+now\b"
    ],
    "information_request": [
        r"\b(how\s+(can|do|to)|what\s+is|where\s+is|when|why)\b.*\?",
        r"\b(can\s+you\s+tell|could\s+you\s+explain|help\s+me\s+understand)\b",
        r"\bneed\s+(help|assistance|guidance)\s+(with|on|for)\b",
        r"\b(show\s+me|guide\s+me|walk\s+me\s+through)\b",
        r"\b(instructions|tutorial|guide)\s+(for|on|about)\b",
        r"\bhow\s+(can\s+i|do\s+i|to)\s+(turn\s+on|enable|activate|use|set\s+up)\b",
        r"\bwhat\s+(is\s+the|are\s+the)\s+(steps|way|process)\b",
        r"\bcan\s+(someone|you)\s+(help|explain|show)\b"
    ],
    "cancellation_request": [
        r"\b(want|need|would like)\s+to\s+cancel\b",
        r"\bcancel\s+(my|the|this)\s+(order|subscription|account|service)\b",
        r"\bstop\s+(my|the)\s+(subscription|service|billing)\b",
        r"\bunsubscribe\s+from\b",
        r"\bterminate\s+(my|the)\s+(account|service)\b",
        r"\bend\s+(my|the)\s+(subscription|membership)\b"
    ],
    "technical_support": [
        r"\b(not|isn\'t|doesn\'t)\s+(working|functioning|loading)\b",
        r"\b(can\'t|cannot)\s+(login|access|use|connect)\b",
        r"\berror\s+(message|code|when)\b",
        r"\b(website|app|system)\s+(is\s+)?(down|broken|slow)\b",
        r"\bkeeps\s+(crashing|freezing|failing)\b",
        r"\btechnical\s+(issue|problem|difficulty)\b",
        r"\bbug\s+in\s+(the|your)\b",
        # Enhanced technical patterns
        r"\b(it|this|product|device)\s+(doesn\'t|does not|won\'t|will not)\s+work\b",
        r"\bbroken\s+(product|item|device|camera|phone)\b",
        r"\b(defective|faulty)\s+(product|item|device)\b"
    ],
    "billing_inquiry": [
        r"\bwrong\s+(charge|amount|billing)\b",
        r"\bunauthorized\s+(charge|payment|transaction)\b",
        r"\bbilling\s+(error|mistake|issue|problem)\b",
        r"\bcharge\s+(me|my card)\s+(twice|again)\b",
        r"\b(subscription|payment)\s+not\s+working\b",
        r"\binvoice\s+(question|issue|problem)\b"
    ],
    "escalation": [
        r"\bspeak\s+(to|with)\s+(a\s+)?(manager|supervisor)\b",
        r"\b(this\s+is\s+)?(ridiculous|unacceptable|outrageous)\b",
        r"\bneed\s+(to\s+)?(escalate|speak\s+to\s+someone)\b",
        r"\bhuman\s+(agent|representative|person)\b",
        r"\b(urgent|emergency|asap|immediately)\b.*\b(help|assistance)\b",
        # Enhanced urgency patterns  
        r"\b(quickly|urgent|asap|immediately|right now)\b.*\b(want|need|help)\b",
        r"\bneed\s+(this|help|assistance)\s+(quickly|urgently|asap|now)\b"
    ],
    "complaint_issue": [
        r"\b(very\s+)?(disappointed|frustrated|angry|upset)\s+(with|about)\b",
        r"\b(terrible|awful|horrible|worst)\s+(service|experience|product)\b",
        r"\b(poor|bad)\s+(quality|service|experience)\b",
        r"\bcomplaint\s+(about|regarding)\b"
    ]
}

# Entity patterns for better context understanding
ENTITY_PATTERNS = {
    "money_amount": r"\$\d+(?:\.\d{2})?|\b\d+\s*(dollar|euro|pound|cent)s?\b",
    "order_number": r"\b(order|tracking|reference)?\s*#?\s*\d{6,}\b",
    "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
    "date": r"\b\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}\b",
    "product_reference": r"\b(product|item|model)\s+#?\s*[A-Z0-9\-]+\b"
}

# Temporal and escalation indicators
TEMPORAL_INDICATORS = {
    "escalation_signals": ["still", "again", "continue", "keep", "repeatedly", "multiple times", "several times"],
    "urgency_signals": ["urgent", "asap", "emergency", "critical", "immediately", "right now", "quickly"],
    "timeline_references": ["today", "yesterday", "last week", "last month", "ago", "since", "for days", "for weeks"]
}

# Intent confidence boosters based on entity presence
ENTITY_INTENT_BOOSTERS = {
    "billing_inquiry": ["money_amount", "order_number"],
    "refund_request": ["money_amount", "order_number"],
    "order_management": ["order_number", "date"],
    "technical_support": ["product_reference", "email"],
    "cancellation_request": ["order_number", "date"]
}

# Enhanced keyword patterns with more comprehensive refund terminology
ENHANCED_INTENT_PATTERNS = {
    "technical_support": {
        "primary": ["error", "bug", "crash", "not working", "broken", "issue", "problem"],
        "secondary": ["malfunction", "glitch", "fails", "unable to", "can't", "doesn't work", "fault", "defect"],
        "technical": ["404", "500", "timeout", "exception", "failure", "down", "offline", "slow"],
        "descriptive": ["defective", "faulty", "damaged", "unusable"],
        "weight": 1.0
    },
    "billing_inquiry": {
        "primary": ["bill", "payment", "charge", "invoice", "billing"],
        "secondary": ["refund", "money", "cost", "price", "subscription", "upgrade", "downgrade"],
        "financial": ["credit", "debit", "transaction", "receipt", "statement", "balance"],
        "weight": 1.0
    },
    "account_management": {
        "primary": ["account", "login", "password", "username", "access"],
        "secondary": ["permissions", "profile", "settings", "delete account", "close account"],
        "auth": ["signin", "signup", "authentication", "verification", "2fa", "security"],
        "weight": 1.0
    },
    "feature_request": {
        "primary": ["feature", "add", "new", "enhancement", "improvement", "suggestion"],
        "secondary": ["would like", "could you", "please add", "wish", "want", "need"],
        "development": ["implement", "develop", "create", "build", "integrate"],
        "weight": 0.9
    },
    "complaint_issue": {
        "primary": ["disappointed", "terrible", "awful", "worst", "hate", "angry"],
        "secondary": ["frustrated", "unacceptable", "poor", "bad service", "unsatisfied"],
        "emotional": ["upset", "mad", "furious", "disgusted", "horrible", "ridiculous"],
        "weight": 1.0
    },
    "information_request": {
        "primary": ["how to", "how do", "what is", "where is", "when", "why", "how can"],
        "secondary": ["help", "guide", "tutorial", "documentation", "explain", "instructions"],
        "inquiry": ["can you tell", "need to know", "wondering", "curious", "clarification"],
        "questions": ["question", "ask", "tell me", "show me", "help me understand"],
        "action_help": ["turn on", "enable", "activate", "set up", "use", "configure"],
        "weight": 1.1  # Increased weight for information requests
    },
    "refund_request": {
        "primary": ["refund", "money back", "return money", "get my money back", "return", "return item"],
        "secondary": ["cancel payment", "reverse charge", "chargeback", "reimbursement", "give back"],
        "financial": ["credit back", "return funds", "undo payment", "compensation"],
        "actions": ["return purchase", "return order", "send back", "return product"],
        # Enhanced money-related keywords but with context validation
        "money_phrases": ["want my money", "need my money", "give me money", "my money back", "money returned"],
        "direct_money": ["money", "cash", "payment", "paid", "pay back", "owe me"],
        "possession": ["my", "mine", "bought", "purchased", "paid for"],  # Will be context-validated
        "weight": 1.0  # Reduced back to normal weight
    },
    "cancellation_request": {
        "primary": ["cancel", "cancellation", "stop service", "end subscription", "cencel", "cancle"],
        "secondary": ["terminate", "close", "discontinue", "unsubscribe", "opt out"],
        "cessation": ["halt", "suspend", "deactivate", "remove", "delete"],
        "actions": ["cancel order", "cancel purchase", "cancel my", "want to cancel", "need to cancel"],
        "typos": ["cancell", "cancle", "cencel", "canel", "cancal"],
        "weight": 1.0
    },
    "order_management": {
        "primary": ["order", "delivery", "shipping", "track", "tracking number"],
        "secondary": ["when will", "status", "change order", "modify order", "update order"],
        "logistics": ["shipment", "package", "courier", "eta", "dispatch"],
        "weight": 1.0
    },
    "escalation": {
        "primary": ["speak to manager", "supervisor", "escalate", "human agent"],
        "secondary": ["real person", "not satisfied", "this is ridiculous", "manager"],
        "urgency": ["urgent", "asap", "immediately", "priority", "emergency", "quickly", "right now"],
        "weight": 1.0
    }
}

# Negation patterns that might flip intent
NEGATION_PATTERNS = [
    r"\b(not|no|never|don't|doesn't|won't|can't|couldn't|shouldn't|wouldn't)\s+",
    r"\b(unable|impossible|failed)\s+to\s+",
    r"\b(without|lack|missing)\s+"
]

def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract various entities from text to improve intent classification context.
    """
    entities = {}
    text_lower = text.lower()
    
    for entity_type, pattern in ENTITY_PATTERNS.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            entities[entity_type] = matches
    
    return entities

def analyze_text_quality(text: str) -> Dict[str, float]:
    """
    Analyze text quality and formality to adjust confidence scores.
    """
    if not text:
        return {"quality": 0.0, "formality": 0.0, "clarity": 0.0}
    
    # Basic quality indicators
    word_count = len(text.split())
    sentence_count = len(re.findall(r'[.!?]+', text))
    avg_sentence_length = word_count / max(sentence_count, 1)
    
    # Spelling and grammar indicators (simple heuristics)
    typo_indicators = len(re.findall(r'\b\w*[0-9]+\w*\b', text))  # Mixed alphanumeric
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    
    # Formality indicators
    formal_words = ["please", "thank you", "would", "could", "regarding", "concerning"]
    informal_words = ["hey", "hi", "yeah", "ok", "gonna", "wanna"]
    
    formal_count = sum(1 for word in formal_words if word in text.lower())
    informal_count = sum(1 for word in informal_words if word in text.lower())
    
    # Calculate scores
    quality = min(1.0, (word_count / 50) * (1 - typo_indicators / max(word_count, 1)))
    formality = (formal_count - informal_count) / max(word_count / 10, 1)
    clarity = min(1.0, avg_sentence_length / 15) if avg_sentence_length < 30 else 0.5
    
    return {
        "quality": max(0.0, min(1.0, quality)),
        "formality": max(-1.0, min(1.0, formality)),
        "clarity": max(0.0, min(1.0, clarity))
    }

def detect_phrase_patterns(text: str, intent: str) -> float:
    """
    Detect sophisticated phrase patterns for more accurate intent classification.
    """
    if intent not in PHRASE_PATTERNS:
        return 0.0
    
    text_lower = text.lower()
    total_score = 0.0
    
    patterns = PHRASE_PATTERNS[intent]
    for pattern in patterns:
        matches = re.findall(pattern, text_lower)
        if matches:
            # Score based on pattern specificity and match quality
            pattern_specificity = len(pattern) / 50  # Longer patterns are more specific
            match_bonus = min(len(matches) * 0.1, 0.3)  # Bonus for multiple matches
            total_score += 0.4 + pattern_specificity + match_bonus
    
    return min(total_score, 0.95)

def analyze_subject_description_relationship(subject: str, description: str) -> Dict[str, float]:
    """
    Analyze the relationship between subject and description for better context understanding.
    """
    if not subject or not description:
        return {"consistency": 0.5, "completeness": 0.5}
    
    subject_words = set(subject.lower().split())
    description_words = set(description.lower().split())
    
    # Remove common words
    common_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "i", "you", "my", "your"}
    subject_words -= common_words
    description_words -= common_words
    
    # Calculate consistency (word overlap)
    overlap = len(subject_words & description_words)
    total_unique = len(subject_words | description_words)
    consistency = overlap / max(total_unique, 1)
    
    # Calculate completeness (description elaborates on subject)
    elaboration_words = description_words - subject_words
    completeness = len(elaboration_words) / max(len(description_words), 1)
    
    return {
        "consistency": min(consistency, 1.0),
        "completeness": min(completeness, 1.0)
    }

def detect_multi_intents(text: str) -> List[Tuple[str, float]]:
    """
    Detect when a text contains multiple intents (e.g., complaint + refund request).
    """
    multi_intents = []
    text_lower = text.lower()
    
    # Common multi-intent patterns
    multi_patterns = {
        ("complaint_issue", "refund_request"): [
            r"\b(disappointed|frustrated|angry).*(refund|money back)\b",
            r"\b(terrible|awful|poor).*(want|need).*(refund|return)\b"
        ],
        ("technical_support", "escalation"): [
            r"\b(not working|broken|error).*(urgent|asap|manager)\b",
            r"\b(bug|issue|problem).*(immediately|escalate)\b"
        ],
        ("billing_inquiry", "refund_request"): [
            r"\b(wrong charge|billing error).*(refund|money back)\b",
            r"\b(charged twice|unauthorized).*(want.*back|refund)\b"
        ],
        ("cancellation_request", "refund_request"): [
            r"\b(cancel|stop).*(refund|money back)\b",
            r"\b(terminate|end).*(return.*money|refund)\b"
        ]
    }
    
    for (intent1, intent2), patterns in multi_patterns.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                multi_intents.append((intent1, 0.6))
                multi_intents.append((intent2, 0.6))
                break
    
    return multi_intents

def calculate_semantic_similarity_boost(text: str, intent: str) -> float:
    """
    Calculate semantic similarity boost based on word relationships and context.
    Enhanced for better money and refund detection.
    """
    text_lower = text.lower()
    
    # Semantic word groups for different intents
    semantic_groups = {
        "refund_request": {
            "financial": ["money", "payment", "cost", "price", "charge", "fee", "amount", "cash", "paid", "pay"],
            "return_action": ["back", "return", "reverse", "undo", "restore", "give", "get"],
            "possession": ["my", "mine", "bought", "purchased", "paid", "own", "owned"],
            "want_need": ["want", "need", "expect", "require", "demand", "deserve"],
            "money_verbs": ["refund", "reimburse", "compensate", "repay", "owe", "return"]
        },
        "technical_support": {
            "malfunction": ["broken", "failed", "error", "issue", "problem", "fault", "defective", "faulty"],
            "technology": ["app", "website", "system", "software", "device", "computer", "camera", "phone"],
            "action_attempted": ["tried", "attempted", "clicked", "pressed", "used", "tested"],
            "negatives": ["not", "doesn't", "won't", "can't", "unable", "impossible"]
        },
        "cancellation_request": {
            "cessation": ["stop", "end", "halt", "terminate", "discontinue", "quit", "cancel"],
            "services": ["subscription", "service", "account", "membership", "plan", "order"],
            "decision": ["want", "need", "decide", "choose", "prefer"]
        },
        "escalation": {
            "urgency": ["urgent", "asap", "immediately", "quickly", "right now", "emergency"],
            "authority": ["manager", "supervisor", "escalate", "human", "person"],
            "dissatisfaction": ["ridiculous", "unacceptable", "frustrated", "angry"]
        }
    }
    
    if intent not in semantic_groups:
        return 0.0
    
    total_boost = 0.0
    groups = semantic_groups[intent]
    
    # Enhanced scoring with special attention to money language for refunds
    for group_name, words in groups.items():
        group_matches = sum(1 for word in words if word in text_lower)
        if group_matches > 0:
            # Base coherence bonus
            coherence_bonus = min(group_matches / len(words), 0.3)
            
            # Special boost for refund-related money language
            if intent == "refund_request":
                if group_name == "financial" and group_matches > 0:
                    coherence_bonus += 0.2  # Extra boost for financial terms
                elif group_name == "want_need" and group_matches > 0:
                    # Check if want/need is followed by money-related terms
                    money_terms = ["money", "cash", "payment", "refund", "back"]
                    if any(money_term in text_lower for money_term in money_terms):
                        coherence_bonus += 0.25  # Big boost for "want money" type phrases
                elif group_name == "money_verbs" and group_matches > 0:
                    coherence_bonus += 0.15  # Boost for refund verbs
            
            total_boost += coherence_bonus
    
    # Additional context analysis for refunds
    if intent == "refund_request":
        # Look for specific money request patterns
        money_request_patterns = [
            "want my money", "need my money", "give me money", "my money back",
            "want money", "need money", "pay me", "owe me"
        ]
        for pattern in money_request_patterns:
            if pattern in text_lower:
                total_boost += 0.3  # Big boost for explicit money requests
                break
    
    return min(total_boost, 0.5)  # Increased maximum boost

def preprocess_text(text: str) -> str:
    """
    Advanced text preprocessing for better intent classification with typo correction.
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower().strip()
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Common typo corrections for critical keywords
    typo_corrections = {
        "cencel": "cancel",
        "cancle": "cancel", 
        "cancell": "cancel",
        "canel": "cancel",
        "cancal": "cancel",
        "wan't": "want",
        "wont": "want",
        "recieve": "receive",
        "refund": "refund",  # Keep as is but normalize
        "retrun": "return",
        "retur": "return",
    }
    
    # Apply typo corrections
    for typo, correction in typo_corrections.items():
        text = re.sub(r'\b' + re.escape(typo) + r'\b', correction, text)
    
    # Expand common contractions
    contractions = {
        "can't": "cannot", "won't": "will not", "n't": " not",
        "i'm": "i am", "you're": "you are", "it's": "it is",
        "that's": "that is", "what's": "what is", "where's": "where is",
        "how's": "how is", "here's": "here is", "there's": "there is"
    }
    
    for contraction, expansion in contractions.items():
        text = text.replace(contraction, expansion)
    
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s\.\!\?\-]', ' ', text)
    
    # Handle repeated punctuation
    text = re.sub(r'[\.!?]{2,}', '.', text)
    
    return text.strip()

def detect_urgency_and_sentiment(text: str) -> Tuple[float, str]:
    """
    Detect urgency level and sentiment to adjust intent probabilities.
    """
    text_lower = text.lower()
    
    # Urgency indicators
    urgency_words = ["urgent", "asap", "immediately", "emergency", "critical", "priority", 
                    "right now", "as soon as possible", "quickly", "fast"]
    urgency_score = sum(1 for word in urgency_words if word in text_lower) / len(urgency_words)
    
    # Sentiment indicators
    negative_words = ["terrible", "awful", "horrible", "worst", "hate", "angry", "frustrated", 
                     "disappointed", "unacceptable", "ridiculous", "disgusting"]
    positive_words = ["great", "excellent", "amazing", "love", "perfect", "fantastic", 
                     "wonderful", "satisfied", "happy", "pleased"]
    
    negative_count = sum(1 for word in negative_words if word in text_lower)
    positive_count = sum(1 for word in positive_words if word in text_lower)
    
    if negative_count > positive_count:
        sentiment = "negative"
    elif positive_count > negative_count:
        sentiment = "positive"
    else:
        sentiment = "neutral"
    
    return min(urgency_score * 2, 1.0), sentiment

def calculate_advanced_keyword_score(text: str, intent: str, patterns: Dict) -> float:
    """
    Calculate sophisticated keyword-based scores with context awareness and better weighting.
    Enhanced with context validation to prevent false positives.
    """
    text_lower = text.lower()
    total_score = 0.0
    
    # Context validation for refund requests
    if intent == "refund_request":
        if not has_refund_context(text):
            # If no actual refund context, heavily penalize refund scoring
            return 0.0
    
    # Context boost for information requests
    if intent == "information_request":
        if has_information_request_context(text):
            # Clear information request gets a base boost
            total_score += 0.4
    
    # Check for negations that might affect scoring
    has_negation = any(re.search(pattern, text_lower) for pattern in NEGATION_PATTERNS)
    negation_penalty = 0.2 if has_negation else 0.0
    
    # Enhanced category weights with better priorities
    category_weights = {
        "primary": 1.5, "secondary": 0.9, "technical": 0.9,
        "financial": 1.2, "auth": 0.8, "development": 0.6, 
        "emotional": 1.0, "inquiry": 0.8, "cessation": 1.3, 
        "logistics": 0.8, "urgency": 1.2, "actions": 1.4,
        "typos": 1.0, "descriptive": 1.1, "money_phrases": 1.8,
        "direct_money": 1.6, "possession": 0.3,  # Heavily reduced possession weight
        "questions": 1.3, "action_help": 1.2  # New categories for info requests
    }
    
    # Enhanced explicit keywords with more comprehensive coverage
    explicit_keywords = {
        "refund_request": [
            "refund", "money back", "get my money back", "want my money", 
            "need my money", "give me my money", "return my money", "my money",
            "pay me back", "owe me money", "money returned"
        ],
        "information_request": [
            "how can", "how do", "how to", "what is", "where is", "why",
            "help me", "show me", "guide me", "explain", "instructions"
        ],
        "cancellation_request": ["cancel", "cancellation", "cancel order", "cancel purchase"],
        "technical_support": ["not working", "broken", "error", "bug", "doesn't work", "defective"],
        "billing_inquiry": ["billing", "payment", "charge", "invoice", "wrong charge"]
    }
    
    # Explicit keyword boost for very clear signals
    explicit_boost = 0.0
    if intent in explicit_keywords:
        for explicit_keyword in explicit_keywords[intent]:
            if explicit_keyword in text_lower:
                if intent == "refund_request":
                    # Only boost refund if it has proper context
                    boost_amount = 0.8 if "money" in explicit_keyword else 0.6
                elif intent == "information_request":
                    # Strong boost for clear information requests
                    boost_amount = 0.7
                else:
                    boost_amount = 0.6
                explicit_boost += boost_amount
                break
    
    total_matches = 0
    primary_matches = 0
    money_related_matches = 0
    info_matches = 0
    
    for category, keywords in patterns.items():
        if category == "weight":
            continue
            
        category_weight = category_weights.get(category, 0.5)
        matches = 0
        
        # Enhanced matching with context validation
        for keyword in keywords:
            if keyword in text_lower:
                # Special handling for possession words in refund context
                if intent == "refund_request" and category == "possession":
                    # Only count possession if there's actual refund context
                    if has_refund_context(text):
                        matches += 1
                else:
                    matches += 1
                    
                if category == "primary":
                    primary_matches += 1
                if category in ["money_phrases", "direct_money"]:
                    money_related_matches += 1
                if category in ["questions", "action_help"] and intent == "information_request":
                    info_matches += 1
                    
                # Bonus for exact phrase matches in compound keywords
                if len(keyword.split()) > 1:
                    matches += 0.5
        
        total_matches += matches
        
        if matches > 0:
            # More sophisticated scoring based on keyword density and context
            keyword_density = matches / len(keywords)
            context_bonus = min(0.3 * (matches - 1), 0.4)
            
            # Enhanced scoring with higher base multiplier for important categories
            if category in ["primary", "money_phrases", "direct_money", "questions", "action_help"]:
                base_multiplier = 1.0
            elif category in ["actions", "urgency"]:
                base_multiplier = 0.8
            elif category == "possession":
                base_multiplier = 0.3  # Very low for possession without context
            else:
                base_multiplier = 0.6
                
            category_score = (keyword_density * category_weight + context_bonus) * base_multiplier
            total_score += category_score
    
    # Add the explicit boost
    total_score += explicit_boost
    
    # Special boost for high-priority intents with strong signals
    if intent == "refund_request":
        # Only boost if there's actual refund context
        if has_refund_context(text):
            if money_related_matches >= 1 or "money" in text_lower:
                total_score += 0.4
            if primary_matches >= 1:
                total_score += 0.3
            if total_matches >= 2:
                total_score += 0.2
        else:
            # Heavily penalize refund without context
            total_score *= 0.1
    elif intent == "information_request":
        # Strong boost for clear information requests
        if has_information_request_context(text):
            total_score += 0.3
        if info_matches >= 1:
            total_score += 0.2
        if "?" in text:
            total_score += 0.2  # Question mark boost
    elif intent == "cancellation_request":
        if primary_matches >= 1:
            total_score += 0.3
        if total_matches >= 2:
            total_score += 0.2
    
    # Special penalty for information_request if other strong intents are present
    if intent == "information_request" and total_matches > 0:
        question_words = ["question", "how", "what", "when", "where", "why"]
        has_question_words = any(word in text_lower for word in question_words)
        action_words = ["cancel", "return", "refund", "stop", "terminate"]
        has_action_words = any(word in text_lower for word in action_words)
        
        # Only penalize if there are action words WITHOUT question context
        if has_action_words and not has_information_request_context(text):
            total_score *= 0.3
    
    # Apply intent-specific weight
    intent_weight = patterns.get("weight", 1.0)
    final_score = total_score * intent_weight
    
    # Apply negation penalty for certain intents
    if has_negation and intent in ["feature_request", "information_request"]:
        final_score *= (1 - negation_penalty)
    
    return min(final_score, 0.98)

def smart_normalize_probabilities(results: List[Dict], preserve_high_confidence: bool = True) -> List[Dict]:
    """
    Smart normalization that preserves high-confidence predictions while normalizing others.
    """
    if not results:
        return results
    
    # Sort by probability to identify high-confidence predictions
    results.sort(key=lambda x: x['probability'], reverse=True)
    
    if preserve_high_confidence and len(results) > 0:
        top_score = results[0]['probability']
        
        # If we have a very high confidence prediction (>0.7), preserve it and adjust others
        if top_score > 0.7:
            # Preserve the top prediction, normalize the rest to fill remaining probability
            remaining_prob = 1.0 - top_score
            other_results = results[1:]
            
            if other_results:
                other_total = sum(r['probability'] for r in other_results)
                if other_total > 0:
                    # Normalize other results to fit in remaining probability space
                    for result in other_results:
                        result['probability'] = round(
                            (result['probability'] / other_total) * remaining_prob, 4
                        )
            
            return results
    
    # Standard normalization for cases without high confidence
    probs = [r["probability"] for r in results]
    total_prob = sum(probs)
    
    if total_prob == 0:
        # If all probabilities are 0, distribute equally
        equal_prob = 1.0 / len(results)
        for result in results:
            result["probability"] = round(equal_prob, 4)
    else:
        # Normalize to sum to 1.0
        for i, result in enumerate(results):
            normalized_prob = probs[i] / total_prob
            result["probability"] = round(normalized_prob, 4)
    
    return results

def normalize_probabilities(results: List[Dict]) -> List[Dict]:
    """
    Updated normalize function that uses smart normalization.
    """
    return smart_normalize_probabilities(results, preserve_high_confidence=True)

def consolidate_similar_intents(results: List[Dict]) -> List[Dict]:
    """
    Consolidate similar intents to avoid redundancy.
    """
    # Define intent groups that should be consolidated
    intent_groups = {
        "account_management": ["account_management", "authentication", "login_issue"],
        "billing_inquiry": ["billing_inquiry", "payment_issue", "invoice_issue"],
        "technical_support": ["technical_support", "bug_report", "system_error"],
        "order_management": ["order_management", "shipping_inquiry", "delivery_issue"]
    }
    
    consolidated = {}
    
    for result in results:
        intent = result["intent"]
        probability = result["probability"]
        
        # Find which group this intent belongs to
        primary_intent = intent
        for group_name, group_intents in intent_groups.items():
            if intent in group_intents:
                primary_intent = group_name
                break
        
        # Consolidate probabilities
        if primary_intent in consolidated:
            consolidated[primary_intent] += probability
        else:
            consolidated[primary_intent] = probability
    
    # Convert back to list format
    final_results = [
        {"intent": intent, "probability": round(prob, 4)}
        for intent, prob in consolidated.items()
    ]
    
    # Sort by probability
    final_results.sort(key=lambda x: x['probability'], reverse=True)
    
    return final_results

def calculate_enhanced_intent_score(text: str, intent: str) -> float:
    """
    Calculate enhanced intent score using all advanced techniques.
    """
    # Get base keyword score
    if intent in ENHANCED_INTENT_PATTERNS:
        base_score = calculate_advanced_keyword_score(text, intent, ENHANCED_INTENT_PATTERNS[intent])
    else:
        base_score = 0.0
    
    # Get phrase pattern score
    phrase_score = detect_phrase_patterns(text, intent)
    
    # Get semantic similarity boost
    semantic_boost = calculate_semantic_similarity_boost(text, intent)
    
    # Extract entities for context
    entities = extract_entities(text)
    entity_boost = 0.0
    
    if intent in ENTITY_INTENT_BOOSTERS:
        relevant_entities = ENTITY_INTENT_BOOSTERS[intent]
        for entity_type in relevant_entities:
            if entity_type in entities:
                entity_boost += 0.15  # Boost for relevant entities
    
    # Check for temporal indicators
    temporal_boost = 0.0
    text_lower = text.lower()
    
    for category, indicators in TEMPORAL_INDICATORS.items():
        matches = sum(1 for indicator in indicators if indicator in text_lower)
        if matches > 0:
            if category == "escalation_signals" and intent == "escalation":
                temporal_boost += 0.2
            elif category == "urgency_signals" and intent in ["technical_support", "escalation"]:
                temporal_boost += 0.1
    
    # Combine all scores intelligently
    if phrase_score > base_score:
        # Phrase patterns are more reliable than keywords
        combined_score = phrase_score + (base_score * 0.3) + semantic_boost + entity_boost + temporal_boost
    else:
        # Use keyword score as base
        combined_score = base_score + (phrase_score * 0.5) + semantic_boost + entity_boost + temporal_boost
    
    return min(combined_score, 0.98)

def debug_intent_classification(subject: str, description: str, intent: str = "refund_request") -> Dict:
    """
    Debug function to understand why a specific intent is or isn't being detected.
    """
    # Preprocess text
    processed_subject = preprocess_text(subject) if subject else ""
    processed_description = preprocess_text(description) if description else ""
    
    if processed_subject and processed_description:
        ticket_text = f"{processed_subject}. {processed_subject}. {processed_description}".strip()
    elif processed_subject:
        ticket_text = processed_subject
    elif processed_description:
        ticket_text = processed_description
    else:
        return {"error": "No text to analyze"}
    
    debug_info = {
        "original_text": f"{subject}. {description}",
        "processed_text": ticket_text,
        "intent_analyzed": intent,
        "scores": {}
    }
    
    # Test different scoring methods
    if intent in ENHANCED_INTENT_PATTERNS:
        keyword_score = calculate_advanced_keyword_score(ticket_text, intent, ENHANCED_INTENT_PATTERNS[intent])
        debug_info["scores"]["keyword_score"] = keyword_score
    
    phrase_score = detect_phrase_patterns(ticket_text, intent)
    debug_info["scores"]["phrase_score"] = phrase_score
    
    semantic_score = calculate_semantic_similarity_boost(ticket_text, intent)
    debug_info["scores"]["semantic_score"] = semantic_score
    
    enhanced_score = calculate_enhanced_intent_score(ticket_text, intent)
    debug_info["scores"]["enhanced_total_score"] = enhanced_score
    
    # Check what patterns are matching
    debug_info["pattern_matches"] = {}
    
    # Check phrase patterns
    if intent in PHRASE_PATTERNS:
        phrase_matches = []
        for pattern in PHRASE_PATTERNS[intent]:
            if re.search(pattern, ticket_text.lower()):
                phrase_matches.append(pattern)
        debug_info["pattern_matches"]["phrase_patterns"] = phrase_matches
    
    # Check keyword patterns
    if intent in ENHANCED_INTENT_PATTERNS:
        keyword_matches = {}
        for category, keywords in ENHANCED_INTENT_PATTERNS[intent].items():
            if category == "weight":
                continue
            matches = [kw for kw in keywords if kw in ticket_text.lower()]
            if matches:
                keyword_matches[category] = matches
        debug_info["pattern_matches"]["keyword_patterns"] = keyword_matches
    
    # Check entities
    entities = extract_entities(ticket_text)
    debug_info["entities"] = entities
    
    # Check urgency and sentiment
    urgency, sentiment = detect_urgency_and_sentiment(ticket_text)
    debug_info["urgency_score"] = urgency
    debug_info["sentiment"] = sentiment
    
    return debug_info

def classify_ticket_intent(subject, description, debug=False):
    """
    Advanced intent classification with sophisticated NLP techniques, multi-intent detection,
    entity recognition, and context analysis.
    
    :param subject: The subject/title of the support ticket
    :param description: The detailed description of the support ticket
    :param debug: If True, returns debug information for the top intent
    :return: List of dictionaries with 'intent' and 'probability' keys, sorted by probability
    """
    try:
        if intent_classifier is None:
            logger.error("No intent classification model available")
            return [{"intent": "model_unavailable", "probability": 1.0}]
        
        # Advanced text preprocessing
        processed_subject = preprocess_text(subject) if subject else ""
        processed_description = preprocess_text(description) if description else ""
        
        # Analyze relationship between subject and description
        relationship = analyze_subject_description_relationship(processed_subject, processed_description)
        
        # Combine with intelligent context weighting
        if processed_subject and processed_description:
            # Weight subject more heavily, but include description for context
            ticket_text = f"{processed_subject}. {processed_subject}. {processed_description}".strip()
        elif processed_subject:
            ticket_text = processed_subject
        elif processed_description:
            ticket_text = processed_description
        else:
            logger.warning("Empty ticket text provided")
            return [{"intent": "unknown", "probability": 1.0}]
        
        # Analyze text quality for confidence adjustment
        text_quality = analyze_text_quality(ticket_text)
        
        # Detect urgency and sentiment for score adjustment
        urgency_score, sentiment = detect_urgency_and_sentiment(ticket_text)
        
        # Extract entities for context enhancement
        entities = extract_entities(ticket_text)
        
        # Detect multi-intents
        multi_intents = detect_multi_intents(ticket_text)
        
        # Get ML model predictions
        predictions = intent_classifier(ticket_text)
        
        # Process ML results with confidence thresholding
        ml_results = []
        min_confidence = 0.08  # Slightly relaxed for better recall
        
        if isinstance(predictions, list) and len(predictions) > 0:
            if isinstance(predictions[0], list):
                predictions = predictions[0]
            
            for pred in predictions:
                try:
                    if isinstance(pred, dict):
                        label = pred.get('label', str(pred))
                        score = pred.get('score', 0.0)
                        
                        # Apply confidence threshold
                        if score >= min_confidence:
                            intent_name = INTENT_MAPPING.get(label, label.lower() if isinstance(label, str) else str(label))
                            ml_results.append({
                                "intent": intent_name,
                                "probability": round(float(score), 4),
                                "source": "ml_model"
                            })
                except Exception as pred_error:
                    logger.warning(f"Error processing prediction {pred}: {pred_error}")
                    continue
        
        # Enhanced keyword and phrase-based scoring
        enhanced_results = []
        for intent in ENHANCED_INTENT_PATTERNS.keys():
            score = calculate_enhanced_intent_score(ticket_text, intent)
            if score > 0.01:  # Very low threshold to capture all possibilities
                enhanced_results.append({
                    "intent": intent,
                    "probability": round(score, 4),
                    "source": "enhanced_analysis"
                })
        
        # Add multi-intent results
        for intent, score in multi_intents:
            enhanced_results.append({
                "intent": intent,
                "probability": round(score, 4),
                "source": "multi_intent"
            })
        
        # Advanced ensemble scoring
        final_results = _advanced_ensemble_scoring(
            ml_results, enhanced_results, urgency_score, sentiment, 
            text_quality, relationship, entities
        )
        
        # Apply intelligent confidence thresholding
        confidence_threshold = 0.01 if text_quality["quality"] > 0.5 else 0.005
        final_results = [r for r in final_results if r["probability"] >= confidence_threshold]
        
        # Consolidate similar intents
        final_results = consolidate_similar_intents(final_results)
        
        # Smart normalize probabilities (preserves high confidence)
        final_results = normalize_probabilities(final_results)
        
        # Remove source field before returning
        for result in final_results:
            result.pop("source", None)
            result.pop("evidence", None)  # Also remove evidence field
        
        # Ensure we have at least one result
        if not final_results:
            logger.warning("No valid predictions after filtering, using fallback")
            return _get_enhanced_keyword_classification(ticket_text)
        
        # Add debug information if requested
        if debug and final_results:
            top_intent = final_results[0]["intent"]
            debug_info = debug_intent_classification(subject, description, top_intent)
            return {"results": final_results, "debug": debug_info}
        
        return final_results
        
    except Exception as e:
        logger.error(f"Error classifying ticket intent: {e}")
        try:
            return _get_enhanced_keyword_classification(f"{subject}. {description}")
        except Exception as fallback_error:
            logger.error(f"Fallback classification also failed: {fallback_error}")
            return [{"intent": "classification_error", "probability": 1.0}]

def _advanced_ensemble_scoring(ml_results: List[Dict], enhanced_results: List[Dict], 
                              urgency_score: float, sentiment: str, text_quality: Dict,
                              relationship: Dict, entities: Dict) -> List[Dict]:
    """
    Advanced ensemble scoring that incorporates all available signals and context.
    """
    combined_scores = defaultdict(lambda: {
        "ml": 0.0, "enhanced": 0.0, "multi": 0.0, "sources": [], "evidence": []
    })
    
    # Collect all scores by intent
    for result in ml_results:
        intent = result["intent"]
        combined_scores[intent]["ml"] = result["probability"]
        combined_scores[intent]["sources"].append("ml")
        combined_scores[intent]["evidence"].append(f"ML:{result['probability']:.3f}")
    
    for result in enhanced_results:
        intent = result["intent"]
        if result["source"] == "multi_intent":
            combined_scores[intent]["multi"] = max(combined_scores[intent]["multi"], result["probability"])
            combined_scores[intent]["sources"].append("multi")
            combined_scores[intent]["evidence"].append(f"Multi:{result['probability']:.3f}")
        else:
            combined_scores[intent]["enhanced"] = max(combined_scores[intent]["enhanced"], result["probability"])
            combined_scores[intent]["sources"].append("enhanced")
            combined_scores[intent]["evidence"].append(f"Enhanced:{result['probability']:.3f}")
    
    # Calculate sophisticated ensemble scores
    ensemble_results = []
    
    for intent, scores in combined_scores.items():
        ml_score = scores["ml"]
        enhanced_score = scores["enhanced"] 
        multi_score = scores["multi"]
        sources = scores["sources"]
        
        # Base ensemble calculation with adaptive weighting
        if enhanced_score > 0.7:  # Very high enhanced confidence
            ensemble_score = enhanced_score * 0.85 + ml_score * 0.15
        elif ml_score > 0.7:  # Very high ML confidence
            ensemble_score = ml_score * 0.75 + enhanced_score * 0.25
        elif "ml" in sources and "enhanced" in sources:
            # Both available - weighted combination
            weight_enhanced = 0.7 if enhanced_score > ml_score else 0.5
            weight_ml = 1.0 - weight_enhanced
            ensemble_score = (enhanced_score * weight_enhanced + ml_score * weight_ml)
        elif enhanced_score > 0:
            ensemble_score = enhanced_score * 0.9  # Slight penalty for single source
        else:
            ensemble_score = ml_score * 0.85
        
        # Add multi-intent boost
        if multi_score > 0:
            ensemble_score = max(ensemble_score, multi_score)
        
        # Apply contextual adjustments
        quality_multiplier = 0.8 + (text_quality.get("quality", 0.5) * 0.4)
        ensemble_score *= quality_multiplier
        
        # Relationship consistency boost
        if relationship.get("consistency", 0) > 0.3:
            ensemble_score += 0.05
        
        # Entity relevance boost
        if intent in ENTITY_INTENT_BOOSTERS:
            relevant_entities = ENTITY_INTENT_BOOSTERS[intent]
            entity_matches = sum(1 for entity_type in relevant_entities if entity_type in entities)
            if entity_matches > 0:
                ensemble_score += min(entity_matches * 0.1, 0.2)
        
        # Sentiment and urgency adjustments (only for lower confidence)
        if ensemble_score < 0.6:
            if urgency_score > 0.3 and intent in ["technical_support", "complaint_issue", "escalation"]:
                ensemble_score += urgency_score * 0.15
            
            if sentiment == "negative" and intent in ["complaint_issue", "refund_request", "technical_support"]:
                ensemble_score += 0.08
            elif sentiment == "positive" and intent in ["feature_request", "feedback"]:
                ensemble_score += 0.05
        
        ensemble_results.append({
            "intent": intent,
            "probability": round(min(ensemble_score, 0.98), 4),
            "source": "advanced_ensemble",
            "evidence": "; ".join(scores["evidence"])
        })
    
    # Sort by probability
    ensemble_results.sort(key=lambda x: x['probability'], reverse=True)
    
    return ensemble_results

def _get_enhanced_keyword_classification(text):
    """
    Enhanced fallback classification with sophisticated keyword analysis.
    """
    text_lower = preprocess_text(text)
    results = []
    
    # Use enhanced patterns for more accurate scoring
    for intent, patterns in ENHANCED_INTENT_PATTERNS.items():
        score = calculate_advanced_keyword_score(text_lower, intent, patterns)
        if score > 0.02:  # Lower threshold for fallback
            results.append({"intent": intent, "probability": round(score, 4)})
    
    # Add general inquiry if no specific matches
    if not results:
        results.append({"intent": "general_inquiry", "probability": 0.7})
    
    # Sort and return
    results.sort(key=lambda x: x['probability'], reverse=True)
    return results

def has_refund_context(text: str) -> bool:
    """
    Check if text has actual refund context, not just possession words.
    """
    text_lower = text.lower()
    
    # Strong refund indicators
    refund_indicators = [
        "refund", "money back", "return money", "pay me back", 
        "give me money", "want my money", "need my money",
        "money returned", "owe me", "compensation"
    ]
    
    # Money-related action words
    money_actions = [
        "want money", "need money", "get money", "return payment",
        "cancel payment", "reverse charge"
    ]
    
    # Check for explicit refund language
    for indicator in refund_indicators:
        if indicator in text_lower:
            return True
    
    # Check for money + action combinations
    for action in money_actions:
        if action in text_lower:
            return True
    
    return False

def has_information_request_context(text: str) -> bool:
    """
    Check if text has clear information request context.
    """
    text_lower = text.lower()
    
    # Strong question indicators
    question_indicators = [
        "how can", "how do", "how to", "what is", "where is", 
        "when", "why", "can you tell", "help me", "show me",
        "guide me", "instructions", "tutorial", "explain"
    ]
    
    # Check for question marks
    has_question_mark = "?" in text
    
    # Check for question indicators
    has_question_words = any(indicator in text_lower for indicator in question_indicators)
    
    return has_question_mark or has_question_words 