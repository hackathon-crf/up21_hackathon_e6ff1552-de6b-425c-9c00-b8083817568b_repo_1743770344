#!/usr/bin/env python3
"""
Test script to verify Mistral API key directly.
This script will help diagnose authentication issues with the Mistral API.
"""

import os
import sys
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

def test_api_key_from_env():
    """Test the API key stored in environment variable"""
    print("Testing API key from environment variable...")
    api_key = os.environ.get("MISTRAL_API_KEY")
    
    if not api_key:
        print("Error: MISTRAL_API_KEY environment variable not found!")
        return False
    
    print(f"API key found with length: {len(api_key)}")
    print(f"First few chars: {api_key[:4]}...")
    print(f"Last few chars: ...{api_key[-4:]}")
    
    return test_api_key(api_key)

def test_api_key_direct(api_key):
    """Test an API key provided directly"""
    print(f"Testing API key provided directly...")
    print(f"API key length: {len(api_key)}")
    print(f"First few chars: {api_key[:4]}...")
    print(f"Last few chars: ...{api_key[-4:]}")
    
    return test_api_key(api_key)

def test_api_key(api_key):
    """Test if an API key works with the Mistral API"""
    try:
        print("Initializing Mistral client...")
        client = MistralClient(api_key=api_key)
        
        print("Making a simple test query to Mistral API...")
        messages = [
            ChatMessage(role="system", content="You are a test assistant."),
            ChatMessage(role="user", content="Say 'API key is working correctly' if you can read this.")
        ]
        
        response = client.chat(
            model="mistral-tiny",  # Using the smallest model for quick testing
            messages=messages
        )
        
        content = response.choices[0].message.content
        print(f"Received response: {content}")
        
        if "API key is working correctly" in content:
            print("✅ Success! API key is valid and working correctly.")
            return True
        else:
            print("⚠️ Got a response, but not the expected one. API key may be valid.")
            return True
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n===== Mistral API Key Test =====\n")
    
    # Try from environment first
    if not test_api_key_from_env():
        print("\nTesting with API key from .env file...")
        try:
            from dotenv import load_dotenv, find_dotenv
            dotenv_path = find_dotenv()
            print(f"Found .env at: {dotenv_path}")
            load_dotenv(dotenv_path)
            test_api_key_from_env()
        except Exception as e:
            print(f"Error loading from .env: {str(e)}")
    
    print("\nIf you'd like to test with a different API key, you can run:")
    print(f"MISTRAL_API_KEY=your_api_key_here python {sys.argv[0]}")
    
    print("\n==== End of Test ====")