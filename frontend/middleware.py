import requests
from settings.config import settings
from dotenv import load_dotenv
import os
import streamlit as st
import json
from typing import List, Dict, Any, Optional

# Load environment variables from .client_env
load_dotenv(".client_env")

# Get environment variables, with fallbacks
DOMAIN_NAME = os.getenv("DOMAIN_NAME", "localhost")
ROOT_PATH = os.getenv("ROOT_PATH", "")
BACKEND_PORT = os.getenv("BACKEND_PORT", "8090")

def call_backend_test():
    try:
        # Construct URL with proper protocol and format
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/app/test/"
        print(f"Calling backend URL: {url}")

        params = {}
        response = requests.get(url, params=params)
        print(f"Response status: {response.status_code}")
        return response.json()
    except Exception as e:
        print(f"Error calling backend: {str(e)}")
        return None

def send_message(message):
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/chat/message/"
        print(f"Sending message to backend URL: {url}")
        
        # Get RAG settings from session state
        rag_enabled = st.session_state.settings["rag"]["enabled"]
        rag_collections = st.session_state.settings["rag"]["collections"] if rag_enabled else []
        top_k = st.session_state.settings["rag"]["top_k"] if rag_enabled else 0
        
        payload = {
            "message": message,
            "rag_config": {
                "enabled": rag_enabled,
                "collections": rag_collections,
                "top_k": top_k
            }
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            # Extract token metrics and response time if available
            metrics = response_data.get("metrics", {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "response_time": 0
            })
            
            return {
                "response": response_data.get("response", "No response received"),
                "metrics": metrics
            }
        else:
            print(f"Error from backend: {response.text}")
            return {
                "response": f"Error: {response.status_code}",
                "metrics": {
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "response_time": 0
                }
            }
    except Exception as e:
        print(f"Error sending message to backend: {str(e)}")
        return {
            "response": f"Connection error: {str(e)}",
            "metrics": {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "response_time": 0
            }
        }

def save_chat_history(history):
    """
    Save the current chat history to the backend
    
    Args:
        history: List of chat messages with role, content, and timestamp
        
    Returns:
        dict: Status of the operation
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/chat/history/save/"
        print(f"Saving chat history to backend URL: {url}")
        
        payload = {
            "history": history
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error saving chat history: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

def submit_feedback(message_id, rating, comments=None):
    """
    Submit user feedback about a specific message
    
    Args:
        message_id: Unique identifier for the message
        rating: Numeric rating (typically 1-5)
        comments: Optional feedback comments
        
    Returns:
        dict: Status of the operation
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/chat/feedback/"
        print(f"Submitting feedback to backend URL: {url}")
        
        payload = {
            "message_id": message_id,
            "rating": rating,
            "comments": comments
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error submitting feedback: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

def update_preferences(preferences):
    """
    Update user preferences on the backend
    
    Args:
        preferences: Dictionary containing user preferences
        
    Returns:
        dict: Status of the operation
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/chat/preferences/"
        print(f"Updating preferences to backend URL: {url}")
        
        response = requests.post(url, json=preferences)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error updating preferences: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

def rag_direct_query(query, collection_name, top_k=3):
    """
    Send a direct query to the RAG system without generating a response
    
    Args:
        query: The search query
        collection_name: Name of the collection to search
        top_k: Number of results to return
        
    Returns:
        dict: Query results
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/chat/rag/query/"
        print(f"Sending RAG query to backend URL: {url}")
        
        payload = {
            "query": query,
            "collection_name": collection_name,
            "top_k": top_k
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json().get("data", {})
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error with RAG query: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

def create_rag_collection(collection_name: str):
    """
    Create a new RAG collection
    
    Args:
        collection_name: Name of the collection to create
        
    Returns:
        dict: Status of the operation
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/rag/collections/create/"
        print(f"Creating new RAG collection: {collection_name}")
        
        payload = {
            "name": collection_name
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error creating collection: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

def add_document_to_collection(file, collection_name: str, model: str, chunk_size=None, chunk_overlap=None):
    """
    Add a document to a RAG collection
    
    Args:
        file: File object to upload
        collection_name: Target collection
        model: Embedding model to use
        chunk_size: Optional size of text chunks
        chunk_overlap: Optional overlap between chunks
        
    Returns:
        dict: Status of the operation
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/rag/documents/add/"
        print(f"Adding document to collection: {collection_name}")
        
        # Prepare form data
        files = {'document': file}
        data = {'collection_name': collection_name, 'model': model}
        
        # Add optional parameters if provided
        if chunk_size:
            data['chunk_size'] = chunk_size
        if chunk_overlap:
            data['chunk_overlap'] = chunk_overlap
        
        response = requests.post(url, files=files, data=data)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error adding document: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

def get_query_embeddings(query: str, collection_name: str):
    """
    Generate embeddings for a text query
    
    Args:
        query: Text to embed
        collection_name: Collection determining the embedding model
        
    Returns:
        dict: Embedding vector
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/rag/embeddings/"
        print(f"Getting embeddings for query in collection: {collection_name}")
        
        payload = {
            "query": query,
            "collection_name": collection_name
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json().get("data", {})
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error generating embeddings: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

def retrieve_rag_answer(query: str, model_family: str, model_name: str, 
                       prompt: str, collection_name: str, history_data: str = "[]"):
    """
    Retrieve an answer using RAG
    
    Args:
        query: User's question
        model_family: LLM provider (mistral, openai, etc.)
        model_name: Specific model to use
        prompt: System prompt template
        collection_name: Knowledge base to query
        history_data: Conversation history as JSON string
        
    Returns:
        dict: Generated answer and metadata
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/rag/retrieve-answer/"
        print(f"Retrieving RAG answer for query: {query}")
        
        payload = {
            "query": query,
            "model_family": model_family,
            "model_name": model_name,
            "prompt": prompt,
            "collection_name": collection_name,
            "history_data": history_data
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json().get("data", {})
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error retrieving RAG answer: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

def analyze_difficult_flashcards(cards: List[Dict[str, Any]]):
    """
    Analyze flashcards to identify those with poor performance
    
    Args:
        cards: List of flashcards with review history
        
    Returns:
        dict: Analysis results with difficult cards
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/flashcards/analyze/"
        print(f"Analyzing flashcards for difficulty")
        
        payload = {
            "cards": cards
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json().get("data", {})
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error analyzing flashcards: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}

def generate_ai_flashcards(difficult_cards: List[Dict[str, Any]], num_to_generate: int = 3, 
                         difficulty_level: str = "medium", generation_strategy: str = "related"):
    """
    Generate new flashcards using AI based on difficult cards
    
    Args:
        difficult_cards: List of flashcards identified as difficult
        num_to_generate: Number of cards to generate
        difficulty_level: Desired difficulty level (easy, medium, hard)
        generation_strategy: Strategy for generation (related, breakdown, alternative)
        
    Returns:
        dict: Generation results with new cards
    """
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/flashcards/generate/"
        print(f"Generating AI flashcards: {num_to_generate} cards at {difficulty_level} difficulty using {generation_strategy} strategy")
        
        payload = {
            "difficult_cards": difficult_cards,
            "num_to_generate": num_to_generate,
            "difficulty_level": difficulty_level,
            "generation_strategy": generation_strategy
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json().get("data", {})
        else:
            print(f"Error from backend: {response.text}")
            return {"status": "error", "message": f"Error: {response.status_code}"}
    except Exception as e:
        print(f"Error generating flashcards: {str(e)}")
        return {"status": "error", "message": f"Connection error: {str(e)}"}
