#!/usr/bin/env python3
"""
Test script for summarization service
"""

import requests
import json
import os

# Configuration
ML_SERVICE_URL = os.getenv('PYTHON_ML_SERVICE_URL', 'http://ml-service.up.railway.app')

def test_summarization():
    """Test the summarization endpoint"""
    print("Testing summarization service...")
    print(f"ML Service URL: {ML_SERVICE_URL}")
    
    # Test data
    test_tickets = [
        {
            "subject": "Login Issue",
            "description": "I am unable to log in to my account. When I try to enter my credentials, I get an error message saying 'Invalid username or password'. I have tried resetting my password multiple times but the issue persists. This is very frustrating as I need to access my account urgently for work purposes."
        },
        {
            "subject": "Payment Problem", 
            "description": "I made a payment yesterday but it hasn't been processed yet. The money was deducted from my bank account but the transaction shows as pending in your system. I need this resolved quickly as I have important services that depend on this payment."
        }
    ]
    
    try:
        print(f"\nSending request to {ML_SERVICE_URL}/api/v1/summarize")
        print(f"Request payload: {json.dumps(test_tickets, indent=2)}")
        
        response = requests.post(
            f"{ML_SERVICE_URL}/api/v1/summarize",
            json=test_tickets,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        print(f"\nResponse status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Summarization successful!")
            summaries = response.json()
            print(f"Summaries: {json.dumps(summaries, indent=2)}")
        else:
            print(f"❌ Summarization failed with status {response.status_code}")
            print(f"Response body: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - could not connect to ML service")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_health():
    """Test the health endpoint"""
    print("\nTesting health endpoint...")
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=10)
        print(f"Health status: {response.status_code}")
        print(f"Health response: {response.text}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")

if __name__ == "__main__":
    test_health()
    test_summarization() 