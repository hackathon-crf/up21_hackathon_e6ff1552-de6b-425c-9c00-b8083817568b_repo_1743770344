import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define the template type
export interface PromptTemplate {
  id: number;
  name: string;
  prompt: string;
}

interface SettingsState {
  // Model settings
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  
  // Prompt settings
  systemPrompt: string;  // Renamed from defaultPrompt
  promptPrefix: string;
  promptSuffix: string;
  promptTemplates: PromptTemplate[]; // Added prompt templates array
  
  // RAG settings
  ragEnabled: boolean;
  chunkSize: number;
  similarityThreshold: number;
  
  // Other settings
  streamingEnabled: boolean;
  darkMode: boolean;
  citationsEnabled: boolean;
  historyRetentionDays: number;
  
  // Cache settings
  modelsCache: Record<string, any>;
  cacheTimeToLive: number;
  verifiedAPIKeys: Record<string, any>;
  apiKeyVerificationTTL: number;
  
  // Actions
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setSystemPrompt: (prompt: string) => void;  // Renamed from setDefaultPrompt
  setPromptPrefix: (prefix: string) => void;
  setPromptSuffix: (suffix: string) => void;
  setPromptTemplates: (templates: PromptTemplate[]) => void; // Added setter for templates
  addPromptTemplate: (template: Omit<PromptTemplate, "id">) => void; // Added method to add template
  deletePromptTemplate: (id: number) => void; // Added method to delete template
  setRagEnabled: (enabled: boolean) => void;
  setChunkSize: (size: number) => void;
  setSimilarityThreshold: (threshold: number) => void;
  setStreamingEnabled: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setCitationsEnabled: (enabled: boolean) => void;
  setHistoryRetentionDays: (days: number) => void;
  setCacheTimeToLive: (ttl: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      provider: "mistral",
      model: "mistral-small",
      temperature: 0.7,
      maxTokens: 4000,
      systemPrompt: "You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately.", // Renamed from defaultPrompt
      streamingSystemPrompt: "You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately. Provide reliable information based on official Red Cross guidelines.",
      chatRouterSystemPrompt: "You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately. Provide reliable information based on official Red Cross guidelines.",
      promptPrefix: "",
      promptSuffix: "Please provide reliable information based on official Red Cross guidelines.",
      promptTemplates: [], // Initialize prompt templates array
      ragEnabled: true,
      chunkSize: 1000,
      similarityThreshold: 0.75,
      streamingEnabled: true,
      darkMode: true,
      citationsEnabled: true,
      historyRetentionDays: 30,
      
      // Cache settings - initialize empty
      modelsCache: {},
      cacheTimeToLive: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      verifiedAPIKeys: {},
      apiKeyVerificationTTL: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      
      // Actions
      setProvider: (provider) => set({ provider }),
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }), // Renamed from setDefaultPrompt
      setStreamingSystemPrompt: (prompt) => set({ streamingSystemPrompt: prompt }),
      setChatRouterSystemPrompt: (prompt) => set({ chatRouterSystemPrompt: prompt }),
      setPromptPrefix: (prefix) => set({ promptPrefix: prefix }),
      setPromptSuffix: (suffix) => set({ promptSuffix: suffix }),
      setPromptTemplates: (templates) => set({ promptTemplates: templates }),
      addPromptTemplate: (template) =>
        set((state) => ({
          promptTemplates: [
            ...state.promptTemplates,
            { id: Date.now(), ...template },
          ],
        })),
      deletePromptTemplate: (id) =>
        set((state) => ({
          promptTemplates: state.promptTemplates.filter((template) => template.id !== id),
        })),
      setRagEnabled: (enabled) => set({ ragEnabled: enabled }),
      setChunkSize: (size) => set({ chunkSize: size }),
      setSimilarityThreshold: (threshold) => set({ similarityThreshold: threshold }),
      setStreamingEnabled: (enabled) => set({ streamingEnabled: enabled }),
      setDarkMode: (enabled) => set({ darkMode: enabled }),
      setCitationsEnabled: (enabled) => set({ citationsEnabled: enabled }),
      setHistoryRetentionDays: (days) => set({ historyRetentionDays: days }),
      setCacheTimeToLive: (ttl) => set({ cacheTimeToLive: ttl }),
    }),
    {
      name: "chat-settings"
    }
  )
);