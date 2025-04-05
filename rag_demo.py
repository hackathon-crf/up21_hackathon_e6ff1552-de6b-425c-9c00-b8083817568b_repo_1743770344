#!/usr/bin/env python3
"""
RAG System API Demo

This script demonstrates how to use the RAG API client to interact
with the RAG system, particularly the POST operations like creating
collections, adding documents, getting embeddings, and retrieving answers.
"""

import argparse
import json
import os
from rag_api_client import (
    list_collections,
    create_collection,
    add_document,
    get_embeddings,
    retrieve_answer,
    pretty_print_json
)

def demo_create_collection(args):
    """Create a new collection with the specified name"""
    print(f"\n--- Creating Collection '{args.name}' ---")
    try:
        result = create_collection(args.name)
        pretty_print_json(result)
        print(f"\nCollection '{args.name}' created successfully!")
    except Exception as e:
        print(f"Error creating collection: {str(e)}")

def demo_add_document(args):
    """Add a document to an existing collection"""
    if not os.path.exists(args.file_path):
        print(f"Error: File '{args.file_path}' does not exist!")
        return
    
    print(f"\n--- Adding Document '{os.path.basename(args.file_path)}' to Collection '{args.collection}' ---")
    try:
        result = add_document(
            file_path=args.file_path,
            collection_name=args.collection,
            model=args.model,
            api_key=args.api_key,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap
        )
        pretty_print_json(result)
        print(f"\nDocument '{os.path.basename(args.file_path)}' added successfully!")
    except Exception as e:
        print(f"Error adding document: {str(e)}")

def demo_get_embeddings(args):
    """Get embeddings for a text query"""
    print(f"\n--- Getting Embeddings for Query ---")
    print(f"Query: '{args.query}'")
    print(f"Collection: '{args.collection}'")
    
    try:
        result = get_embeddings(
            query=args.query,
            collection_name=args.collection,
            api_key=args.api_key
        )
        # We'll just print the shape of the embedding vector to avoid flooding the console
        if isinstance(result, dict) and "embedding" in result:
            embedding = result["embedding"]
            print(f"\nEmbedding generated successfully!")
            print(f"Embedding dimension: {len(embedding)}")
            print(f"First few values: {embedding[:5]}...")
        else:
            pretty_print_json(result)
    except Exception as e:
        print(f"Error getting embeddings: {str(e)}")

def demo_retrieve_answer(args):
    """Retrieve answer using the RAG system"""
    print(f"\n--- Retrieving Answer Using RAG ---")
    print(f"Query: '{args.query}'")
    print(f"Collection: '{args.collection}'")
    print(f"Model: {args.model_family}/{args.model_name}")
    
    # Format history_data if not provided
    if not args.history_data:
        history_data = json.dumps([])
    else:
        history_data = args.history_data
        
    try:
        result = retrieve_answer(
            query=args.query,
            model_family=args.model_family,
            model_name=args.model_name,
            api_key=args.api_key,
            prompt=args.prompt,
            collection_name=args.collection,
            history_data=history_data
        )
        pretty_print_json(result)
    except Exception as e:
        print(f"Error retrieving answer: {str(e)}")

def list_available_collections():
    """List all available collections in the RAG system"""
    print("\n--- Available Collections ---")
    try:
        collections = list_collections()
        pretty_print_json(collections)
        return collections
    except Exception as e:
        print(f"Error listing collections: {str(e)}")
        return []

def main():
    """Main entry point for the RAG API demo script"""
    parser = argparse.ArgumentParser(description="RAG System API Demo")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # List collections command
    list_parser = subparsers.add_parser("list", help="List available collections")
    
    # Create collection command
    create_parser = subparsers.add_parser("create", help="Create a new collection")
    create_parser.add_argument("--name", required=True, help="Name for the new collection")
    
    # Add document command
    add_parser = subparsers.add_parser("add", help="Add a document to a collection")
    add_parser.add_argument("--file-path", required=True, help="Path to the file to upload")
    add_parser.add_argument("--collection", required=True, help="Collection name to add the document to")
    add_parser.add_argument("--model", required=True, 
                           help="Embedding model to use (e.g., 'mistral-embed', 'text-embedding-ada-002')")
    add_parser.add_argument("--api-key", required=True, help="API key for the embedding service")
    add_parser.add_argument("--chunk-size", type=int, help="Size of text chunks")
    add_parser.add_argument("--chunk-overlap", type=int, help="Overlap between consecutive chunks")
    
    # Get embeddings command
    embed_parser = subparsers.add_parser("embed", help="Get embeddings for a query")
    embed_parser.add_argument("--query", required=True, help="Text query to embed")
    embed_parser.add_argument("--collection", required=True, help="Reference collection name")
    embed_parser.add_argument("--api-key", required=True, help="API key for the embedding service")
    
    # Retrieve answer command
    retrieve_parser = subparsers.add_parser("retrieve", help="Retrieve answer using RAG")
    retrieve_parser.add_argument("--query", required=True, help="User query")
    retrieve_parser.add_argument("--model-family", required=True, 
                                help="LLM family (e.g., 'mistral', 'openai', 'anthropic')")
    retrieve_parser.add_argument("--model-name", required=True, 
                               help="Specific LLM model name (e.g., 'mistral-small', 'gpt-4', 'claude-3-opus')")
    retrieve_parser.add_argument("--api-key", required=True, help="API key for the LLM service")
    retrieve_parser.add_argument("--prompt", required=True, help="Prompt template for the LLM")
    retrieve_parser.add_argument("--collection", required=True, help="Collection name to search")
    retrieve_parser.add_argument("--history-data", help="Conversation history as JSON string")
    
    args = parser.parse_args()
    
    if args.command == "list":
        list_available_collections()
    elif args.command == "create":
        demo_create_collection(args)
    elif args.command == "add":
        demo_add_document(args)
    elif args.command == "embed":
        demo_get_embeddings(args)
    elif args.command == "retrieve":
        demo_retrieve_answer(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    # Example usage of this demo script:
    
    # 1. List collections
    # python rag_demo.py list
    
    # 2. Create a new collection 
    # python rag_demo.py create --name "my_new_collection"
    
    # 3. Add a document to the collection
    # python rag_demo.py add --file-path "document.pdf" \
    #                       --collection "my_new_collection" \
    #                       --model "mistral-embed" \
    #                       --api-key "your-mistral-api-key" \
    #                       --chunk-size 1000 \
    #                       --chunk-overlap 200
    
    # 4. Get embeddings for a query
    # python rag_demo.py embed --query "What is first aid for burns?" \
    #                         --collection "PSE_fichesdecas" \
    #                         --api-key "your-mistral-api-key"
    
    # 5. Retrieve an answer using RAG
    # python rag_demo.py retrieve --query "How should I treat a first-degree burn?" \
    #                            --model-family "mistral" \
    #                            --model-name "mistral-small" \
    #                            --api-key "your-mistral-api-key" \
    #                            --prompt "Answer the following question based on the provided context: {context}\n\nQuestion: {question}" \
    #                            --collection "PSE_fichesdecas" \
    #                            --history-data "[]"
    
    main()