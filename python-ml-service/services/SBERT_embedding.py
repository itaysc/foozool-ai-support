from sentence_transformers import SentenceTransformer

def get_embedded_tickets(tickets):
    """
    Embed a list of ticket objects using the all-mpnet-base-v2 model.

    Parameters:
        tickets (list): List of dicts with 'subject' and 'description' keys.

    Returns:
        list: List of embedding vectors (one per ticket).
    """
    model = SentenceTransformer('all-mpnet-base-v2')

    # Concatenate subject and description for embedding
    texts = [f"{ticket['subject']} {ticket['description']}" for ticket in tickets]

    # Generate embeddings
    embeddings = model.encode(texts, convert_to_numpy=True)

    return embeddings
