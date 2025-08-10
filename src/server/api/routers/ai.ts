import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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

// Provider model configurations (static data for reliability)
const PROVIDER_MODELS: Record<ModelProvider, ModelInfo[]> = {
	mistral: [
		{
			id: "mistral-tiny",
			name: "Mistral Tiny",
			contextLength: 32000,
			provider: "mistral",
		},
		{
			id: "mistral-small-latest",
			name: "Mistral Small",
			contextLength: 32000,
			provider: "mistral",
		},
		{
			id: "mistral-medium-latest",
			name: "Mistral Medium",
			contextLength: 32000,
			provider: "mistral",
		},
		{
			id: "mistral-large-latest",
			name: "Mistral Large",
			contextLength: 128000,
			provider: "mistral",
		},
	],
	openai: [
		{
			id: "gpt-4o",
			name: "GPT-4o",
			contextLength: 128000,
			provider: "openai",
		},
		{
			id: "gpt-4o-mini",
			name: "GPT-4o Mini",
			contextLength: 128000,
			provider: "openai",
		},
		{
			id: "gpt-4-turbo",
			name: "GPT-4 Turbo",
			contextLength: 128000,
			provider: "openai",
		},
	],
	anthropic: [
		{
			id: "claude-3-5-sonnet-20241022",
			name: "Claude 3.5 Sonnet",
			contextLength: 200000,
			provider: "anthropic",
		},
		{
			id: "claude-3-haiku-20240307",
			name: "Claude 3 Haiku",
			contextLength: 200000,
			provider: "anthropic",
		},
	],
	gemini: [
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
	],
	openrouter: [
		{
			id: "openai/gpt-4o",
			name: "OpenAI GPT-4o",
			contextLength: 128000,
			provider: "openrouter",
		},
		{
			id: "anthropic/claude-3-5-sonnet",
			name: "Anthropic Claude 3.5 Sonnet",
			contextLength: 200000,
			provider: "openrouter",
		},
		{
			id: "mistralai/mistral-large",
			name: "Mistral Large",
			contextLength: 128000,
			provider: "openrouter",
		},
	],
};

export const aiRouter = createTRPCRouter({
	// List available AI model providers
	getProviders: protectedProcedure.query(() => {
		return PROVIDERS.map((id) => ({
			id,
			name: id.charAt(0).toUpperCase() + id.slice(1),
		}));
	}),

	// Get models for a specific provider
	getModelsByProvider: protectedProcedure
		.input(
			z.object({
				provider: ModelProvider,
			}),
		)
		.query(async ({ input }) => {
			const models = PROVIDER_MODELS[input.provider];

			if (!models) {
				throw new Error(`Models not found for provider: ${input.provider}`);
			}

			return models;
		}),
});
