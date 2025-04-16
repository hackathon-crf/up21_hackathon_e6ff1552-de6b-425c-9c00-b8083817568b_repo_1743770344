import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define model type
export interface AIModel {
	id: string;
	name: string;
	contextLength?: number;
}

// Define cache structure with timestamp and key hash
export interface ModelsCache {
	[cacheKey: string]: {
		provider: string;
		keyHash: string;
		models: AIModel[];
		lastFetched: number;
	};
}

// Define verified API keys storage structure with expiration
export interface VerifiedAPIKeys {
	[provider: string]: {
		[keyHash: string]: {
			isValid: boolean;
			verifiedAt: number;
		};
	};
}

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
	systemPrompt: string; // This will be the unified system prompt (renamed from defaultPrompt)
	streamingSystemPrompt: string; // System prompt for streaming API
	chatRouterSystemPrompt: string; // System prompt for chat router
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
	modelsCache: ModelsCache;
	cacheTimeToLive: number; // In milliseconds
	verifiedAPIKeys: VerifiedAPIKeys;
	apiKeyVerificationTTL: number; // In milliseconds

	// Actions
	setProvider: (provider: string) => void;
	setModel: (model: string) => void;
	setTemperature: (temperature: number) => void;
	setMaxTokens: (maxTokens: number) => void;
	setSystemPrompt: (prompt: string) => void; // Renamed setter for systemPrompt
	setStreamingSystemPrompt: (prompt: string) => void; // Setter for streaming system prompt
	setChatRouterSystemPrompt: (prompt: string) => void; // Setter for chat router system prompt
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

	// Cache and API key actions
	updateModelsCache: (
		provider: string,
		apiKey: string,
		models: AIModel[],
	) => void;
	getModelsFromCache: (provider: string, apiKey: string) => AIModel[] | null;
	clearModelsCache: (provider?: string, apiKey?: string) => void;
	isCacheExpired: (provider: string, apiKey: string) => boolean;
	setCacheTimeToLive: (ttl: number) => void;
	setVerifiedAPIKey: (
		provider: string,
		apiKey: string,
		isValid: boolean,
	) => void;
	isAPIKeyVerified: (provider: string, apiKey: string) => boolean;
	setApiKeyVerificationTTL: (ttl: number) => void;
	isKeyVerificationExpired: (provider: string, apiKey: string) => boolean;
}

// Simple hash function for API keys (for demo purposes - not secure)
// In production, you would use a more secure method
const hashApiKey = (apiKey: string): string => {
	return apiKey.substring(0, 8); // Just use first few chars as "hash"
};

// Generate a cache key from provider and API key hash
const generateCacheKey = (provider: string, apiKeyHash: string): string => {
	return `${provider}:${apiKeyHash}`;
};

export const useSettingsStore = create<SettingsState>()(
	persist(
		(set, get) => ({
			// Default values
			provider: "mistral",
			model: "mistral-small",
			temperature: 0.7,
			maxTokens: 4000,
			systemPrompt:
				"You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately.", // Renamed from defaultPrompt
			streamingSystemPrompt: "",
			chatRouterSystemPrompt: "",
			promptPrefix: "",
			promptSuffix:
				"Please provide reliable information based on official Red Cross guidelines.",
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
			setSystemPrompt: (prompt) => set({ systemPrompt: prompt }), // Renamed setter for systemPrompt
			setStreamingSystemPrompt: (prompt) =>
				set({ streamingSystemPrompt: prompt }),
			setChatRouterSystemPrompt: (prompt) =>
				set({ chatRouterSystemPrompt: prompt }),
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
					promptTemplates: state.promptTemplates.filter(
						(template) => template.id !== id,
					),
				})),
			setRagEnabled: (enabled) => set({ ragEnabled: enabled }),
			setChunkSize: (size) => set({ chunkSize: size }),
			setSimilarityThreshold: (threshold) =>
				set({ similarityThreshold: threshold }),
			setStreamingEnabled: (enabled) => set({ streamingEnabled: enabled }),
			setDarkMode: (enabled) => set({ darkMode: enabled }),
			setCitationsEnabled: (enabled) => set({ citationsEnabled: enabled }),
			setHistoryRetentionDays: (days) => set({ historyRetentionDays: days }),

			// Cache actions
			updateModelsCache: (provider, apiKey, models) => {
				const keyHash = hashApiKey(apiKey);
				const cacheKey = generateCacheKey(provider, keyHash);

				set((state) => ({
					modelsCache: {
						...state.modelsCache,
						[cacheKey]: {
							provider,
							keyHash,
							models,
							lastFetched: Date.now(),
						},
					},
				}));
			},

			getModelsFromCache: (provider, apiKey) => {
				const keyHash = hashApiKey(apiKey);
				const cacheKey = generateCacheKey(provider, keyHash);
				const cache = get().modelsCache[cacheKey];
				return cache ? cache.models : null;
			},

			clearModelsCache: (provider, apiKey) =>
				set((state) => {
					if (provider && apiKey) {
						// Clear specific provider/key cache
						const keyHash = hashApiKey(apiKey);
						const cacheKey = generateCacheKey(provider, keyHash);
						const newCache = { ...state.modelsCache };
						delete newCache[cacheKey];
						return { modelsCache: newCache };
					}
					if (provider) {
						// Clear all caches for a provider
						const newCache = { ...state.modelsCache };
						for (const key of Object.keys(newCache)) {
							if (key.startsWith(`${provider}:`)) {
								delete newCache[key];
							}
						}
						return { modelsCache: newCache };
					}
					// Clear all cache
					return { modelsCache: {} };
				}),

			isCacheExpired: (provider, apiKey) => {
				const keyHash = hashApiKey(apiKey);
				const cacheKey = generateCacheKey(provider, keyHash);
				const cache = get().modelsCache[cacheKey];

				if (!cache) return true;

				const now = Date.now();
				const cacheAge = now - cache.lastFetched;
				return cacheAge > get().cacheTimeToLive;
			},

			setCacheTimeToLive: (ttl) => set({ cacheTimeToLive: ttl }),

			// API key verification actions
			setVerifiedAPIKey: (provider, apiKey, isValid) =>
				set((state) => {
					const keyHash = hashApiKey(apiKey);
					return {
						verifiedAPIKeys: {
							...state.verifiedAPIKeys,
							[provider]: {
								...(state.verifiedAPIKeys[provider] || {}),
								[keyHash]: {
									isValid,
									verifiedAt: Date.now(),
								},
							},
						},
					};
				}),

			isAPIKeyVerified: (provider, apiKey) => {
				const keyHash = hashApiKey(apiKey);
				const providerKeys = get().verifiedAPIKeys[provider];

				if (!providerKeys || !providerKeys[keyHash]) {
					return false;
				}

				// Check if verification is still valid
				if (get().isKeyVerificationExpired(provider, apiKey)) {
					return false;
				}

				return providerKeys[keyHash].isValid;
			},

			setApiKeyVerificationTTL: (ttl) => set({ apiKeyVerificationTTL: ttl }),

			isKeyVerificationExpired: (provider, apiKey) => {
				const keyHash = hashApiKey(apiKey);
				const providerKeys = get().verifiedAPIKeys[provider];

				if (!providerKeys || !providerKeys[keyHash]) {
					return true;
				}

				const verificationData = providerKeys[keyHash];
				const now = Date.now();
				const verificationAge = now - verificationData.verifiedAt;

				return verificationAge > get().apiKeyVerificationTTL;
			},
		}),
		{
			name: "chat-settings",
			// Only persist specific fields, not including large caches
			partialize: (state) => ({
				provider: state.provider,
				model: state.model,
				temperature: state.temperature,
				maxTokens: state.maxTokens,
				systemPrompt: state.systemPrompt, // Renamed from defaultPrompt
				promptPrefix: state.promptPrefix,
				promptSuffix: state.promptSuffix,
				promptTemplates: state.promptTemplates,
				ragEnabled: state.ragEnabled,
				chunkSize: state.chunkSize,
				similarityThreshold: state.similarityThreshold,
				streamingEnabled: state.streamingEnabled,
				darkMode: state.darkMode,
				citationsEnabled: state.citationsEnabled,
				historyRetentionDays: state.historyRetentionDays,
				// Include these but with memory-efficient modifications
				verifiedAPIKeys: state.verifiedAPIKeys, // Keep API key verification status
				cacheTimeToLive: state.cacheTimeToLive,
				apiKeyVerificationTTL: state.apiKeyVerificationTTL,
				// Don't persist the actual model cache to avoid bloating localStorage
			}),
		},
	),
);
