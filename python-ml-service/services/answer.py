from transformers import pipeline

# Load models
qa_pipeline = pipeline("question-answering", model="deepset/roberta-base-squad2")

def get_answer_from_tickets(question, tickets):
    """
    Finds an answer to a question based on a list of tickets.
    :param question: The question being asked.
    :param tickets: List of ticket dicts, each containing 'subject' and 'description'.
    :return: Extracted answer.
    """
    context = " ".join([t["description"] for t in tickets])  # Combine descriptions
    answer = qa_pipeline(question=question, context=context)
    return answer["answer"]