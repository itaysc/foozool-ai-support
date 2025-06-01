import torch
from transformers import DistilBertTokenizer, DistilBertModel

# Load DistilBERT model and tokenizer
distilbert_model = DistilBertModel.from_pretrained("distilbert-base-uncased")
distilbert_tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")

def get_distilbert_embeddings(tickets):
    """
    Generates DistilBERT CLS token embeddings for an array of tickets.
    """
    embeddings = []
    
    for ticket in tickets:
        subject = ticket.get("subject", "")
        description = ticket.get("description", "")
        combined_text = f"{subject} [SEP] {description}"
        
        # Tokenize
        tokens = distilbert_tokenizer(combined_text, return_tensors="pt", truncation=True, padding=True)
        
        # Generate DistilBERT embeddings
        with torch.no_grad():
            output = distilbert_model(**tokens)
        
        # Extract CLS token embedding
        cls_embedding = output.last_hidden_state[:, 0, :].squeeze().tolist()
        embeddings.append(cls_embedding)
    
    return embeddings
