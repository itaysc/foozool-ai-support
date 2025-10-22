#!/usr/bin/env python3
"""
Test script for the new document analysis routes
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000/api/v1"  # Adjust if your Docker service runs on different port
TEST_DOCUMENT = {
    "title": "Customer Meeting Notes",
    "content": "Great meeting with customer ABC Corp. They are very happy with our product and want to discuss additional features. They mentioned some issues with the API integration but overall satisfied with the service.",
    "documentType": "meeting_summary",
    "mimeType": "text/plain"
}

def test_analyze_document():
    """Test the /analyze-document endpoint"""
    print("🔍 Testing /analyze-document endpoint...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/analyze-document",
            json=TEST_DOCUMENT,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ /analyze-document endpoint working!")
            print(f"📊 Category: {result.get('category', 'N/A')}")
            print(f"🎭 Sentiment: {result.get('sentiment', 'N/A')}")
            print(f"📈 Business Relevance: {result.get('businessRelevance', 'N/A')}")
            print(f"🎯 Confidence: {result.get('confidence', 'N/A')}")
            print(f"📝 Topics: {result.get('topics', [])}")
            print(f"📋 Summary: {result.get('summary', 'N/A')[:100]}...")
            return True
        else:
            print(f"❌ /analyze-document failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing /analyze-document: {e}")
        return False

def test_classify_documents():
    """Test the /classify-documents endpoint"""
    print("\n🔍 Testing /classify-documents endpoint...")
    
    test_documents = {
        "documents": [
            {
                "title": "Customer Feedback",
                "content": "Customer is very happy with the new features",
                "documentType": "customer_feedback"
            },
            {
                "title": "Technical Issue",
                "content": "API is not working properly, need urgent fix",
                "documentType": "support_issue"
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/classify-documents",
            json=test_documents,
            timeout=30
        )
        
        if response.status_code == 200:
            categories = response.json()
            print("✅ /classify-documents endpoint working!")
            print(f"📊 Categories: {categories}")
            return True
        else:
            print(f"❌ /classify-documents failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing /classify-documents: {e}")
        return False

def test_extract_document_topics():
    """Test the /extract-document-topics endpoint"""
    print("\n🔍 Testing /extract-document-topics endpoint...")
    
    test_documents = {
        "documents": [
            {
                "title": "Product Requirements",
                "content": "Need to add user authentication, payment processing, and reporting features",
                "documentType": "requirements"
            },
            {
                "title": "Bug Report",
                "content": "Login button not working, database connection timeout issues",
                "documentType": "bug_report"
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/extract-document-topics",
            json=test_documents,
            timeout=30
        )
        
        if response.status_code == 200:
            topics = response.json()
            print("✅ /extract-document-topics endpoint working!")
            print(f"🎯 Topics: {topics}")
            return True
        else:
            print(f"❌ /extract-document-topics failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing /extract-document-topics: {e}")
        return False

def test_health_check():
    """Test if the service is running"""
    print("🔍 Testing service health...")
    
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Service is running!")
            return True
        else:
            print(f"⚠️ Service responded with status {response.status_code}")
            return True  # Service is running, just different response
    except requests.exceptions.RequestException as e:
        print(f"❌ Service health check failed: {e}")
        return False

def main():
    print("🚀 Testing Document Analysis Routes")
    print("=" * 50)
    
    # Test service health first
    if not test_health_check():
        print("\n❌ Service is not running. Please check your Docker container.")
        sys.exit(1)
    
    # Test all endpoints
    results = []
    results.append(test_analyze_document())
    results.append(test_classify_documents())
    results.append(test_extract_document_topics())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ All {total} tests passed!")
        print("🎉 Document analysis routes are working correctly!")
    else:
        print(f"⚠️ {passed}/{total} tests passed")
        print("🔧 Some endpoints may need attention")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
