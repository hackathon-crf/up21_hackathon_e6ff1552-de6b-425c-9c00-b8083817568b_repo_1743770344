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
  defaultPrompt: string;
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
  
  // Actions
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setDefaultPrompt: (prompt: string) => void;
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
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      provider: "mistral",
      model: "mistral-small",
      temperature: 0.7,
      maxTokens: 4000,
      defaultPrompt: "You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately.",
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
      
      // Actions
      setProvider: (provider) => set({ provider }),
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setDefaultPrompt: (prompt) => set({ defaultPrompt: prompt }),
      setPromptPrefix: (prefix) => set({ promptPrefix: prefix }),
      setPromptSuffix: (suffix) => set({ promptSuffix: suffix }),
      setPromptTemplates: (templates) => set({ promptTemplates: templates }), // Added setter for templates
      addPromptTemplate: (template) =>
        set((state) => ({
          promptTemplates: [
            ...state.promptTemplates,
            { id: state.promptTemplates.length + 1, ...template },
          ],
        })), // Added method to add template
      deletePromptTemplate: (id) =>
        set((state) => ({
          promptTemplates: state.promptTemplates.filter((template) => template.id !== id),
        })), // Added method to delete template
      setRagEnabled: (enabled) => set({ ragEnabled: enabled }),
      setChunkSize: (size) => set({ chunkSize: size }),
      setSimilarityThreshold: (threshold) => set({ similarityThreshold: threshold }),
      setStreamingEnabled: (enabled) => set({ streamingEnabled: enabled }),
      setDarkMode: (enabled) => set({ darkMode: enabled }),
      setCitationsEnabled: (enabled) => set({ citationsEnabled: enabled }),
      setHistoryRetentionDays: (days) => set({ historyRetentionDays: days }),
    }),
    {
      name: "chat-settings"
    }
  )
);