# CR-Hackathon: Modern Chatbot with RAG & Flashcards

Welcome to the CR-Hackathon project - a modern chatbot application with Retrieval-Augmented Generation (RAG) capabilities and an integrated flashcard learning system.

## Features

- **Modern Chat Interface**: Streamlit-based UI with typing indicators and message history
- **RAG Integration**: Enhanced responses using knowledge retrieval from uploaded documents
- **Spaced Repetition Learning**: Flashcard system with SM-2 algorithm for efficient learning
- **Customizable Settings**: User preference management for model, RAG, and UI settings
- **Multi-Modal Support**: Text content with image display capabilities
- **User Feedback**: Rating system for responses

## Getting Started

### Prerequisites

- Python 3.x
- Mistral AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CR-Hackathon.git
cd CR-Hackathon
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your API key:
```
MISTRAL_API_KEY=your_mistral_api_key_here
DOMAIN_NAME=localhost
```

### Running the Application

Start the full application (both backend and frontend):
```bash
./start.sh
```

Or run components separately:

- Backend only:
```bash
python main_back.py --port 1027
```

- Frontend only:
```bash
streamlit run main_front.py
```

## Project Structure

- **Frontend** (`frontend/` directory):
  - `main.py`: Core UI implementation with chat interface
  - `middleware.py`: API clients for backend communication
  - `settings.py`: User preference management
  - `flashcards.py`: Spaced repetition learning system
  
- **Backend** (`backend/` directory):
  - `routes.py`: API endpoint definitions
  - `services.py`: Business logic implementation
  - `back_utils.py`: Utility functions

- **RAG**: 
  - `rag_api_client.py`: Client for RAG system API
  - `rag_demo.py`: Demo script for RAG operations
  - `test_rag.py`: Testing RAG functionality

## Testing

- Test RAG functionality:
```bash
python test_rag.py
```

- Test Mistral API connection:
```bash
python test_mistral_api.py
```

- RAG operations demo:
```bash
python rag_demo.py list  # List available collections
python rag_demo.py create --name "collection_name"  # Create a new collection
# See rag_demo.py for more options
```

## Development Guidelines

- Keep main backend logic in `main_back.py`
- Keep main frontend logic in `main_front.py`
- Do not modify the `start.sh` script
- Refer to `CLAUDE.md` for detailed code guidelines and style conventions

### Directory Management
- Do not rename or delete any existing directories
- Create additional directories as needed to organize your project

## ForgeAI GenAI Services

This project utilizes ForgeAI's Generative AI services, including:
- Retrieval-Augmented Generation (RAG)
- AI Chatbots
- And more...

For more information, see the [ForgeAI GenAI Services Repository](https://github.com/Forgeai-platform/forgeai-services).