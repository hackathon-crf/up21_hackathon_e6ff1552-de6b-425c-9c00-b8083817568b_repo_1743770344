# CR-Hackathon Guidelines for Claude

## Run Commands
- Install dependencies: `pip install -r requirements.txt`
- Start full application: `./start.sh`
- Run backend only: `python main_back.py --port 1027 [--root_path PATH]`
- Run frontend only: `streamlit run main_front.py`
- Test RAG functionality: `python test_rag.py`
- Test Mistral API connection: `python test_mistral_api.py`
- RAG demo operations: `python rag_demo.py [list|create|add|embed|retrieve]`

## Project Structure
- **Frontend**: Streamlit-based UI in `frontend/` directory
  - `main.py`: Core UI implementation with chat interface
  - `middleware.py`: API clients for backend communication
  - `settings.py`: User preference management
  - `flashcards.py`: Spaced repetition learning system
- **Backend**: FastAPI service in `backend/` directory
  - `routes.py`: API endpoints definition
  - `services.py`: Business logic implementation
  - `back_utils.py`: Utility functions
- **RAG**: Retrieval-Augmented Generation through `rag_api_client.py`

## Code Style Guidelines
- **Imports**: Standard lib → Third-party libs → Project modules
- **Naming**: Functions/variables: `snake_case`, Classes: `PascalCase`, Constants: `UPPER_SNAKE_CASE`
- **Types**: Use Python typing module (List, Dict, Optional, Any, etc.)
- **Docstrings**: Required for all functions with parameters and return descriptions
- **Error handling**: Use try/except blocks with specific exceptions and helpful error messages
- **API Design**: RESTful endpoints with FastAPI routers and Pydantic models
- **Frontend**: Streamlit components with session state for persistence
- **Logging**: Use dedicated loggers with appropriate levels (info, warning, error)

## Features
- **Modern Chat Interface**: Streamlit-based chat UI with typing indicators
- **RAG Integration**: Retrieval-Augmented Generation for enhanced responses
- **Spaced Repetition**: Flashcard system with SM-2 algorithm
- **Preferences**: User settings management
- **Multi-modal**: Support for text and image content
- **User Feedback**: Rating system for responses

## Environment Setup
- Python 3.x required
- Create `.env` or `.client_env` file with required API keys
- Environment variables: MISTRAL_API_KEY, DOMAIN_NAME 
- External service: Connection to RAG system API
- For local development, logs are stored in `logs/` directory