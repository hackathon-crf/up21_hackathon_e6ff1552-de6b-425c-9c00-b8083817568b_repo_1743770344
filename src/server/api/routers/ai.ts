import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { env } from "~/env";

// Supported AI providers
const PROVIDERS = [
	"mistral",
	"openai",
	"anthropic",
	"gemini",
	"openrouter",
] as const;

const ModelProvider = z.enum(PROVIDERS);
type ModelProvider = z.infer<typeof ModelProvider>;

// Provider-specific model information
interface ModelInfo {
	id: string;
	name: string;
	contextLength: number;
	provider: ModelProvider;
}

// Helper function to get API key from environment based on provider
function getEnvApiKey(provider: ModelProvider): string | undefined {
	switch (provider) {
		case "mistral":
			return env.MISTRAL_API_KEY;
		case "openai":
			return env.OPENAI_API_KEY;
		case "anthropic":
			return env.ANTHROPIC_API_KEY;
		case "gemini":
			return env.GEMINI_API_KEY;
		case "openrouter":
			return env.OPENROUTER_API_KEY;
		default:
			return undefined;
	}
}

// API endpoints for each provider
const PROVIDER_API_ENDPOINTS: Record<ModelProvider, string> = {
	mistral: "https://api.mistral.ai/v1/models",
	openai: "https://api.openai.com/v1/models",
	anthropic: "https://api.anthropic.com/v1/models", // Note: Anthropic doesn't have a public models endpoint
	gemini: "https://generativelanguage.googleapis.com/v1beta/models", // Google AI Studio API
	openrouter: "https://openrouter.ai/api/v1/models",
};

export const aiRouter = createTRPCRouter({
	// List available AI model providers
	getProviders: protectedProcedure.query(() => {
		return PROVIDERS.map((id) => ({
			id,
			name: id.charAt(0).toUpperCase() + id.slice(1),
		}));
	}),

	// Get models for a specific provider (always fetch from API)
	getModelsByProvider: protectedProcedure
		.input(
			z.object({
				provider: ModelProvider,
				apiKey: z.string().optional(), // Optional client-provided API key
			}),
		)
		.query(async ({ input }) => {
			const { provider, apiKey: clientApiKey } = input;
			const apiEndpoint = PROVIDER_API_ENDPOINTS[provider];
			
			// Get API key - prefer client-provided key, fall back to environment variable
			const envApiKey = getEnvApiKey(provider);
			const apiKey = clientApiKey || envApiKey;
			
			if (!apiKey) {
				const apiKeyEnvName = `${provider.toUpperCase()}_API_KEY`;
				console.warn(`[AI Router] No ${provider} API key found (neither client-provided nor in ${apiKeyEnvName})`);
				throw new Error(`API key for ${provider} is not configured. Please add it in the settings or set ${apiKeyEnvName} environment variable.`);
			}

			console.log(`[AI Router] Fetching models from ${provider} API`);
			
			try {
				// Build headers based on provider
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
				};

				// Add authorization header based on provider
				switch (provider) {
					case "mistral":
					case "openai":
					case "openrouter":
						headers["Authorization"] = `Bearer ${apiKey}`;
						break;
					case "anthropic":
						headers["x-api-key"] = apiKey;
						headers["anthropic-version"] = "2023-06-01";
						break;
					case "gemini":
						// Gemini uses API key in URL params
						break;
				}

				// Build URL with params for providers that need it
				let url = apiEndpoint;
				if (provider === "gemini") {
					url = `${apiEndpoint}?key=${apiKey}`;
				}

				const response = await fetch(url, { headers });

				if (!response.ok) {
					const errorText = await response.text();
					console.error(`[AI Router] ${provider} API error:`, response.status, errorText);
					throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
				}

				const data = await response.json();
				console.log(`[AI Router] Raw ${provider} API response:`, JSON.stringify(data).substring(0, 500));

				// Transform response based on provider
				let models: ModelInfo[] = [];
				
				switch (provider) {
					case "mistral":
						models = data.data?.map((model: any) => {
							// Clean up model name for display
							let displayName = model.id;
							
							// Remove common prefixes
							displayName = displayName.replace(/^(mistral-|open-mistral-|codestral-|ministral-|pixtral-|voxtral-)/, "");
							
							// Handle version numbers and dates
							displayName = displayName.replace(/-(\d{4})$/, " $1"); // Year versions
							displayName = displayName.replace(/-v(\d+)/, " v$1"); // Version numbers
							displayName = displayName.replace("-latest", "");
							
							// Capitalize and format
							displayName = displayName.replace(/-/g, " ");
							displayName = displayName.split(" ").map((word: string) => 
								word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
							).join(" ");
							
							// Add model type prefix for clarity
							if (model.id.startsWith("codestral")) displayName = `Codestral ${displayName}`;
							else if (model.id.startsWith("ministral")) displayName = `Ministral ${displayName}`;
							else if (model.id.startsWith("pixtral")) displayName = `Pixtral ${displayName}`;
							else if (model.id.startsWith("voxtral")) displayName = `Voxtral ${displayName}`;
							else if (model.id.startsWith("open-mistral")) displayName = `Open ${displayName}`;
							else if (!displayName.toLowerCase().includes("mistral")) displayName = `Mistral ${displayName}`;
							
							return {
								id: model.id,
								name: displayName.trim(),
								contextLength: model.max_context_length || model.context_length || 32000,
								provider: "mistral" as const,
							};
						}) || [];
						break;
						
					case "openai":
						models = data.data?.filter((model: any) => 
							model.id.includes("gpt") || model.id.includes("davinci")
						).map((model: any) => ({
							id: model.id,
							name: model.id.toUpperCase().replace(/-/g, " "),
							contextLength: 128000, // OpenAI doesn't provide this in API
							provider: "openai" as const,
						})) || [];
						break;
						
					case "anthropic":
						// Anthropic doesn't have a models endpoint, return hardcoded list
						models = [
							{ id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", contextLength: 200000, provider: "anthropic" as const },
							{ id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", contextLength: 200000, provider: "anthropic" as const },
							{ id: "claude-3-opus-20240229", name: "Claude 3 Opus", contextLength: 200000, provider: "anthropic" as const },
						];
						break;
						
					case "gemini":
						models = data.models?.map((model: any) => ({
							id: model.name.replace("models/", ""),
							name: model.displayName || model.name.replace("models/", ""),
							contextLength: model.inputTokenLimit || 32000,
							provider: "gemini" as const,
						})) || [];
						break;
						
					case "openrouter":
						models = data.data?.slice(0, 20).map((model: any) => ({ // Limit to top 20 models
							id: model.id,
							name: model.name || model.id,
							contextLength: model.context_length || 32000,
							provider: "openrouter" as const,
						})) || [];
						break;
				}

				// Deduplicate models by ID (some providers return duplicates)
				const seenIds = new Set<string>();
				const duplicates: string[] = [];
				const uniqueModels = models.reduce((acc: ModelInfo[], model) => {
					if (seenIds.has(model.id)) {
						duplicates.push(model.id);
					} else {
						seenIds.add(model.id);
						acc.push(model);
					}
					return acc;
				}, []);

				if (duplicates.length > 0) {
					console.log(`[AI Router] Removed duplicate models from ${provider}:`, duplicates);
				}

				// Sort models for better UX (larger/newer models first)
				uniqueModels.sort((a, b) => {
					// Sort by context length (descending) as a proxy for model capability
					if (a.contextLength !== b.contextLength) {
						return b.contextLength - a.contextLength;
					}
					// Then alphabetically by name
					return a.name.localeCompare(b.name);
				});

				console.log(`[AI Router] Transformed ${provider} models:`, uniqueModels.length, "unique models found (from ${models.length} total)");
				return uniqueModels;

			} catch (error) {
				console.error(`[AI Router] Error fetching ${provider} models:`, error);
				throw error instanceof Error ? error : new Error(`Failed to fetch models from ${provider}`);
			}
		}),
});
