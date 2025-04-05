from fastapi import FastAPI, APIRouter, Body, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from backend.app.services import (
    test_service, 
    chat_service, 
    save_chat_history_service,
    submit_feedback_service,
    update_preferences_service,
    rag_direct_query_service,
    create_collection_service,
    add_document_service,
    get_embeddings_service,
    retrieve_answer_service
)
from backend.app.flashcard_services import (
    analyze_card_difficulty,
    generate_related_cards
)
from settings.config import settings
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


app_router = APIRouter(
    prefix="/api/app",
    tags=["App"],
)

chat_router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)

rag_router = APIRouter(
    prefix="/api/rag",
    tags=["RAG"],
)

flashcard_router = APIRouter(
    prefix="/api/flashcards",
    tags=["Flashcards"],
)

class RAGConfig(BaseModel):
    enabled: bool = False
    collections: List[str] = []
    top_k: int = 3

class MessageRequest(BaseModel):
    message: str
    rag_config: Optional[RAGConfig] = None

class ChatHistoryEntry(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None
    
class ChatHistoryRequest(BaseModel):
    history: List[ChatHistoryEntry]
    
class FeedbackRequest(BaseModel):
    message_id: str
    rating: int
    comments: Optional[str] = None
    
class UserPreferences(BaseModel):
    prompt: Dict[str, Any]
    model: Dict[str, Any]
    context: Dict[str, Any]
    rag: Dict[str, Any]
    other: Dict[str, Any]
    
class EmbeddingRequest(BaseModel):
    query: str
    collection_name: str
    
class RetrieveAnswerRequest(BaseModel):
    query: str
    model_family: str
    model_name: str
    prompt: str
    collection_name: str
    history_data: Optional[str] = "[]"

class FlashcardData(BaseModel):
    id: str
    question: str
    answer: str
    title: Optional[str] = ""
    image_url: Optional[str] = ""
    created_at: Optional[str] = None
    tags: Optional[List[str]] = None
    repetitions: Optional[int] = 0
    ease_factor: Optional[float] = 2.5
    last_review: Optional[str] = None
    next_review: Optional[str] = None
    difficulty_score: Optional[float] = None

class AnalyzeFlashcardsRequest(BaseModel):
    cards: List[FlashcardData]

class GenerateFlashcardsRequest(BaseModel):
    difficult_cards: List[FlashcardData]
    num_to_generate: Optional[int] = 3
    difficulty_level: Optional[str] = "medium"
    generation_strategy: Optional[str] = "related"

def create_app(root_path: str = "") -> FastAPI:
    """
    Creating a FastAPI instance and registering routes.

    Args:
        root_path: The root path where the API is mounted (e.g., /username/app_name)
    """

    backend_app = FastAPI(
        title="Chatbot API",
        version="1.0.0",
        openapi_version="3.1.0",
        root_path=root_path
    )

    # CORS Configuration
    backend_app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Registering routes
    backend_app.include_router(app_router)
    backend_app.include_router(chat_router)
    backend_app.include_router(rag_router)
    backend_app.include_router(flashcard_router)
    return backend_app

@app_router.get("/test/")
async def test():
        return {
            "status:": 200,
            "message": test_service(),
            "data": {
                "title": "here is some example data",
                "genAI_info": {
                    "use_cases": ["Chatbot creation", "Content generation", "Data augmentation",
                                  "Customer support automation"],
                    "key_features": {
                        "personalization": "Generates tailored responses based on user input and context.",
                        "RAG_integration": "Utilizes external knowledge sources to enhance generated responses.",
                        "no_code": "Allows non-technical users to build AI-powered chatbots easily.",
                        "security": "Ensures data privacy with secure integrations and compliance."
                    },
                    "user_examples": [
                        {"name": "John", "use_case": "E-commerce chatbot", "result": "Improved customer engagement by 25%"},
                        {"name": "Sara", "use_case": "Content creation",
                         "result": "Saved 10 hours weekly on content production"}
                    ]
                },
                "additional_metrics": {
                    "response_time_ms": 150,
                    "api_version": "1.0.2"
                }
            }
        }

@chat_router.post("/message/")
async def process_message(request: MessageRequest):
    """
    Process incoming chat messages and return a response
    """
    response_data = chat_service(request.message, request.rag_config)
    # Ensure we return both the response content and metrics
    if isinstance(response_data, dict):
        return response_data
    else:
        # Fallback for backward compatibility if response is just a string
        return {
            "response": response_data,
            "metrics": {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "response_time": 0
            }
        }

@chat_router.post("/history/save/")
async def save_chat_history(request: ChatHistoryRequest):
    """
    Save the current chat history to the backend
    """
    response = save_chat_history_service(request.history)
    return {"status": "success", "message": response}

@chat_router.post("/feedback/")
async def submit_feedback(request: FeedbackRequest):
    """
    Submit feedback about a specific message/response
    """
    response = submit_feedback_service(request.message_id, request.rating, request.comments)
    return {
        "status": "success", 
        "message": f"Feedback received for message {request.message_id}",
        "data": {
            "rating": request.rating,
            "processed": response
        }
    }

@chat_router.post("/preferences/")
async def update_preferences(preferences: UserPreferences):
    """
    Update user preferences for the chat application
    """
    response = update_preferences_service(preferences.dict())
    return {
        "status": "success",
        "message": "User preferences updated successfully",
        "data": {
            "updated_sections": response
        }
    }

@chat_router.post("/rag/query/")
async def rag_direct_query(query: str = Body(...), collection_name: str = Body(...), top_k: int = Body(3)):
    """
    Send a direct query to the RAG system without generating a response
    Useful for testing and debugging RAG functionality
    """
    response = rag_direct_query_service(query, collection_name, top_k)
    return {
        "status": "success",
        "message": "RAG query processed",
        "data": response
    }

@rag_router.post("/collections/create/")
async def create_collection(name: str = Body(...)):
    """
    Create a new, empty collection in the RAG system
    """
    response = create_collection_service(name)
    return {
        "status": "success",
        "message": f"Collection '{name}' created successfully",
        "data": response
    }

@rag_router.post("/documents/add/")
async def add_document(
    document: UploadFile = File(...),
    collection_name: str = Form(...),
    model: str = Form(...),
    chunk_size: Optional[int] = Form(None),
    chunk_overlap: Optional[int] = Form(None)
):
    """
    Upload a document to a RAG collection
    """
    response = await add_document_service(
        document=document,
        collection_name=collection_name,
        model=model,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return {
        "status": "success",
        "message": f"Document '{document.filename}' added successfully to collection '{collection_name}'",
        "data": response
    }

@rag_router.post("/embeddings/")
async def get_embeddings(request: EmbeddingRequest):
    """
    Generate embeddings for a query using the model associated with a collection
    """
    response = get_embeddings_service(request.query, request.collection_name)
    return {
        "status": "success",
        "message": "Embeddings generated successfully",
        "data": response
    }

@rag_router.post("/retrieve-answer/")
async def retrieve_rag_answer(request: RetrieveAnswerRequest):
    """
    Retrieve an answer using RAG system by combining the query with relevant context
    """
    response = retrieve_answer_service(
        query=request.query,
        model_family=request.model_family,
        model_name=request.model_name,
        prompt=request.prompt,
        collection_name=request.collection_name,
        history_data=request.history_data
    )
    return {
        "status": "success",
        "message": "Answer retrieved successfully",
        "data": response
    }

@flashcard_router.post("/analyze/")
async def analyze_flashcards(request: AnalyzeFlashcardsRequest):
    """
    Analyze flashcards to identify difficult ones
    """
    # Convert Pydantic models to dictionaries
    cards_data = [card.dict() for card in request.cards]
    
    # Call the service to analyze difficult cards
    difficult_cards = analyze_card_difficulty(cards_data)
    
    return {
        "status": "success",
        "message": f"Analyzed {len(request.cards)} flashcards, found {len(difficult_cards)} difficult cards",
        "data": {
            "difficult_cards": difficult_cards
        }
    }

@flashcard_router.post("/generate/")
async def generate_flashcards(request: GenerateFlashcardsRequest):
    """
    Generate new flashcards using AI based on difficult cards
    """
    # Convert Pydantic models to dictionaries
    difficult_cards_data = [card.dict() for card in request.difficult_cards]
    
    # Call the service to generate new cards
    generated_cards = generate_related_cards(
        difficult_cards_data,
        num_to_generate=request.num_to_generate,
        difficulty_level=request.difficulty_level,
        generation_strategy=request.generation_strategy
    )
    
    return {
        "status": "success",
        "message": f"Generated {len(generated_cards)} new flashcards",
        "data": {
            "generated_cards": generated_cards
        }
    }
