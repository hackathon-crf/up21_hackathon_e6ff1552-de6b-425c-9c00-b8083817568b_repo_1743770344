**Migration Plan: Python/Streamlit/FastAPI to Next.js/tRPC/Supabase/Drizzle**

This plan details the migration from the current Python-based stack (Streamlit frontend, FastAPI backend, JSON file storage) to a modern TypeScript stack using Next.js (App Router), tRPC for APIs, PostgreSQL managed by Supabase, and the Drizzle ORM. It incorporates the specific development commands, tooling, and code style guidelines provided in `CLAUDE.md`.

**Current State:**

*   **Frontend:** Streamlit (`frontend/`) - Reactive UI, `st.session_state` management, HTTP calls via `frontend/middleware.py`, local JSON persistence. Features: Chat, Flashcards (Study, Create, Manage, Stats, AI Assistant), Multiplayer, Settings.
*   **Backend:** FastAPI (`backend/`) - REST API, services for chat, flashcards (Mistral AI generation), RAG interactions (`rag_api_client`), potential basic WebSocket handling.
*   **Database:** JSON files (`flashcards.json`, `flashcard_stats.json`), in-memory storage. **Major limitation.**
*   **AI:** Mistral AI integration.
*   **RAG:** External `rag_api_client`.
*   **Deployment:** Local script (`start.sh`).
*   **Source Code:** The complete previous Python codebase is available in the `python-codebase.txt` file for reference.

**Target State:**

*   **Framework:** Next.js (App Router) ✅ *Installed*
*   **API Layer:** tRPC (End-to-end typesafe APIs) ✅ *Installed*
*   **Database:** PostgreSQL (Managed via Supabase) ✅ *Configured*
*   **ORM/Query Builder:** Drizzle ORM (Typesafe SQL) ✅ *Installed*
*   **Backend Services (Supabase):** Managed PostgreSQL, Authentication, Realtime (WebSockets), Storage (Optional), Edge Functions (Optional).
*   **UI:** React components (e.g., using Shadcn/ui + Tailwind CSS). ✅ *Tailwind installed*
*   **State Management:** 
    * TanStack Query (for server state) ✅ *Installed via @tanstack/react-query*
    * Zustand (for client-side UI state) ✅ *Installed*
*   **Validation:** Zod (Schema validation). ✅ *Installed*
*   **Linting/Formatting:** Biome. ✅ *Installed and configured*
*   **Package Manager:** `pnpm`. ✅ *Using pnpm 10.5.2*
*   **AI:** Mistral AI (via Node.js library or direct HTTP). ⏳ *To be installed*
*   **RAG:** Implement our own RAG solution using Supabase Vector. ⏳ *To be implemented*
*   **Deployment:** On my own server ⏳ *To be configured*

---

**Development Workflow & Standards**

*This workflow will be adopted from the start of the migration.*

*   **Package Manager:** Use `pnpm` for all dependency management. ✅ *Configured*
*   **Development Server:** Start the Next.js dev server using `pnpm dev`. ✅ *Configured*
*   **Build & Production Start:** Build the application with `pnpm build` and start the production server with `pnpm start`. ✅ *Configured*
*   **Code Quality:**
    *   Use Biome for consistent formatting and linting. Run checks with `pnpm check`. Fix issues automatically with `pnpm check:write`. ✅ *Configured*
    *   Enforce strict TypeScript settings. Run type checks with `pnpm typecheck`. ✅ *Configured*
*   **Database:**
    *   Manage schema changes using Drizzle Kit. Apply changes to the database using `pnpm db:push`. ✅ *Configured*
    *   Inspect and manage the database during development using `pnpm db:studio`. ✅ *Configured*
*   **Validation:** Use Zod for all data validation (tRPC inputs/outputs, forms). ✅ *Installed*
*   **Code Style:**
    *   Follow TypeScript best practices.
    *   Use PascalCase for React components.
    *   Use camelCase for variables, functions, object keys.
    *   Organize imports (handled automatically by Biome). ✅ *Configured*
    *   Prefer `async/await` for asynchronous code.
*   **API:** Use tRPC for end-to-end type-safe API routes. ✅ *Configured*
*   **Framework:** Adhere to Next.js App Router conventions. ✅ *Configured*
*   **Error Handling:** Implement explicit error handling with proper TypeScript typing.

---

**Migration Plan Phases**

**Phase 0: Preparation & Planning**

1.  **Environment Setup:** ✅ *Completed*
    *   Set up Node.js and `pnpm`. ✅ *Completed*
    *   Create a new Next.js project (App Router) using `pnpm create next-app`. ✅ *Completed*
    *   Set up a Supabase project (enable Database, Auth, Realtime). ✅ *Completed*
    *   Configure local development environment variables in `.env.local`. ✅ *Completed*
    *   Install and configure Biome according to project standards. ✅ *Completed*
    *   Install Zod. ✅ *Completed*
2.  **Detailed Analysis:** ✅ *Completed*
    *   **FastAPI Endpoints:** ✅ *Analyzed*
        * **Main Routers/Prefixes:** 
            * `/api/app` - Basic app functionality
            * `/api/chat` - Chat and message processing
            * `/api/rag` - Retrieval-Augmented Generation
            * `/api/flashcards` - Flashcard management
        * **Specific Endpoints:** 
            * `/api/chat/message/` (POST) - Process messages with optional RAG
            * `/api/chat/history/save/` (POST) - Save chat history
            * `/api/chat/feedback/` (POST) - Submit ratings and comments
            * `/api/chat/preferences/` (POST) - Update user settings
            * `/api/rag/collections/create/` (POST) - Create RAG collections
            * `/api/rag/documents/add/` (POST) - Upload documents to RAG
            * `/api/rag/embeddings/` (POST) - Generate embeddings
            * `/api/rag/retrieve-answer/` (POST) - Get RAG-enhanced answers
            * `/api/flashcards/analyze/` (POST) - Find difficult cards
            * `/api/flashcards/generate/` (POST) - Generate AI flashcards
        * **Request/Response Models:** 
            * `MessageRequest` - Contains `message: str` and optional `rag_config: RAGConfig`
            * `ChatHistoryEntry` - Has `role: str`, `content: str`, `timestamp: Optional[str]`
            * `FeedbackRequest` - Contains `message_id: str`, `rating: int`, `comments: Optional[str]`
            * `UserPreferences` - Dict structures for prompt, model, context, rag settings
            * `FlashcardData` - Complete card model (details below in Schema section)
            * `AnalyzeFlashcardsRequest` - Contains `cards: List[FlashcardData]` 
            * `GenerateFlashcardsRequest` - Has difficult cards and generation parameters
            * `RAGConfig` - Contains `enabled: bool`, `collections: List[str]`, `top_k: int`
        * **Error Handling:** Basic try/except patterns with logging and fallback responses
        * **Authentication:** Not implemented in the Python version
    *   **Streamlit UI Components:** ✅ *Analyzed*
        * **Overall Structure:** Tabbed interface with sidebar navigation
        * **Main Components:** 
            * **Chat Interface:** Message history display, input field, send button, settings panel
            * **Flashcard Study:** Card display with question/answer toggle, rating buttons (1-4 scale)
            * **Flashcard Creation:** Form with question, answer, optional title, image URL, tags
            * **Flashcard Management:** List view with filters, sorting, edit/delete functions
            * **Flashcard Stats:** Study progress, streak tracking, performance metrics
            * **AI Assistant:** Difficulty analysis, customizable generation with strategy options
            * **Settings:** Application configuration with tabs for different setting categories
        * **State Management:** 
            * `st.session_state.flashcards` - List of all user's flashcards
            * `st.session_state.flashcard_stats` - Study statistics and metrics
            * `st.session_state.current_flashcard` - Currently active card in study mode
            * `st.session_state.show_answer` - Boolean toggle for answer visibility
            * `st.session_state.editing_card` - Card being edited in management view
            * `st.session_state.flashcard_settings` - SRS algorithm configuration
            * `st.session_state.reset_flashcard_form` - Flag to reset creation form
        * **Data Flow:** HTTP requests via middleware to FastAPI backend, responses update session state
        * **Component Callbacks:** Functions tied to UI elements for state updates
    *   **SM-2 Algorithm Logic:** ✅ *Analyzed*
        * **Core Parameters:**
            * Initial ease factor: 2.5 (configurable)
            * Initial interval: 1 day (configurable) 
            * Repetition counter: Increments on successful reviews, resets on "Again"
            * Rating scale: 1-4 (Again, Hard, Good, Easy)
        * **Algorithm Implementation:**
            * Rating 1 ("Again"): Reset repetitions to 0, set interval to initial (typically 1 day)
            * Rating 2 ("Hard"): Reduce ease factor by 0.15, calculate next interval with reduced ease
            * Rating 3 ("Good"): Keep ease factor, calculate standard interval progression
            * Rating 4 ("Easy"): Increase ease factor by 0.15, calculate interval with bonus
        * **Interval Calculation:** 
            * First successful review: Returns fixed interval (typically 1 day)
            * Second successful review: Returns fixed interval (typically 6 days)
            * Subsequent reviews: Interval = current_interval * ease_factor
        * **Ease Factor Update:**
            * Adjusts based on performance: -0.15 for "Hard", +0.15 for "Easy"
            * Bounded to prevent extreme values (typically 1.3 minimum to 2.5+ maximum)
        * **Next Review Date:** Current date + calculated interval in days
    *   **AI Prompt Creation & Response Parsing:** ✅ *Analyzed*
        * **`create_generation_prompt` Function:**
            * **Input Parameters:** 
                * `cards_content: List[Dict[str, Any]]` - Difficult cards to base generation on
                * `strategy: str` - "related", "breakdown", or "alternative"
                * `difficulty: str` - "easy", "medium", or "hard"
                * `num_cards: int` - Number of cards to generate
            * **Strategy Definitions:**
                * "related" - Create cards on related topics to reinforce knowledge
                * "breakdown" - Break difficult concepts into simpler, digestible cards
                * "alternative" - Present same information in different ways for better recall
            * **Difficulty Levels:**
                * "easy" - Simpler cards for foundational knowledge
                * "medium" - Moderately challenging cards that extend concepts
                * "hard" - Advanced cards that deepen understanding
            * **Prompt Structure:** System role as educator, difficult card details, formatting instructions with explicit markers
            * **Output Format:** Structured text with card boundaries and field labels
        * **`parse_ai_response` Function:**
            * **Input:** Raw text response from AI
            * **Processing Steps:**
                1. Strip API prefixes if present
                2. Identify card blocks between markers
                3. Extract question and answer fields
                4. Create card objects with metadata (UUID, timestamps)
            * **Output:** List of complete flashcard dictionaries ready for storage
        * **Error Handling:**
            * Fallback card generation with templates if AI fails
            * Logging of all generation attempts and failures
            * Timeout handling
    *   **RAG API Client:** ✅ *Analyzed*
        * **External Import:** `from rag_api_client import get_document_chunks, retrieve_answer, list_collections`
        * **Function Interfaces:**
            * `get_document_chunks(collection_name: str, document_path: str, limit: int)` - Retrieves text chunks
            * `retrieve_answer(query: str, model_family: str, model_name: str, prompt: str, collection_name: str, history_data: str)` - Gets answers with context
            * `list_collections()` - Returns available collections
        * **Integration Points:**
            * Used in chat service to enhance responses with contextual information
            * Exposed through FastAPI endpoints for direct queries and collection management
            * Provides file upload and processing capabilities
        * **Limitations:**
            * External black-box dependency
            * Unknown implementation details
            * Potential compatibility issues with Node.js
        * **Decision Rationale:**
            * Rebuilding with Supabase Vector provides native integration with new stack
            * pgvector extension offers superior performance and scaling
            * Direct DB access simplifies architecture and reduces dependencies
    *   **Database Structure:** ✅ *Analyzed*
        * **Storage Mechanism:**
            * JSON files for persistence across Streamlit sessions:
                * `flashcards.json` - Main flashcard data
                * `flashcard_stats.json` - Study statistics and streak data
                * `flashcard_settings.json` - Algorithm configuration
            * File loading on application start:
                ```python
                cards_file = Path("flashcards.json")
                if cards_file.exists():
                    with open(cards_file, "r") as f:
                        st.session_state.flashcards = json.load(f)
                ```
            * Save operations triggered on data changes:
                ```python
                with open(cards_file, "w") as f:
                    json.dump(st.session_state.flashcards, f, indent=2)
                ```
        * **In-Memory Structures:**
            * Streamlit session state as transient database
            * All operations performed on in-memory objects before persistence
            * Session state cleared on browser refresh (requires reloading files)
        * **Data Access Patterns:**
            * Full load on startup, full save on changes
            * No partial/incremental updates
            * No query language or indexing
            * Linear search for filtering/sorting
        * **Critical Limitations:**
            * No concurrent user support
            * No data validation beyond application logic
            * No referential integrity
            * No backup or transaction support
            * No user-specific data separation
    *   **Flashcard Schema:** ✅ *Analyzed*
        * **Complete JSON Schema:**
            ```json
            {
                "id": "uuid-string",
                "title": "Optional card title",
                "question": "The question text",
                "answer": "The answer text",
                "image_url": "Optional URL to image",
                "created_at": "2023-01-01T12:00:00",
                "tags": ["tag1", "tag2"],
                "repetitions": 0,
                "ease_factor": 2.5,
                "interval": 1,
                "next_review": "2023-01-02T12:00:00",
                "last_review": "2023-01-01T12:00:00",
                "ai_generated": false
            }
            ```
        * **Required Fields:** `id`, `question`, `answer`
        * **Optional Fields:** `title`, `image_url`, `tags`, SRS data
        * **SRS Algorithm Fields:**
            * `repetitions` - Number of successful reviews (integer)
            * `ease_factor` - Difficulty multiplier (float, default 2.5)
            * `interval` - Days until next review (integer)
            * `next_review` - ISO date string for scheduled review
            * `last_review` - ISO date string for previous review
        * **Metadata:**
            * `tags` - Array of string tags for categorization
            * `created_at` - ISO date string for creation timestamp
            * `ai_generated` - Boolean flag for AI-created cards
        * **Stats Schema (Separate File):**
            ```json
            {
                "studied_today": 0,
                "total_studied": 0,
                "correct_today": 0,
                "total_correct": 0,
                "streak": 0,
                "last_study_date": "2023-01-01T12:00:00"
            }
            ```
    *   **Mistral AI Integration:** ✅ *Analyzed*
        * **Initialization:**
            ```python
            from mistralai import Mistral
            api_key = os.environ.get("MISTRAL_API_KEY")
            mistral_client = Mistral(api_key=api_key)
            ```
        * **Model Selection:** Uses `mistral-tiny` for development/testing
        * **API Usage Pattern:**
            ```python
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
            stream_response = mistral_client.chat.stream(
                model="mistral-tiny",
                messages=messages
            )
            # Process streaming response
            response_content = ""
            for chunk in stream_response:
                if chunk.data.choices[0].delta.content is not None:
                    response_content += chunk.data.choices[0].delta.content
            ```
        * **Error Handling:** Fallback to rule-based responses if API unavailable
        * **Custom Prompting:** Structured prompts for flashcard generation
        * **Usage Metrics:** Tracking of token usage and latency
    *   **Multiplayer:** ✅ *Analyzed*
        * **Finding:** No multiplayer implementation found in current codebase
        * **No WebSocket Endpoints:** No `@app.websocket` routes in FastAPI code
        * **No Game State Management:** No lobby, player, or round management code
        * **No Real-time Communication:** No client-side WebSocket listeners
        * **Conclusion:** Multiplayer is a planned feature for the new stack rather than a migration requirement
        * **Implementation Plan:** Will use Supabase Realtime for WebSocket communication in the TypeScript version
3.  **Database Schema Design:** ✅ *Completed*
    *   **Core Tables & Columns:**
        * `user`:
          - `id` - varchar(36), PK, from Supabase Auth
          - `email` - varchar(256), unique, notNull
          - `createdAt` - timestamp with timezone
          - `updatedAt` - timestamp with timezone
        * `user_preference`:
          - `userId` - varchar(36), PK, FK to user.id
          - `prompt` - jsonb, stores prompt settings
          - `model` - jsonb, stores model settings
          - `context` - jsonb, stores context settings
          - `rag` - jsonb, stores RAG settings
          - `other` - jsonb, stores misc settings
          - `updatedAt` - timestamp with timezone
        * `flashcard`:
          - `id` - uuid, PK, auto-generated
          - `userId` - varchar(36), FK to user.id
          - `question` - text, notNull
          - `answer` - text, notNull
          - `title` - varchar(256), optional
          - `imageUrl` - varchar(2048), optional
          - `createdAt` - timestamp with timezone
          - `tags` - jsonb, array of string tags
          - `repetitions` - integer, default 0
          - `easeFactor` - real, default 2.5
          - `interval` - integer, default 1
          - `nextReview` - timestamp with timezone
          - `lastReview` - timestamp with timezone
          - `aiGenerated` - boolean, default false
        * `study_stat`:
          - `id` - serial, PK, auto-increment
          - `userId` - varchar(36), FK to user.id
          - `studiedToday` - integer, default 0
          - `totalStudied` - integer, default 0
          - `correctToday` - integer, default 0
          - `totalCorrect` - integer, default 0
          - `streak` - integer, default 0
          - `lastStudyDate` - timestamp with timezone
          - `updatedAt` - timestamp with timezone
        * `chat_session`:
          - `id` - uuid, PK, auto-generated
          - `userId` - varchar(36), FK to user.id
          - `title` - varchar(256), default "New Chat"
          - `createdAt` - timestamp with timezone
          - `updatedAt` - timestamp with timezone
        * `chat_message`:
          - `id` - uuid, PK, auto-generated
          - `sessionId` - uuid, FK to chat_session.id
          - `role` - varchar(20), notNull ('user'|'assistant'|'system')
          - `content` - text, notNull
          - `timestamp` - timestamp with timezone
          - `metrics` - jsonb, stores performance metrics
        * `feedback`:
          - `id` - serial, PK, auto-increment
          - `messageId` - uuid, FK to chat_message.id
          - `rating` - integer, notNull
          - `comments` - text, optional
          - `createdAt` - timestamp with timezone
        * `rag_collection`:
          - `id` - serial, PK, auto-increment
          - `name` - varchar(100), unique, notNull
          - `description` - text, optional
          - `createdAt` - timestamp with timezone
          - `updatedAt` - timestamp with timezone
        * `rag_document`:
          - `id` - serial, PK, auto-increment
          - `collectionId` - integer, FK to rag_collection.id
          - `content` - text, notNull
          - `metadata` - jsonb, document metadata
          - `createdAt` - timestamp with timezone
          - (Placeholder for vector embedding field)
        * `game_lobby`:
          - `id` - serial, PK, auto-increment
          - `code` - varchar(8), unique, notNull
          - `hostUserId` - varchar(36), FK to user.id
          - `status` - varchar(20), default "waiting"
          - `flashcardSetId` - uuid, optional
          - `createdAt` - timestamp with timezone
          - `updatedAt` - timestamp with timezone
        * `game_player`:
          - `id` - serial, PK, auto-increment
          - `lobbyId` - integer, FK to game_lobby.id
          - `userId` - varchar(36), FK to user.id
          - `nickname` - varchar(50), notNull
          - `score` - integer, default 0
          - `status` - varchar(20), default "joined"
          - `joinedAt` - timestamp with timezone
        * `game_round`:
          - `id` - serial, PK, auto-increment
          - `lobbyId` - integer, FK to game_lobby.id
          - `questionId` - uuid, FK to flashcard.id
          - `roundNumber` - integer, notNull
          - `startTime` - timestamp with timezone
          - `endTime` - timestamp with timezone
          - `status` - varchar(20), default "active"
        * `game_answer`:
          - `id` - serial, PK, auto-increment
          - `roundId` - integer, FK to game_round.id
          - `playerId` - integer, FK to game_player.id
          - `answerText` - text, notNull
          - `timeTaken` - integer, notNull (in milliseconds)
          - `isCorrect` - boolean, default false
          - `pointsAwarded` - integer, default 0
          - `submittedAt` - timestamp with timezone
    *   **Relationships & Constraints:**
        * One-to-many relationships with proper foreign keys
        * Cascading deletes to maintain referential integrity
        * Unique constraints on critical fields (email, game codes)
        * Compound unique constraints (lobbyId+userId, lobbyId+roundNumber, roundId+playerId)
        * Indexing on frequently queried fields and foreign keys
    *   **Data Types Selected:**
        * `uuid` for primary keys with high uniqueness requirements
        * `serial` for auto-incrementing IDs
        * `varchar` with appropriate lengths for shorter text
        * `text` for unbounded text content
        * `timestamp with timezone` for all date/time fields
        * `integer` for counters and scores
        * `real` for decimal values (ease factors)
        * `boolean` for flags
        * `jsonb` for flexible structured data (tags, metrics)
        * Placeholder for `vector` type when pgvector extension is enabled
    *   **Schema Implementation:** 
        * Implemented in `src/server/db/schema.ts` using Drizzle ORM
        * Proper TypeScript typing for all schema elements
        * Relations defined for type-safe joins and queries
        * Table definitions applied to Supabase PostgreSQL
4.  **Tooling Setup:** ✅ *Completed*
    *   Integrate tRPC into the Next.js project. ✅ *Completed*
    *   Integrate Drizzle ORM and Drizzle Kit, configure connection to Supabase DB. ✅ *Completed*
    *   Set up a UI component library (e.g., Shadcn/ui + Tailwind CSS). ✅ *Tailwind and ShadcnUI installed*
    *   Set up a state management library (e.g., Zustand). ✅ *Installed*
    *   Configure Biome via `biome.json`. ✅ *Completed*
    *   Define `pnpm` scripts in `package.json`: `dev`, `build`, `start`, `typecheck`, `check`, `check:write`, `db:push`, `db:studio`. ✅ *Completed*
5.  **Code Style Enforcement:** Run `pnpm check:write` on the initial project setup to establish baseline formatting. ✅ *Completed*

**Phase 1: Core Backend & Data Foundation**

1.  **Implement Database Schema:** ✅ *Completed*
    *   Drizzle schema definitions written in `src/server/db/schema.ts` based on the design ✅ *Done*
    *   Schema applied to Supabase PostgreSQL using `pnpm db:push` ✅ *Done*
    *   Tables created with appropriate data types, constraints, and relationships ✅ *Done*
    *   Indexes added for performance optimization ✅ *Done*
2.  **Authentication Setup:** ✅ *Completed*
    *   Integrated Supabase Auth using `@supabase/ssr` and `@supabase/supabase-js` ✅ *Done*
    *   Implemented sign-up, login, logout flows with client components ✅ *Done*
    *   Added email and password validation with error handling ✅ *Done*
    *   Created middleware for route protection ✅ *Done*
    *   Built AuthProvider context for client-side auth state ✅ *Done*
    *   Added account synchronization between Auth and database ✅ *Done*
3.  **Basic tRPC Setup:** ✅ *Completed*
    *   Updated tRPC context to include authentication (`src/server/api/trpc.ts`) ✅ *Done*
    *   Added auth middleware and protectedProcedure ✅ *Done*
    *   Created user router (`src/server/api/routers/user.ts`) ✅ *Done*
    *   Implemented procedures for profile access and user synchronization ✅ *Done*
    *   Connected tRPC to the dashboard page for testing ✅ *Done*

**Phase 2: Port Backend Features to tRPC**

*   *(Standard for all procedures: Implement within tRPC routers (`src/server/api/routers/`). Use Drizzle for database operations. Use Zod for input validation (`.input(zodSchema)`). Adhere to async/await and camelCase naming. Ensure procedures requiring auth are protected.)*

1.  **Flashcard CRUD (`flashcards.ts` router):**
    *   `createFlashcard`: Input Zod schema (question, answer, title?, image\_url?), insert into `flashcards` table associated with `ctx.session.user.id`.
    *   `getFlashcards`: Input Zod schema (optional filters/sorting), query user's flashcards.
    *   `updateFlashcard`: Input Zod schema (cardId, fields to update), update specific card owned by the user.
    *   `deleteFlashcard`: Input Zod schema (cardId), delete specific card owned by the user.
2.  **Flashcard Study Logic (`flashcards.ts` router):**
    *   Port SM-2 algorithm logic to TypeScript functions (e.g., `src/lib/srs.ts`).
    *   `getDueCards`: Query user's flashcards where `next_review <= NOW()` or `next_review IS NULL`, limit based on user settings (fetch from `users` or `user_preferences` table).
    *   `getNewCards`: Query user's flashcards where `next_review IS NULL`, limit based on user settings.
    *   `recordStudyResult`: Input Zod schema (cardId, ease: 1|2|3|4). Fetch card, calculate new interval/ease\_factor/repetitions/next\_review using SRS logic, update the card record in DB.
    *   `getStudyStats`: Query `study_stats` table for the user.
    *   `updateStudyStats`: Update `study_stats` after a study session (called by `recordStudyResult` or aggregated). Handle daily resets.
3.  **AI Flashcard Generation (`ai.ts` or `flashcards.ts` router):**
    *   `analyzeDifficulty`: Input Zod schema (list of card IDs or reuse `getFlashcards` results). Replicate Python logic using DB data (low ease\_factor, high repetitions).
    *   `generateAiFlashcards`: Input Zod schema (list of difficult card objects, num\_to\_generate, difficulty\_level, generation\_strategy).
        *   Use `mistralai` Node.js package: `const mistral = new MistralClient(process.env.MISTRAL_API_KEY);`.
        *   Replicate prompt creation logic (`create_generation_prompt`) in TypeScript.
        *   Call `mistral.chatStream(...)` or `mistral.chat(...)`.
        *   Replicate response parsing logic (`parse_ai_response`) in TypeScript.
        *   Insert generated cards into `flashcards` table with `ai_generated = true` flag and user association.
4.  **Chat Service (`chat.ts` router):**
    *   `sendMessage`: Input Zod schema (message content, optional sessionId, ragConfig).
        *   Create/fetch `chat_session`. Fetch recent `chat_messages` for history based on context settings.
        *   (RAG Integration) If RAG enabled, call RAG retrieval procedure/service.
        *   Construct prompt (system prompt + history + RAG context + user message).
        *   Call Mistral API.
        *   Save user message and AI response to `chat_messages` table (including metrics in JSONB). Return AI response.
    *   `getChatHistory`: Input Zod schema (sessionId). Fetch messages for the session.
    *   `saveChatHistory`: (Potentially redundant if messages saved individually, or used for batch save/export).
    *   `submitFeedback`: Input Zod schema (messageId, rating, comments?). Save to `feedback` table.
    *   `updatePreferences`: Input Zod schema (matching settings structure). Save preferences associated with the user (e.g., in `users` table JSONB or separate `user_preferences` table).
5.  **RAG Integration:**
    *   **We will rebuild/replace RAG with Supabase Vector:**
        *   Enable `pgvector` extension in Supabase. Add `vector` column to `rag_documents` schema.
        *   Implement `createCollection` procedure (inserts into `rag_collections`).
        *   Implement `addDocument` procedure:
            *   Accept file upload (e.g., via Next.js API route or Supabase Storage trigger).
            *   Chunk document text (using Node.js libraries like `langchain/text_splitter`).
            *   Generate embeddings for chunks (call Mistral embedding API via `mistralai` client).
            *   Insert document metadata and embeddings into `rag_documents`.
        *   Implement `retrieveContext` procedure:
            *   Generate embedding for user query.
            *   Query `rag_documents` using vector similarity search (`<=>` operator in Drizzle/SQL) within selected collections. Return top K chunks.
        *   Modify `sendMessage` procedure to call `retrieveContext`.
        *   Implement `getEmbeddings`, `retrieveAnswer` (combines retrieval + LLM call) if needed separately.

**Important Tailwind CSS v4.0 Information:**

**IMPORTANT: THERE ARE NO TAILWIND CONFIGURATION FILES ANYMORE (NO tailwind.config.js). TAILWIND IS NOW CSS-FIRST.**

* **CSS Import:**
  ```css
  /* In your main CSS file (e.g., globals.css) */
  @import "tailwindcss";
  
  /* You can add your custom CSS and configuration here: */
  @layer base {
    :root {
      /* Define CSS variables for your design tokens */
      --color-primary: #3b82f6;
      --color-secondary: #10b981;
    }
  }
  
  /* Customize Tailwind via CSS */
  @layer components {
    .btn-primary {
      @apply px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90;
    }
  }
  ```

* **CSS-First Configuration:** All customizations should be directly in the CSS file where you import Tailwind, not in a separate config file.
  * Color schemes using CSS variables: `--color-primary`, `--color-secondary`, etc.
  * Custom breakpoints via `@media (min-width: 1280px) { /* styles */ }`
  * Custom components via `@layer components { .custom-component { /* styles */ } }`
  * Extend Tailwind's utilities via `@layer utilities { .custom-utility { /* styles */ } }`

* **Style Guidelines:**
  * Use Tailwind utility classes for all styling needs
  * **AVOID INLINE STYLES UNLESS ABSOLUTELY MANDATORY**
  * Group related utility classes logically
  * Extract repeated patterns into components using `@layer components`
  * Use meaningful class names for custom components
  * Leverage CSS variables for design tokens
  * Use arbitrary value syntax for custom values: `w-[32rem]`, `text-[#336699]`, etc.
  * Prefer semantic utility composition over custom CSS when possible

**Phase 3: Frontend Foundation**

1.  **Basic Layout & Navigation:**
    *   Set up `app/layout.tsx` with providers (tRPC, State Management, Supabase Auth).
    *   Implement a persistent sidebar or tabbed navigation component (`src/components/layout/`). Use Next.js `Link` or `useRouter`.
    *   Integrate chosen UI library (e.g., setup Tailwind, Shadcn/ui components).
2.  **Authentication UI:**
    *   Build Login (`app/login/page.tsx`), Sign Up (`app/signup/page.tsx`) pages/components.
    *   Use Supabase Auth UI library or create custom forms using React Hook Form + Zod resolver.
    *   Implement server actions or client-side logic to call Supabase Auth functions (`signInWithPassword`, `signUp`).
    *   Handle loading states and error messages. Implement redirects based on auth state using middleware or layout checks.
3.  **State Management Setup:**
    *   Integrate Zustand. Create initial stores (`src/stores/`) for user authentication state, global settings/preferences.
4.  **tRPC Client Setup:**
    *   Configure tRPC client provider (`src/trpc/react.tsx`) following official tRPC + Next.js App Router guides.

**Phase 4: Port Frontend Features**

*   *(Standard for all components: Create components in `src/components/`. Use PascalCase. Use tRPC hooks (`api.router.procedure.useQuery`, `api.router.procedure.useMutation`) for data fetching/mutation. Use state management library (Zustand) for shared/complex UI state. Apply UI library styles. Use Zod for any client-side form validation.)*

1.  **Settings UI (`app/settings/page.tsx`):**
    *   Rebuild settings tabs structure.
    *   Use `api.user.getPreferences.useQuery` (or similar) to fetch settings.
    *   Create forms/inputs for each setting. Use controlled components or React Hook Form.
    *   Use `api.user.updatePreferences.useMutation` to save changes on button click. Handle loading/success/error states.
    *   Implement RAG collection management UI (fetching available collections, creating new ones via tRPC).
2.  **Flashcard UI (Study - `app/study/page.tsx`):**
    *   Create `FlashcardDisplay` component.
    *   Use `api.flashcards.getNextCard.useQuery` (needs implementing in backend, combining due/new logic) to fetch card. Handle loading/empty states.
    *   Use local React state (`useState`) for `showAnswer`.
    *   Implement "Show Answer" button.
    *   Implement "Again", "Hard", "Good", "Easy" buttons. On click, call `api.flashcards.recordStudyResult.useMutation` with card ID and ease rating. Invalidate/refetch `getNextCard` query on success.
    *   Display card details (fetched with card) and study progress (fetched via separate `api.flashcards.getStudyStats.useQuery`).
3.  **Flashcard UI (Create/Manage/Stats):**
    *   **Create (`app/flashcards/create/page.tsx`):** Rebuild form. Use React Hook Form + Zod resolver for validation. Call `api.flashcards.createFlashcard.useMutation` on submit.
    *   **Manage (`app/flashcards/manage/page.tsx`):**
        *   Implement filtering/sorting controls. Pass state to `api.flashcards.getFlashcards.useQuery`.
        *   Display cards in a list/table.
        *   Implement Edit (modal/form + `api.flashcards.updateFlashcard.useMutation`).
        *   Implement Delete button (`api.flashcards.deleteFlashcard.useMutation`, refetch list on success).
    *   **Stats (`app/flashcards/stats/page.tsx`):** Rebuild stats display. Fetch data using `api.flashcards.getStudyStats.useQuery`. Add charts (e.g., using Recharts).
4.  **AI Assistant UI (`app/flashcards/ai-assistant/page.tsx`):**
    *   Rebuild UI for analyzing and generating cards.
    *   Call `api.ai.analyzeDifficulty.useQuery` (or similar).
    *   Implement UI for selecting difficult cards and generation options (strategy, difficulty, number).
    *   Call `api.ai.generateAiFlashcards.useMutation` with selected data. Handle loading state.
    *   Display generated cards. Implement "Save" button calling a dedicated `api.flashcards.saveAiGeneratedCards.useMutation` (or reuse `createFlashcard` in batch).
5.  **Chat UI (`app/chat/page.tsx`):**
    *   Create `ChatMessage` component for displaying user/assistant messages.
    *   Implement chat history display area, fetching history with `api.chat.getChatHistory.useQuery`.
    *   Implement chat input component. Use React Hook Form or simple state.
    *   On submit, call `api.chat.sendMessage.useMutation`. Append user message optimistically, display loading indicator for AI response, update with AI response on mutation success. Refetch history or append to local state.
    *   Implement feedback UI if enabled (buttons/modal calling `api.chat.submitFeedback.useMutation`).

**Phase 5: Multiplayer Implementation**

1.  **Backend (Realtime & tRPC):**
    *   Set up Supabase Realtime: Define channels (e.g., `game:<game_code>`). Enable RLS policies for security.
    *   Define DB tables (`game_lobbies`, `game_players`, `game_rounds`, `game_answers`).
    *   Implement tRPC procedures:
        *   `createGame`: Input Zod schema (hostNickname, flashcardsContent/ID). Creates lobby, player, returns code/IDs. *Does not* start Realtime listener yet.
        *   `joinGame`: Input Zod schema (gameCode, nickname). Adds player, checks lobby status. Returns player ID. Broadcasts player join via Realtime *after* successful join.
        *   `startGame`: Input Zod schema (gameCode, hostId). Validates host. Transitions lobby status. Initiates first round (sends first question via Realtime).
        *   `submitAnswer`: Input Zod schema (gameCode, playerId, answer, timeTaken). Records answer, calculates points. Broadcasts player answered event (optional).
    *   Use Supabase Realtime (client-side SDK listens, server *broadcasts*):
        *   Broadcast events like `PLAYER_JOINED`, `PLAYER_LEFT`, `GAME_STARTED`, `NEW_QUESTION`, `ROUND_ENDED`, `SHOW_SCOREBOARD`, `GAME_OVER`. Payloads contain necessary data (player lists, question details, scores).
        *   Manage game state transitions possibly using database triggers or Supabase Edge Functions triggered by time limits or all players answering, which then broadcast the next state event.
2.  **Frontend (Multiplayer UI - `app/multiplayer/...`):**
    *   **Lobby (`app/multiplayer/page.tsx`):** Build create/join forms. Call `createGame`/`joinGame` mutations. On success, navigate to waiting room.
    *   **Waiting Room (`app/multiplayer/[gameCode]/lobby/page.tsx`):**
        *   Use Supabase client JS SDK (`supabase.channel(...)`) to subscribe to the game channel (`game:<game_code>`).
        *   Listen for `PLAYER_JOINED`, `PLAYER_LEFT` events to update player list (stored in Zustand or local state).
        *   Display game code. Show "Start Game" button for host (calls `startGame` mutation). Listen for `GAME_STARTED` event to navigate to game view.
    *   **Game View (`app/multiplayer/[gameCode]/game/page.tsx`):**
        *   Listen for `NEW_QUESTION` event, update UI with question/options/timer. Reset `answered_this_round` state. Start client-side timer display.
        *   Implement answer submission UI (buttons/input calling `submitAnswer` mutation). Update UI to show "Answered" state.
        *   Listen for `ROUND_ENDED` or `SHOW_SCOREBOARD` events to navigate/transition.
    *   **Scoreboard View (Component or `app/multiplayer/[gameCode]/scoreboard/page.tsx`):**
        *   Listen for `SHOW_SCOREBOARD` event, display scores and rankings from event payload.
        *   Listen for `NEW_QUESTION` or `GAME_OVER` events for next transition.
    *   **Results View (`app/multiplayer/[gameCode]/results/page.tsx`):**
        *   Listen for `GAME_OVER` event, display final rankings and stats from payload.
        *   Provide "Play Again" / "Back to Home" buttons. Unsubscribe from channel on leaving.

**Phase 6: Testing & Refinement**

1.  **Unit Testing:** Write unit tests using Vitest for SRS logic, utility functions.
2.  **Integration Testing:** Write tests for tRPC procedures interacting with a test Supabase instance (local or separate project). Test frontend component logic interacting with mock tRPC procedures.
3.  **End-to-End Testing:** Use Playwright or Cypress to automate testing of user flows: Login -> Create Card -> Study Card -> Join Multiplayer -> Play Round -> View Results -> Logout.
4.  **Code Quality Checks:** Integrate `pnpm check` and `pnpm typecheck` into pre-commit hooks (e.g., using Husky + lint-staged) and the CI pipeline. Fail builds if checks fail.
5.  **UI/UX Review:** Conduct thorough reviews across different screen sizes. Refine component interactions, loading states, error handling based on user feedback.
6.  **Performance Optimization:** Use Next.js Bundle Analyzer. Analyze database query performance via Supabase dashboard or `EXPLAIN`. Optimize slow queries or component rendering.
7.  **Security Audit:** Review Supabase Row Level Security (RLS) policies for all tables. Ensure tRPC procedures correctly authorize actions based on `ctx.session`. Check for standard web vulnerabilities (though Next.js/React/tRPC mitigate many).
8.  **Documentation:** Update `README.md` with new stack details, setup instructions, `pnpm` commands from `CLAUDE.md`, and an overview of the architecture. Add comments to complex code sections.

**Important Next.js 15+ Implementation Notes:**

1. **Route Parameters with React.use():**
   * In Next.js 15.2.4+, route parameters are Promises that must be unwrapped with `React.use()`.
   * Warning: "A param property was accessed directly with `params.id`. `params` is now a Promise..."
   * Correct usage:
     ```tsx
     // Page component with dynamic route params
     export default function PageComponent({ params }: { params: { id: string } }) {
       const unwrappedParams = React.use(params);
       return <ChildComponent id={unwrappedParams.id} />;
     }
     ```
   * Direct access may work now but could break in future versions or cause re-render issues.
   * Use proper TypeScript typing for safe parameter handling.

**Phase 7: Deployment & Monitoring (Ongoing)**

1.  **Deployment:**
    *   Configure Vercel project, link GitHub repository.
    *   Set up production environment variables on Vercel (Supabase URL/anon key, Mistral API key, etc.).
    *   Configure Supabase project for production (e.g., enable Point-in-Time Recovery, review instance size).
    *   Ensure `pnpm build` runs successfully. Deploy via Vercel push-to-deploy.
2.  **CI/CD:** Set up GitHub Actions workflow:
    *   Trigger on pushes/PRs to `main`.
    *   Install dependencies (`pnpm install`).
    *   Run linting (`pnpm check`).
    *   Run type checking (`pnpm typecheck`).
    *   Run unit/integration tests (`pnpm test`).
    *   Build application (`pnpm build`).
    *   (Optional) Run E2E tests.
    *   Deploy to Vercel (using Vercel CLI or GitHub Action).
3.  **Monitoring & Logging:**
    *   Utilize Vercel Analytics for traffic insights and Core Web Vitals. Use Vercel Logging for function logs.
    *   Integrate Sentry or similar for frontend and backend error tracking (wrap tRPC procedures/API routes).
    *   Monitor Supabase database performance, CPU usage, query stats via Supabase dashboard. Set up alerts if needed.

**Key Considerations & Potential Risks:**

*   **Data Migration Complexity:** Ensure data integrity when moving from JSON to structured SQL. Validate thoroughly.
*   **RAG Client/Logic:** Rebuilding RAG using Supabase Vector is potentially complex but offers better integration than maintaining the external Python client. Requires careful planning.
*   **Multiplayer Complexity:** Real-time state synchronization is challenging. Design robust event handling and state management. Test latency, disconnects, race conditions.
*   **Scope Creep:** Focus on migrating existing functionality before adding new features.
*   **Testing:** Allocate sufficient time for writing comprehensive tests across all layers.
*   **Environment Variables & Secrets:** Use Supabase Vault and Vercel environment variables for secure management. Avoid committing secrets.
*   **Supabase Costs:** Monitor usage against Supabase free/pro tier limits (database size, egress, Realtime messages, Auth MAUs).
