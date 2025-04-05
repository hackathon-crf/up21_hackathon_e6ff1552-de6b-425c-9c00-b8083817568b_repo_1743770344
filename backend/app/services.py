from backend.app.back_utils import test
import random
import time
import logging
import os
import sys
import json
import uuid
from datetime import datetime
from mistralai import Mistral
from dotenv import load_dotenv, find_dotenv
from rag_api_client import get_document_chunks, retrieve_answer, list_collections
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# Configure logging with higher level to ensure visibility
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/backend.log", mode='w'),  # Use 'w' mode to create a fresh log
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Configure a separate logger for token usage tracking
token_logger = logging.getLogger("token_usage")
token_logger.setLevel(logging.INFO)
token_handler = logging.FileHandler("logs/tokens.log")
token_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
token_logger.addHandler(token_handler)
# Prevent the token logger from propagating logs to the root logger
token_logger.propagate = False

# LOADING INDICATOR - helps us verify this updated code is running
logger.warning("🔄 LOADING UPDATED SERVICES.PY WITH MISTRAL API, RAG INTEGRATION AND NEW API ENDPOINTS")

# Find and load the .env file
dotenv_path = find_dotenv()
logger.warning(f"📁 Found .env file at: {dotenv_path}")
load_dotenv(dotenv_path)

# In-memory storage for chat histories and feedback - would be replaced with a database in production
chat_histories = {}
user_feedback = {}
user_preferences = {}

# Initialize Mistral client
try:
    # Get the API key directly
    api_key = os.environ.get("MISTRAL_API_KEY")
    
    if not api_key:
        logger.warning("🚫 MISTRAL_API_KEY not found in environment variables. Falling back to rule-based responses.")
        mistral_client = None
    else:
        # Log API key information for debugging (safely)
        key_length = len(api_key)
        key_prefix = api_key[:4] if key_length > 4 else ""
        key_suffix = api_key[-4:] if key_length > 4 else ""
        logger.warning(f"🔑 API key loaded. Length: {key_length}, Prefix: {key_prefix}..., Suffix: ...{key_suffix}")
        
        # Clean the API key (remove any quotes or whitespace)
        api_key = api_key.strip().strip('"\'')
        logger.warning(f"🔑 API key cleaned. New length: {len(api_key)}")
        
        # Initialize the client with the cleaned API key
        mistral_client = Mistral(api_key=api_key)
        logger.warning("✅ Mistral client initialized successfully")
        
        # Test if the client works with a simple query
        try:
            logger.warning("🧪 Testing API connection with a simple query...")
            test_messages = [
                {
                    "role": "system",
                    "content": "Test"
                }
            ]
            # Use stream() method but collect the full response for the test
            stream_response = mistral_client.chat.stream(
                model="mistral-tiny", 
                messages=test_messages
            )
            
            # Collect content from all chunks
            response_content = ""
            for chunk in stream_response:
                if chunk.data.choices[0].delta.content is not None:
                    response_content += chunk.data.choices[0].delta.content
            
            logger.warning(f"✅ API TEST SUCCESS! Response: {response_content[:50]}...")
        except Exception as e:
            logger.error(f"❌ API connection test FAILED: {str(e)}")
            mistral_client = None
            
except Exception as e:
    logger.error(f"❌ Error initializing Mistral client: {str(e)}")
    mistral_client = None

# Model to use - ensure we use tiny model for testing to avoid any access issues
MISTRAL_MODEL = "mistral-tiny"

# Sample responses for fallback
CHATBOT_RESPONSES = {
    "greeting": [
        "Hello! How can I help you today?",
        "Hi there! What can I do for you?",
        "Greetings! How may I assist you?",
        "Hey! How can I be of service today?"
    ],
    "farewell": [
        "Goodbye! Have a great day!",
        "Farewell! Feel free to return if you have more questions.",
        "See you later! Don't hesitate to ask if you need anything else.",
        "Take care! I'm here if you need help again."
    ],
    "thanks": [
        "You're welcome! Is there anything else I can help with?",
        "Happy to help! Let me know if you need anything more.",
        "My pleasure! What else would you like to know?",
        "No problem at all! Feel free to ask more questions."
    ],
    "unknown": [
        "I'm not sure I understand. Could you rephrase that?",
        "Hmm, I'm having trouble processing that request. Can you try again?",
        "I don't have an answer for that yet. Is there something else I can help with?",
        "That's an interesting question. Let me think about how to help you with that."
    ],
    "about": [
        "I'm a modern chatbot designed to help answer your questions!",
        "I'm your friendly AI assistant, ready to chat and help out.",
        "I'm a virtual assistant created to provide information and assistance.",
        "I'm a chatbot built with modern UI/UX principles, focused on providing a great user experience."
    ],
    "capabilities": [
        "I can answer questions, provide information, and have simple conversations.",
        "I'm designed to help with basic queries and provide friendly responses.",
        "I can chat with you about various topics and try to be helpful with your questions.",
        "My main purpose is to demonstrate a modern chatbot interface with good UI/UX design."
    ],
    "features": [
        "This chatbot features a beautiful, modern UI with animated elements and a responsive design.",
        "I come with features like typing indicators, message timestamps, and a clean chat interface.",
        "My design includes custom styling, animations, and an intuitive user experience.",
        "This implementation showcases frontend-backend integration with a FastAPI backend and Streamlit frontend."
    ]
}

class RAGConfig(BaseModel):
    enabled: bool
    collections: List[str]
    top_k: Optional[int] = 3


def test_service():
    return test()


def retrieve_relevant_context(query: str, rag_config: RAGConfig) -> str:
    """
    Retrieve relevant information from RAG collections based on the query
    
    Args:
        query (str): The user's query
        rag_config (RAGConfig): Configuration for RAG retrieval
        
    Returns:
        str: Retrieved context as a formatted string
    """
    if not rag_config or not rag_config.enabled or not rag_config.collections:
        return ""
    
    logger.warning(f"🔍 Retrieving context from RAG collections for query: '{query}'")
    
    collections = rag_config.collections
    top_k = rag_config.top_k
    
    # Placeholder for all retrieved contexts
    retrieved_contexts = []
    context_str = ""
    
    try:
        for collection in collections:
            logger.warning(f"🔍 Searching in collection: {collection}")
            
            # Get documents from collection (this is a simplified approach)
            # In a real implementation, you would use semantic search here
            # For now, we'll just get some document chunks to simulate the process
            response = get_document_chunks(
                collection_name=collection, 
                document_path=query,  # Using the query as a placeholder document path
                limit=top_k
            )
            
            # Extract chunks from response
            if isinstance(response, dict) and "chunks" in response:
                chunks = response.get("chunks", [])
                for chunk in chunks:
                    retrieved_contexts.append({
                        "collection": collection,
                        "text": chunk
                    })
                    
        # Format the retrieved context into a string
        if retrieved_contexts:
            context_str = "Here's some relevant information that may help you answer:\n\n"
            for i, ctx in enumerate(retrieved_contexts, 1):
                collection_name = ctx["collection"]
                text = ctx["text"]
                context_str += f"Source {i} ({collection_name}):\n{text}\n\n"
        
        logger.warning(f"📚 Retrieved {len(retrieved_contexts)} context chunks")
        return context_str
    
    except Exception as e:
        logger.error(f"❌ Error retrieving context: {str(e)}")
        return ""


def chat_service(message, rag_config=None):
    """
    Process a user message and generate a response using Mistral AI
    
    Args:
        message (str): The user's message
        rag_config (RAGConfig, optional): Configuration for RAG retrieval
        
    Returns:
        str: The chatbot's response
    """
    logger.warning(f"📩 Received message: '{message}'")
    
    # Start timing the response
    start_time = time.time()
    
    # Generate a message ID for tracking and feedback
    message_id = str(uuid.uuid4())
    
    # Retrieve relevant context if RAG is enabled
    context = ""
    if rag_config and rag_config.enabled:
        context = retrieve_relevant_context(message, rag_config)
        if context:
            logger.warning(f"📚 Retrieved context: '{context[:100]}...'")
    
    # Use Mistral API if available
    if mistral_client:
        try:
            logger.warning(f"🤖 Using MISTRAL API to generate response")
            
            # Create system prompt with RAG context if available
            system_prompt = "You are a helpful and friendly assistant. Your responses should be concise, informative, and engaging. You're part of a modern chatbot interface demo."
            if context:
                system_prompt += "\n\nUse the following information to help answer the user's question:\n\n" + context
            
            messages = [
                {
                    "role": "system", 
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": message
                }
            ]
            
            logger.warning(f"📤 Sending request to model: {MISTRAL_MODEL}")
            
            # Get the streaming response
            stream_response = mistral_client.chat.stream(
                model=MISTRAL_MODEL,
                messages=messages
            )
            
            # Collect content from all chunks
            response_content = ""
            for chunk in stream_response:
                if chunk.data.choices[0].delta.content is not None:
                    response_content += chunk.data.choices[0].delta.content
            
            # Add API prefix to the response if not already there
            if not response_content.startswith('[API]'):
                response_content = "[API] " + response_content
            
            logger.warning(f"📥 Got Mistral API streaming response: {response_content[:50]}...")
            
            # Calculate response time
            response_time = time.time() - start_time
            
            # Estimate token counts (rough approximation)
            input_tokens = len(system_prompt + "\n\n" + message) // 4
            output_tokens = len(response_content) // 4
            total_tokens = input_tokens + output_tokens
            
            # Log AI request details
            log_ai_request(
                model=MISTRAL_MODEL,
                input_text=system_prompt + "\n\n" + message,
                output_text=response_content,
                rag_used=bool(rag_config and rag_config.enabled),
                rag_collections=rag_config.collections if rag_config and rag_config.enabled else None
            )
            
            # Return response with token and time information
            return {
                "response": response_content,
                "metrics": {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": total_tokens,
                    "response_time": round(response_time, 2)
                }
            }
        
        except Exception as e:
            logger.error(f"❌ Error calling Mistral API: {str(e)}")
            logger.warning("⚠️ Falling back to rule-based responses")
            
            # Calculate response time even for fallback
            response_time = time.time() - start_time
            fallback_response = "[FALLBACK] Sorry, I couldn't connect to my AI brain. " + get_fallback_response(message)
            
            return {
                "response": fallback_response,
                "metrics": {
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "response_time": round(response_time, 2)
                }
            }
    
    # Fallback to rule-based responses if Mistral is not available
    logger.warning("⚠️ Using fallback rule-based responses (Mistral client not available)")
    
    # Calculate response time for fallback
    response_time = time.time() - start_time
    fallback_response = "[FALLBACK] " + get_fallback_response(message)
    
    return {
        "response": fallback_response,
        "metrics": {
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "response_time": round(response_time, 2)
        }
    }

def get_fallback_response(message):
    """Get a fallback response when the API is not available"""
    # Simulate processing time
    time.sleep(0.2)
    
    message_lower = message.lower().strip()
    
    # Very simple response logic based on keywords
    if any(word in message_lower for word in ["hi", "hello", "hey", "greetings"]):
        response_type = "greeting"
    elif any(word in message_lower for word in ["bye", "goodbye", "farewell", "see you"]):
        response_type = "farewell"
    elif any(word in message_lower for word in ["thanks", "thank you", "appreciate"]):
        response_type = "thanks"
    elif any(word in message_lower for word in ["who are you", "what are you", "about you"]):
        response_type = "about"
    elif any(word in message_lower for word in ["can you", "able to", "capabilities"]):
        response_type = "capabilities"
    elif any(word in message_lower for word in ["features", "design", "interface", "ui"]):
        response_type = "features"
    else:
        # If we detect a question but don't have a specific category
        if "?" in message or any(word in message_lower for word in ["what", "how", "why", "where", "when", "who"]):
            # For questions we don't have explicit answers for
            if "weather" in message_lower:
                return "I'm not connected to weather services, but I hope it's nice outside!"
            elif "time" in message_lower:
                return f"I don't have access to the current time, but it's always a good time to chat!"
            elif "name" in message_lower:
                return "You can call me Modern Chatbot. What's your name?"
            else:
                response_type = "unknown"
        else:
            # For statements or commands
            response_type = "unknown"
    
    # Select a random response from the appropriate category
    response = random.choice(CHATBOT_RESPONSES[response_type])
    
    logger.warning(f"📝 Responding with fallback: {response}")
    return response

def save_chat_history_service(history_data):
    """
    Save chat history to storage (in-memory for now, would be a database in production)
    
    Args:
        history_data: List of chat history entries
        
    Returns:
        dict: Status of the operation
    """
    try:
        # Generate a unique ID for this chat history
        chat_id = str(uuid.uuid4())
        
        # Store the history with a timestamp
        chat_histories[chat_id] = {
            "history": history_data,
            "timestamp": datetime.now().isoformat(),
        }
        
        logger.info(f"💾 Saved chat history with ID: {chat_id}")
        return {
            "status": "success",
            "chat_id": chat_id,
            "message": "Chat history saved successfully"
        }
    except Exception as e:
        logger.error(f"❌ Error saving chat history: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to save chat history: {str(e)}"
        }

def submit_feedback_service(message_id, rating, comments=None):
    """
    Store feedback about a specific message/response
    
    Args:
        message_id: Unique identifier for the message
        rating: Numeric rating (typically 1-5)
        comments: Optional feedback comments
        
    Returns:
        dict: Status of the operation
    """
    try:
        # Store the feedback
        user_feedback[message_id] = {
            "rating": rating,
            "comments": comments,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"📊 Received feedback for message {message_id}: {rating}/5")
        return {
            "status": "success",
            "message": "Feedback recorded successfully",
            "data": {
                "message_id": message_id,
                "processed": True
            }
        }
    except Exception as e:
        logger.error(f"❌ Error recording feedback: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to record feedback: {str(e)}"
        }

def update_preferences_service(preferences_data):
    """
    Update and store user preferences
    
    Args:
        preferences_data: Dictionary containing user preferences
        
    Returns:
        dict: Status of the operation
    """
    try:
        # Generate a user ID (in a real app, this would be tied to user authentication)
        user_id = "default_user"  # Simplified for this demo
        
        # Store or update the preferences
        if user_id not in user_preferences:
            user_preferences[user_id] = {}
        
        # Update each section of preferences
        for section, data in preferences_data.items():
            user_preferences[user_id][section] = data
        
        logger.info(f"⚙️ Updated preferences for user: {user_id}")
        return {
            "status": "success",
            "message": "Preferences updated successfully",
            "data": {
                "user_id": user_id,
                "updated_sections": list(preferences_data.keys())
            }
        }
    except Exception as e:
        logger.error(f"❌ Error updating preferences: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to update preferences: {str(e)}"
        }

def rag_direct_query_service(query, collection_name, top_k=3):
    """
    Perform a direct RAG query without generating a response
    
    Args:
        query: The search query
        collection_name: Name of the collection to search
        top_k: Number of results to return
        
    Returns:
        dict: Query results
    """
    try:
        logger.info(f"🔍 Processing direct RAG query: '{query}' in collection '{collection_name}'")
        
        # Get document chunks
        response = get_document_chunks(
            collection_name=collection_name,
            document_path=query,  # Using the query as a document path (this is simplified)
            limit=top_k
        )
        
        # Extract chunks from response
        chunks = []
        if isinstance(response, dict) and "chunks" in response:
            chunks = response.get("chunks", [])
        
        logger.info(f"📚 Retrieved {len(chunks)} chunks for query")
        return {
            "status": "success",
            "message": "RAG query processed successfully",
            "data": {
                "query": query,
                "collection": collection_name,
                "top_k": top_k,
                "chunks": chunks
            }
        }
    except Exception as e:
        logger.error(f"❌ Error processing RAG query: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to process RAG query: {str(e)}"
        }

def create_collection_service(collection_name: str) -> dict:
    """
    Create a new RAG collection
    
    Args:
        collection_name (str): Name for the new collection
        
    Returns:
        dict: API response with creation status
    """
    try:
        from rag_api_client import create_collection
        
        logger.info(f"🗂️ Creating new collection: '{collection_name}'")
        response = create_collection(collection_name)
        logger.info(f"✅ Collection created successfully: {collection_name}")
        return response
    except Exception as e:
        logger.error(f"❌ Error creating collection: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to create collection: {str(e)}"
        }

async def add_document_service(document, collection_name: str, model: str, chunk_size=None, chunk_overlap=None) -> dict:
    """
    Add a document to a RAG collection
    
    Args:
        document: UploadFile object containing the document
        collection_name (str): Collection to add document to
        model (str): Embedding model to use
        chunk_size (int, optional): Size of text chunks
        chunk_overlap (int, optional): Overlap between chunks
        
    Returns:
        dict: API response with addition status
    """
    import tempfile
    import os
    from rag_api_client import add_document
    
    try:
        # Get API key from environment
        api_key = os.environ.get("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("Missing API key for document embedding")
        
        # Save uploaded file to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{document.filename}") as tmp:
            content = await document.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        logger.info(f"📄 Adding document '{document.filename}' to collection '{collection_name}'")
        
        # Call RAG API to add document
        response = add_document(
            file_path=tmp_path,
            collection_name=collection_name,
            model=model,
            api_key=api_key,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        logger.info(f"✅ Document added successfully: '{document.filename}'")
        return response
    
    except Exception as e:
        logger.error(f"❌ Error adding document: {str(e)}")
        # Ensure temp file is cleaned up in case of error
        try:
            if 'tmp_path' in locals():
                os.unlink(tmp_path)
        except:
            pass
            
        return {
            "status": "error",
            "message": f"Failed to add document: {str(e)}"
        }

def get_embeddings_service(query: str, collection_name: str) -> dict:
    """
    Generate embeddings for a text query
    
    Args:
        query (str): Text to embed
        collection_name (str): Collection determining the embedding model
        
    Returns:
        dict: Embedding vector
    """
    try:
        import os
        from rag_api_client import get_embeddings
        
        # Get API key from environment
        api_key = os.environ.get("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("Missing API key for generating embeddings")
        
        logger.info(f"🧠 Generating embeddings for query in collection '{collection_name}'")
        
        response = get_embeddings(
            query=query,
            collection_name=collection_name,
            api_key=api_key
        )
        
        # Log success without printing the entire embedding vector
        if "embedding" in response and isinstance(response["embedding"], list):
            embedding_len = len(response["embedding"])
            logger.info(f"✅ Embeddings generated successfully: {embedding_len} dimensions")
        else:
            logger.info("✅ Response received but no embedding found in response")
            
        return response
    except Exception as e:
        logger.error(f"❌ Error generating embeddings: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to generate embeddings: {str(e)}"
        }

def retrieve_answer_service(query: str, model_family: str, model_name: str, 
                           prompt: str, collection_name: str, history_data: str = "[]") -> dict:
    """
    Use RAG to retrieve an answer to a query
    
    Args:
        query (str): User's question
        model_family (str): The LLM provider family (mistral, openai, etc.)
        model_name (str): Specific model to use
        prompt (str): System prompt template
        collection_name (str): Knowledge base to query
        history_data (str, optional): JSON string of conversation history
        
    Returns:
        dict: Generated answer and metadata
    """
    try:
        import os
        from rag_api_client import retrieve_answer
        
        # Get API key from environment
        api_key = os.environ.get("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("Missing API key for LLM inference")
        
        logger.info(f"🔍 Retrieving RAG answer using {model_family}/{model_name}")
        logger.info(f"📚 Using collection: {collection_name}")
        
        response = retrieve_answer(
            query=query,
            model_family=model_family,
            model_name=model_name,
            api_key=api_key,
            prompt=prompt,
            collection_name=collection_name,
            history_data=history_data
        )
        
        # Log a snippet of the answer
        if "answer" in response:
            answer_snippet = response["answer"][:100] + "..." if len(response["answer"]) > 100 else response["answer"]
            logger.info(f"✅ Answer retrieved: {answer_snippet}")
            
            # Log the AI request details for RAG
            log_ai_request(
                model=f"{model_family}/{model_name}",
                input_text=query,
                output_text=response["answer"],
                rag_used=True,
                rag_collections=[collection_name]
            )
        else:
            logger.info("✅ Response received but no answer found in response")
            
        return response
    except Exception as e:
        logger.error(f"❌ Error retrieving answer: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to retrieve answer: {str(e)}"
        }

def log_ai_request(model: str, input_text: str, output_text: str, rag_used: bool = False, rag_collections: List[str] = None):
    """
    Log AI request details to a separate log file
    
    Args:
        model (str): The model name used for generation
        input_text (str): The input text (for token count estimation)
        output_text (str): The output text (for token count estimation)
        rag_used (bool): Whether RAG was used for this request
        rag_collections (List[str], optional): List of collections used for RAG
    """
    try:
        # Estimate token counts (actual implementation would use model tokenizer)
        # Using rough approximation: ~4 chars per token for English text
        input_tokens = len(input_text) // 4
        output_tokens = len(output_text) // 4
        total_tokens = input_tokens + output_tokens
        
        # Format the log message
        timestamp = datetime.now().isoformat()
        rag_info = f"RAG: {rag_used}, Collections: {rag_collections if rag_collections else []}"
        
        log_message = f"Model: {model}, Input tokens: {input_tokens}, Output tokens: {output_tokens}, " \
                     f"Total tokens: {total_tokens}, {rag_info}"
        
        # Log the details
        token_logger.info(log_message)
        
        # Regular log for debugging
        logger.info(f"📊 Logged AI request: {model}, {input_tokens} -> {output_tokens} tokens, RAG: {rag_used}")
        
    except Exception as e:
        logger.error(f"❌ Error logging AI request: {str(e)}")
