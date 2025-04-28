# Mocked Code Snippets in the Codebase

This document identifies and describes mocked code implementations found throughout the codebase. These are temporary or placeholder implementations that need to be replaced with actual functionality.

## AI Related Mocks

### 1. Mock Mistral AI Client

**File**: `/src/server/api/routers/ai.ts`

The codebase includes a complete mock implementation of the Mistral AI client that returns fake model data rather than making actual API calls.

```typescript
// A simplified mock implementation of the Mistral client
class MockMistralClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // In a real implementation this would call the Mistral API
  async listModels(): Promise<ListModelsResponse> {
    // For now, return mock data
    return {
      object: "list",
      data: [
        {
          id: "mistral-tiny",
          object: "model",
          created: Date.now(),
          contextLength: 32000,
        },
        {
          id: "mistral-small",
          object: "model",
          created: Date.now(),
          contextLength: 32000,
        },
        {
          id: "mistral-medium",
          object: "model",
          created: Date.now(),
          contextLength: 32000,
        },
      ],
    };
  }
}
```

The router creates and uses this mock client:

```typescript
const mistral = new MockMistralClient(mistralApiKey);
const models = await mistral.listModels();
```

### 2. Mock Gemini Models Data

**File**: `/src/server/api/routers/ai.ts`

Instead of making an actual API call to Google's Generative AI API, the code returns hardcoded model data:

```typescript
// In a real implementation, this would fetch from the Gemini API
return [
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    contextLength: 32000,
    provider: "gemini",
  },
  {
    id: "gemini-pro-vision",
    name: "Gemini Pro Vision",
    contextLength: 16000,
    provider: "gemini",
  },
  {
    id: "gemini-ultra",
    name: "Gemini Ultra",
    contextLength: 32000,
    provider: "gemini",
  },
];
```

### 3. Mock OpenRouter Models Data

**File**: `/src/server/api/routers/ai.ts`

Similar to Gemini, the OpenRouter models are hardcoded instead of fetched from the API:

```typescript
// In a real implementation, this would fetch from the OpenRouter API
return [
  {
    id: "openai/gpt-4",
    name: "OpenAI GPT-4",
    contextLength: 8000,
    provider: "openrouter",
  },
  {
    id: "anthropic/claude-3-opus",
    name: "Anthropic Claude 3 Opus",
    contextLength: 100000,
    provider: "openrouter",
  },
  {
    id: "meta-llama/llama-3-70b",
    name: "Meta Llama 3 70B",
    contextLength: 8000,
    provider: "openrouter",
  },
  {
    id: "google/gemini-pro",
    name: "Google Gemini Pro",
    contextLength: 32000,
    provider: "openrouter",
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    contextLength: 32000,
    provider: "openrouter",
  },
];
```

## Chat Related Mocks

### 1. Mock Chat Session Fallback

**File**: `/src/server/api/routers/chat.ts`

If the database fails when creating a new chat session, the code falls back to creating a mock session:

```typescript
// Fallback: Create a mock session
console.log("[chat.createSession] - Creating mock session");
const sessionId = uuidv4();
console.log(
  `[chat.createSession] - Generated session ID: ${sessionId}`,
);

// Calculate position for mock sessions too
let position = 0;
if (input.position === undefined) {
  // For mock data, just use a timestamp-based position to ensure uniqueness
  position = Date.now();
} else {
  position = input.position;
}

// Create a mock session object with the updated structure
const mockSession = {
  id: sessionId,
  user_id: userId,
  title: title,
  position: position,
  is_pinned: input.is_pinned || false,
  status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

console.log(
  `[chat.createSession] - Successfully created mock session: ${mockSession.id}`,
);

// Wait a moment to simulate a database operation
await new Promise((resolve) => setTimeout(resolve, 500));

return mockSession;
```

### 2. Emergency Fallback UI

**File**: `/app/chat/emergency-fallback.tsx`

The application includes a complete emergency fallback UI that's used when the main chat functionality fails. It contains mock chat sessions:

```typescript
const [sessions, setSessions] = useState([
  {
    id: "fallback-1",
    title: "Fallback Chat 1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_pinned: false,
  },
  {
    id: "fallback-2",
    title: "Fallback Chat 2",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    is_pinned: true,
  },
]);
```

## Multiplayer Related Mocks

### 1. Default Game Values

**File**: `/app/api/multiplayer/[id]/route.ts`

The API returns default values for some game settings that could be configurable:

```typescript
// Format the lobby data
const lobbyData = {
  id: lobby.id,
  code: lobby.code,
  hostUserId: lobby.hostUserId,
  status: lobby.status,
  title: lobby.flashcardDeck?.name || "Multiplayer Session",
  topic: lobby.flashcardDeck?.description || "First Aid",
  difficulty: "Intermediate", // Hardcoded default
  questions: 10, // Default value, could be based on deck
  timePerQuestion: 30, // Default value, could be configurable
  players: formattedPlayers,
};
```

### 2. Default Avatar URLs

**File**: `/app/api/multiplayer/[id]/route.ts`

All players receive the same default avatar:

```typescript
// Format player data to include current user
const formattedPlayers = lobby.players.map((player) => ({
  id: player.id,
  userId: player.userId,
  nickname: player.nickname,
  score: player.score,
  isHost: player.userId === lobby.hostUserId,
  isReady: player.status === "ready",
  isCurrentUser: player.userId === session.user.id,
  status: player.status,
  avatar: "/avatar.svg?height=40&width=40", // Default avatar for now
}));
```

### 3. Lobby UI with Mock Data

**File**: `/app/multiplayer/lobby/[id]/page.tsx`

The lobby UI is fully implemented but uses client-side mock data rather than actual backend connections:

```typescript
// Format the lobby data
const lobbyData = {
  id: lobby.id,
  code: lobby.code,
  hostUserId: lobby.hostUserId,
  status: lobby.status,
  title: lobby.flashcardDeck?.name || "Multiplayer Session",
  topic: lobby.flashcardDeck?.description || "First Aid",
  difficulty: "Intermediate", // Hardcoded default
  questions: 10, // Default value, could be based on deck
  timePerQuestion: 30, // Default value, could be configurable
  players: formattedPlayers,
};
```

### 4. Simulated Voice Chat

**File**: `/app/multiplayer/components/voice-chat-controls.tsx`

The VoiceChatControls component includes simulated functionality that doesn't connect to any actual voice chat backend:

```typescript
// Simulate connection status
useEffect(() => {
  const timer = setTimeout(() => {
    setConnectionStatus("connected");
  }, 2000);

  return () => clearTimeout(timer);
}, []);

// Simulate speaking detection
useEffect(() => {
  if (!micEnabled) return;

  const speakingInterval = setInterval(() => {
    if (Math.random() > 0.7) {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), Math.random() * 2000 + 500);
    }
  }, 3000);

  return () => clearInterval(speakingInterval);
}, [micEnabled]);
```

## Dashboard Related Mocks

### 1. Static Training Recommendations

**File**: `/src/server/api/routers/dashboard.ts`

The training recommendations are hardcoded static data rather than personalized suggestions:

```typescript
// Get training recommendations
getTrainingRecommendations: protectedProcedure.query(async () => {
  // These are static for now, but could be made dynamic based on user data
  const recommendations: Recommendation[] = [
    {
      title: "First Aid Basics",
      description: "Review fundamental first aid techniques for common emergencies",
      icon: "heart",
    },
    {
      title: "CPR Refresher",
      description: "Update your CPR knowledge with the latest guidelines",
      icon: "activity",
    },
    {
      title: "Injury Assessment",
      description: "Learn how to quickly and accurately assess injuries",
      icon: "stethoscope",
    },
    {
      title: "Emergency Response",
      description: "Practice responding to different emergency scenarios",
      icon: "shield",
    },
    {
      title: "Disaster Preparedness",
      description: "Be ready for major incidents with this preparedness training",
      icon: "alert-triangle",
    },
    {
      title: "Mental Health First Aid",
      description: "Learn to recognize and respond to mental health emergencies",
      icon: "brain",
    },
  ];

  return recommendations;
}),
```

### 2. Dashboard Data API Layer

**File**: `/src/server/api/routers/dashboard.ts`

While the dashboard router implements proper database queries, it lacks the interactive elements needed to make recommendations dynamic. The router's endpoints could be enhanced to use user data for personalized recommendations.

## API Endpoint Mocks

### 1. Model API Endpoint

**File**: `/app/api/models/route.ts`

While this file defines API endpoints for different AI model providers, the actual connections to these services aren't implemented. Instead, it just defines the endpoint URLs and headers:

```typescript
const PROVIDER_ENDPOINTS = {
  openai: "https://api.openai.com/v1/models",
  mistral: "https://api.mistral.ai/v1/models",
  anthropic: "https://api.anthropic.com/v1/models",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  openrouter: "https://openrouter.ai/api/v1/models",
};
```

## Summary of Mocked Implementations

1. **AI Integration**:
   - All model listing APIs (Mistral, Gemini, OpenRouter) use mock data
   - Anthropic and OpenAI models throw "not implemented" errors
   - Models API endpoint structure exists but lacks actual implementation

2. **Chat System**:
   - Fallback mock session creation when database operations fail
   - Emergency fallback UI with mock sessions when the main UI fails

3. **Multiplayer System**:
   - Default game parameters (difficulty, questions, time)
   - Default avatars for all players
   - UI components using mock data
   - Simulated voice chat with fake speaking detection and connection status

4. **Dashboard Features**:
   - Static training recommendations instead of personalized content
   - Properly implemented database queries but lacking personalization logic