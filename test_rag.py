#!/usr/bin/env python3
"""
Simple test script for RAG functionality
"""

import os
from dotenv import load_dotenv
from rag_api_client import list_collections, get_document_chunks, retrieve_answer

# Load environment variables
load_dotenv(".client_env")

def test_collections():
    """Test listing collections"""
    print("\n--- Testing: Listing Collections ---")
    try:
        collections = list_collections()
        print(f"Found {len(collections)} collections:")
        for i, collection in enumerate(collections, 1):
            print(f"{i}. {collection}")
        return collections
    except Exception as e:
        print(f"Error listing collections: {str(e)}")
        return []

def test_document_chunks(collection_name):
    """Test retrieving document chunks"""
    print(f"\n--- Testing: Document Chunks from '{collection_name}' ---")
    try:
        # Since we don't know document names, we'll use the collection name as a placeholder
        # This will likely fail but demonstrates the API call
        chunks = get_document_chunks(
            collection_name=collection_name,
            document_path=collection_name,  # Using collection name as placeholder
            limit=2
        )
        print(f"Retrieved chunks: {chunks}")
    except Exception as e:
        print(f"Error getting document chunks: {str(e)}")
        print("Note: This failure might be expected if no valid document path is provided.")

def test_rag_query(collection_name, api_key):
    """Test RAG query"""
    print(f"\n--- Testing: RAG Query on '{collection_name}' ---")
    
    if not api_key:
        print("Error: No API key provided. Set MISTRAL_API_KEY in your environment.")
        return
    
    try:
        # Sample query relevant to first aid/emergency response
        query = "What are the steps for treating a burn victim?"
        
        # Basic prompt template
        prompt = """Answer the following question based on the provided context.
        If you cannot answer the question from the context, say so.
        
        Context: {context}
        
        Question: {question}
        
        Answer:"""
        
        print(f"Query: {query}")
        result = retrieve_answer(
            query=query,
            model_family="mistral",
            model_name="mistral-small",
            api_key=api_key,
            prompt=prompt,
            collection_name=collection_name,
            history_data="[]"
        )
        
        print("\nRAG Response:")
        if "answer" in result:
            print(result["answer"])
        else:
            print(result)
    except Exception as e:
        print(f"Error with RAG query: {str(e)}")

def main():
    # Get API key from environment
    api_key = os.environ.get("MISTRAL_API_KEY")
    
    # Test listing collections
    collections = test_collections()
    
    if collections:
        # Test with the first collection
        first_collection = collections[0]
        test_document_chunks(first_collection)
        test_rag_query(first_collection, api_key)
    else:
        print("No collections available to test.")

if __name__ == "__main__":
    main()