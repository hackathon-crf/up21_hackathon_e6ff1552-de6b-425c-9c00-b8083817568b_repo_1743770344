#!/usr/bin/env python3
"""
RAG System API Client

This script provides functions to interact with the RAG system API for retrieving
information about collections and documents.
"""

import requests
import json
import os
from typing import Dict, List, Any, Optional, Union
import urllib.parse
from mistralai import Mistral

# Base URL for the RAG System API
BASE_URL = "https://hackathon-ia-et-crise.fr/admin/rag-system"

# Initialize Mistral client
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
mistral_client = None
if MISTRAL_API_KEY:
    mistral_client = Mistral(api_key=MISTRAL_API_KEY)

# GET Endpoints

def list_collections() -> List[str]:
    """
    Retrieves a list of all available ChromaDB collections managed by the RAG system.
    
    Returns:
        List[str]: List of collection names
    """
    url = f"{BASE_URL}/api/app/collection/list"
    response = requests.get(url)
    response.raise_for_status()  # Raise exception for 4XX/5XX responses
    return response.json()

def get_collection_documents(collection_name: str) -> Dict:
    """
    Retrieves a list of documents stored within a specific collection.
    
    Args:
        collection_name (str): The name of the collection to inspect
        
    Returns:
        Dict: JSON response containing documents in the collection
    """
    url = f"{BASE_URL}/api/app/collection/documents"
    params = {"collection_name": collection_name}
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def get_document_chunks(collection_name: str, document_path: str, limit: int = 5) -> Dict:
    """
    Retrieves sample text chunks from a specific document within a collection.
    
    Args:
        collection_name (str): The name of the collection containing the document
        document_path (str): The identifier or path of the specific document
        limit (int, optional): Maximum number of chunks to return. Defaults to 5.
        
    Returns:
        Dict: JSON response containing document chunks
    """
    url = f"{BASE_URL}/api/app/collection/document-chunks"
    params = {
        "collection_name": collection_name,
        "document_path": document_path,
        "limit": limit
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def check_document_status(collection_name: str, filename: str, check_method: str = "all") -> Dict:
    """
    Checks the processing status of a specific document within a collection.
    
    Args:
        collection_name (str): The name of the collection containing the document
        filename (str): The name or identifier of the document to check
        check_method (str, optional): Method used for checking. Defaults to "all".
        
    Returns:
        Dict: JSON response containing document status
    """
    url = f"{BASE_URL}/api/app/collection/document-status"
    params = {
        "collection_name": collection_name,
        "filename": filename,
        "check_method": check_method
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def get_collection_metadata(collection_name: str) -> Dict:
    """
    Retrieves detailed metadata about a specific collection.
    
    Args:
        collection_name (str): The name of the collection for which to retrieve metadata
        
    Returns:
        Dict: JSON response containing collection metadata
    """
    url = f"{BASE_URL}/api/app/collection/metadata"
    params = {"name": collection_name}
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

# POST Endpoints

def create_collection(collection_name: str) -> Dict:
    """
    Creates a new, empty ChromaDB collection to store documents and their embeddings.
    
    Args:
        collection_name (str): The desired unique name for the new collection
        
    Returns:
        Dict: JSON response with the creation status
    """
    url = f"{BASE_URL}/api/app/collection/new"
    params = {"name": collection_name}
    response = requests.post(url, params=params)
    response.raise_for_status()
    return response.json()

def get_embeddings_by_chunks(data, chunk_size=100):
    """
    Generate embeddings for a list of text chunks using Mistral's embedding API.
    Processes data in chunks to avoid exceeding API limits.

    Args:
        data (List[str]): List of text chunks to embed.
        chunk_size (int): Maximum number of items to process in a single API call.

    Returns:
        List[List[float]]: A list of embedding vectors.
    """
    try:
        if not mistral_client:
            raise ValueError("Mistral client is not initialized. Please ensure MISTRAL_API_KEY is set.")
            
        chunks = [data[x : x + chunk_size] for x in range(0, len(data), chunk_size)]
        embeddings = []
        
        for chunk in chunks:
            response = mistral_client.embeddings(
                model="mistral-embed",
                input=chunk
            )
            embeddings.extend([item.embedding for item in response.data])
            
        return embeddings
    except Exception as e:
        print(f"Error generating embeddings: {str(e)}")
        raise

def add_document(file_path: str, collection_name: str, model: str, api_key: str, 
                chunk_size: Optional[int] = None, chunk_overlap: Optional[int] = None) -> Dict:
    """
    Uploads a document file, processes it (chunks it), generates embeddings, and stores them in the specified collection.
    This reverts to the original implementation using multipart/form-data.
    
    Args:
        file_path (str): Path to the document file to upload
        collection_name (str): Name of the existing collection where the document should be added
        model (str): Identifier for the embedding model to be used for this document
        api_key (str): API key needed for the embedding model service
        chunk_size (int, optional): Target size for text chunks
        chunk_overlap (int, optional): Number of units that consecutive chunks should overlap
        
    Returns:
        Dict: JSON response with the document addition status
    """
    url = f"{BASE_URL}/api/app/collection/add-document"
    
    # Verify the file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"The file '{file_path}' does not exist")
    
    # Use absolute path
    abs_file_path = os.path.abspath(file_path)
    
    # Create form data with file and required fields
    try:
        with open(abs_file_path, "rb") as file_obj:
            # Create form data with file and required fields
            files = {"document": (os.path.basename(abs_file_path), file_obj)}
            
            data = {
                "collection_name": collection_name,
                "model": model,
                "api_key": api_key
            }
            
            # Add optional parameters if provided
            if chunk_size is not None:
                data["chunk_size"] = str(chunk_size)
            if chunk_overlap is not None:
                data["chunk_overlap"] = str(chunk_overlap)
            
            print(f"Uploading file: {abs_file_path}")
            print(f"To collection: {collection_name}")
            print(f"Using model: {model}")
            
            response = requests.post(url, files=files, data=data)
            
            # Print detailed error info when debugging
            if response.status_code >= 400:
                print(f"Server responded with status code: {response.status_code}")
                print(f"Response content: {response.text}")
                
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"Detailed error: {str(e)}")
        raise

def get_embeddings(query: str, collection_name: str, api_key: str) -> Dict:
    """
    Generates an embedding vector for a given text query, using the embedding model
    associated with the specified collection.
    
    Args:
        query (str): The text input for which to generate an embedding
        collection_name (str): Name of the reference collection (determining the embedding model)
        api_key (str): API key for the embedding service
        
    Returns:
        Dict: JSON response containing the embedding vector
    """
    url = f"{BASE_URL}/api/app/inferencing/get_embeddings"
    params = {
        "query": query,
        "collection_name": collection_name,
        "api_key": api_key
    }
    response = requests.post(url, params=params)
    response.raise_for_status()
    return response.json()

def retrieve_answer(query: str, model_family: str, model_name: str, api_key: str,
                  prompt: str, collection_name: str, history_data: str) -> Dict:
    """
    Executes the main RAG workflow: takes a user query, retrieves relevant context from
    the specified collection(s), formats with a prompt and history, and sends it to
    a specified LLM to generate a final answer.
    
    Args:
        query (str): The user's question or input
        model_family (str): The family/provider of the generative LLM (e.g., 'openai', 'anthropic')
        model_name (str): The specific name of the generative LLM (e.g., 'gpt-4', 'claude-3-opus')
        api_key (str): API key needed for the generative LLM service
        prompt (str): The prompt template for structuring input to the LLM
        collection_name (str): Name of the ChromaDB collection(s) to search for relevant context
        history_data (str): Conversation history in specific format (JSON string)
        
    Returns:
        Dict: JSON response containing the generated answer
    """
    url = f"{BASE_URL}/api/app/inferencing/retrieve_answer_using_collections"
    params = {
        "query": query,
        "model_family": model_family,
        "model_name": model_name,
        "api_key": api_key,
        "prompt": prompt,
        "collection_name": collection_name,
        "history_data": history_data
    }
    
    # Construct the URL with properly encoded parameters
    query_string = urllib.parse.urlencode(params)
    full_url = f"{url}?{query_string}"
    
    response = requests.post(full_url)
    response.raise_for_status()
    return response.json()

def pretty_print_json(data: Any) -> None:
    """
    Helper function to print JSON data in a readable format.
    
    Args:
        data (Any): Data to be printed as formatted JSON
    """
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    """
    Example usage of the RAG API client functions
    """
    print("\n--- Available Collections ---")
    collections = list_collections()
    pretty_print_json(collections)
    
    if collections and isinstance(collections, list) and len(collections) > 0:
        # Get the first collection name
        first_collection = collections[0]
        print(f"\n--- Documents in Collection '{first_collection}' ---")
        documents = get_collection_documents(first_collection)
        pretty_print_json(documents)
        
        # If there are documents, get chunks from the first document
        if isinstance(documents, dict) and documents.get("documents"):
            first_document = documents["documents"][0]
            print(f"\n--- Sample Chunks from Document '{first_document}' ---")
            chunks = get_document_chunks(first_collection, first_document)
            pretty_print_json(chunks)
            
            print(f"\n--- Document Status for '{first_document}' ---")
            status = check_document_status(first_collection, first_document)
            pretty_print_json(status)
        
        print(f"\n--- Metadata for Collection '{first_collection}' ---")
        metadata = get_collection_metadata(first_collection)
        pretty_print_json(metadata)