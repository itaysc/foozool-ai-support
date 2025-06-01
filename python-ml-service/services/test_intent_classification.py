from intent_classification import classify_ticket_intent

def test_intent_classification():
    """
    Test the intent classification service with various example tickets.
    """
    
    # Test cases with different intent types
    test_tickets = [
        {
            "subject": "Login Error - Can't Access My Account", 
            "description": "I'm getting an error message when trying to log in. The page keeps saying 'invalid credentials' even though I'm sure my password is correct."
        },
        {
            "subject": "Billing Question About Monthly Charge", 
            "description": "I noticed an extra charge on my bill this month. Can you help me understand what this $25 fee is for?"
        },
        {
            "subject": "Feature Request - Dark Mode", 
            "description": "I would love to see a dark mode option added to the application. It would be great for users who work late hours."
        },
        {
            "subject": "How to Export Data", 
            "description": "I need to export my data from the platform. Could you please provide instructions on how to do this?"
        },
        {
            "subject": "Terrible Service Experience", 
            "description": "I'm extremely disappointed with the service quality. The application is constantly crashing and customer support has been unresponsive."
        },
        {
            "subject": "Account Deletion Request", 
            "description": "I want to permanently delete my account and all associated data. Please let me know the process to do this."
        }
    ]
    
    print("=== Intent Classification Test Results ===\n")
    
    for i, ticket in enumerate(test_tickets, 1):
        print(f"Test Case {i}:")
        print(f"Subject: {ticket['subject']}")
        print(f"Description: {ticket['description']}")
        print()
        
        # Get intent classification results
        intents = classify_ticket_intent(ticket['subject'], ticket['description'])
        print("Intent Classifications:")
        for intent_result in intents:
            print(f"  - {intent_result['intent']}: {intent_result['probability']:.4f}")
        
        print(f"Top Intent: {intents[0]['intent'] if intents else 'unknown'}")
        print("-" * 60)
        print()

if __name__ == "__main__":
    test_intent_classification() 