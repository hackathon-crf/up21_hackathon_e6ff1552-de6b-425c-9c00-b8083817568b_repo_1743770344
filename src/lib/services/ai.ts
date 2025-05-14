import { Mistral } from "@mistralai/mistralai";
import { OpenAI } from "openai";
import { z } from "zod";

export type ChatMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

export type AIServiceOptions = {
	temperature?: number;
	maxTokens?: number;
	stream?: boolean;
};

// Response schema to handle different provider formats
export type AIServiceResponse = {
	id: string;
	content: string;
	usage?: {
		promptTokens?: number;
		completionTokens?: number;
		totalTokens?: number;
	};
	model?: string;
	provider: string;
};

// Stream chunk type
export type AIStreamChunk = {
	id?: string;
	content: string;
	done: boolean;
};

// Error class for AI service errors
export class AIServiceError extends Error {
	constructor(
		message: string,
		public provider: string,
		public statusCode?: number,
		public originalError?: unknown,
	) {
		super(message);
		this.name = "AIServiceError";
	}
}

// AI service class that can handle multiple providers
export class AIService {
	private provider: string;
	private apiKey: string;
	private model: string;

	constructor(provider: string, apiKey: string, model?: string) {
		this.provider = provider.toLowerCase();
		this.apiKey = apiKey || "";
		this.model = model || this.getDefaultModel(provider);

		// Validate provider
		if (!this.isSupportedProvider(this.provider)) {
			throw new AIServiceError(
				`Unsupported provider: ${this.provider}`,
				this.provider,
			);
		}

		// Validate API key
		if (!this.apiKey) {
			throw new AIServiceError(
				`API key is required for ${this.provider}`,
				this.provider,
			);
		}
	}

	private isSupportedProvider(provider: string): boolean {
		return ["openai", "mistral", "anthropic", "gemini", "openrouter"].includes(
			provider,
		);
	}

	private getDefaultModel(provider: string): string {
		const defaults: Record<string, string> = {
			openai: "gpt-4o",
			mistral: "mistral-small-latest",
			anthropic: "claude-3-haiku",
			gemini: "gemini-pro",
			openrouter: "openai/gpt-4o",
		};
		return defaults[provider] || "";
	}

	private getMistralClient() {
		try {
			// Thorough API key cleaning - remove any whitespace, quotes, and invisible characters
			const cleanedApiKey = this.apiKey
				.trim()
				.replace(/['"]/g, '')
				.replace(/\s+/g, '')
				.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width spaces and other invisible chars
			
			// Validate API key format for Mistral
			if (cleanedApiKey.length < 20) {
				console.warn("[AIService] ⚠️ Mistral API key appears to be too short");
			}
			
			if (!/^[A-Za-z0-9_\-]+$/.test(cleanedApiKey)) {
				console.warn("[AIService] ⚠️ Mistral API key contains invalid characters");
			}
			
			// DETAILED DEBUG LOG
			console.log("[AIService] Creating Mistral client with:", {
				keyLength: cleanedApiKey.length,
				keyPrefix: cleanedApiKey.substring(0, 5) + '...',
				keySuffix: '...' + cleanedApiKey.substring(cleanedApiKey.length - 5),
				keyFormat: cleanedApiKey.match(/^[A-Za-z0-9_\-]+$/) ? "valid format" : "invalid format",
				// This is how the key will be formatted in the Authorization header
				authHeader: `Bearer ${cleanedApiKey}`,
				authHeaderLength: `Bearer ${cleanedApiKey}`.length
			});
			
			// Log full sanitized key for diagnostic purposes (be careful with this in production)
			// But we need to debug the actual key being used
			console.log("[AIService] DEBUG ONLY - Full sanitized key:", cleanedApiKey);
			
			// Important: Use the cleaned key
			const client = new Mistral({ 
				apiKey: cleanedApiKey 
			});
			
			// Test if the client was initialized correctly
			console.log("[AIService] Mistral client initialized successfully");
			
			return client;
		} catch (error) {
			console.error("[AIService] Failed to initialize Mistral client:", error);
			throw new AIServiceError(
				`Failed to initialize Mistral client: ${error instanceof Error ? error.message : String(error)}`,
				"mistral",
				undefined,
				error
			);
		}
	}

	private getOpenAIClient() {
		try {
			// Clean the API key - remove any whitespace or quotes
			const cleanedApiKey = this.apiKey.trim().replace(/['"]/g, '');
			
			// Validate API key format for OpenAI (starts with "sk-" and has minimum length)
			if (!cleanedApiKey.startsWith("sk-") && cleanedApiKey.length < 30) {
				console.warn("OpenAI API key appears to be in an invalid format");
			}
			
			// Important: Use the cleaned key
			return new OpenAI({ apiKey: cleanedApiKey });
		} catch (error) {
			throw new AIServiceError(
				`Failed to initialize OpenAI client: ${error instanceof Error ? error.message : String(error)}`,
				"openai",
				undefined,
				error
			);
		}
	}

	async generateResponse(
		messages: ChatMessage[],
		options: AIServiceOptions = {},
	): Promise<AIServiceResponse> {
		// Default options
		const finalOptions = {
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4000,
			stream: false,
		};

		try {
			switch (this.provider) {
				case "mistral": {
					const mistralClient = this.getMistralClient();
					const response = await mistralClient.chat.complete({
						model: this.model,
						messages,
						temperature: finalOptions.temperature,
						maxTokens: finalOptions.maxTokens,
					});

					return {
						id: response.id,
						content:
							typeof response.choices?.[0]?.message.content === "string"
								? response.choices[0].message.content
								: Array.isArray(response.choices?.[0]?.message.content)
									? response.choices[0].message.content.join("")
									: "",
						usage: {
							promptTokens: response.usage?.promptTokens,
							completionTokens: response.usage?.completionTokens,
							totalTokens: response.usage?.totalTokens,
						},
						model: response.model,
						provider: "mistral",
					};
				}

				case "openai": {
					const openaiClient = this.getOpenAIClient();
					const response = await openaiClient.chat.completions.create({
						model: this.model,
						messages,
						temperature: finalOptions.temperature,
						max_tokens: finalOptions.maxTokens,
					});

					return {
						id: response.id,
						content: response.choices[0]?.message?.content || "",
						usage: {
							promptTokens: response.usage?.prompt_tokens,
							completionTokens: response.usage?.completion_tokens,
							totalTokens: response.usage?.total_tokens,
						},
						model: response.model,
						provider: "openai",
					};
				}

				case "anthropic":
				case "gemini":
				case "openrouter":
					throw new AIServiceError(
						`Provider ${this.provider} is supported but not yet implemented`,
						this.provider,
					);

				default:
					throw new AIServiceError(
						`Unsupported provider: ${this.provider}`,
						this.provider,
					);
			}
		} catch (error: unknown) {
			// Handle specific provider errors
			if (error instanceof AIServiceError) {
				throw error;
			}

			// Handle other errors
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new AIServiceError(
				`Error generating response from ${this.provider}: ${message}`,
				this.provider,
				undefined,
				error,
			);
		}
	}

	async generateStreamingResponse(
		messages: ChatMessage[],
		options: AIServiceOptions = {},
	): Promise<AsyncGenerator<AIStreamChunk, void, unknown>> {
		// Default options
		const finalOptions = {
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 4000,
		};

		// Log API key length and format for debugging (safely)
		console.log(`[AIService] Using ${this.provider} API key:`, {
			length: this.apiKey.length,
			format: this.apiKey.substring(0, 4) + '...',
			model: this.model,
		});

		switch (this.provider) {
			case "mistral": {
				const mistralClient = this.getMistralClient();
				// Updated to use the correct Mistral streaming API
				try {
					const stream = await mistralClient.chat.stream({
						model: this.model,
						messages,
						temperature: finalOptions.temperature,
						maxTokens: finalOptions.maxTokens,
					});

					return this.processMistralStream(stream);
				} catch (error) {
					// Handle authentication errors specifically
					const errorMessage = error instanceof Error ? error.message : String(error);
					console.error("[AIService] Mistral API error:", errorMessage);
					
					if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
						throw new AIServiceError(
							"Authentication failed with Mistral API. Please check your API key.",
							"mistral",
							401,
							error
						);
					}
					throw error;
				}
			}

			case "openai": {
				const openaiClient = this.getOpenAIClient();
				try {
					const stream = await openaiClient.chat.completions.create({
						model: this.model,
						messages,
						temperature: finalOptions.temperature,
						max_tokens: finalOptions.maxTokens,
						stream: true,
					});

					return this.processOpenAIStream(stream);
				} catch (error) {
					// Handle authentication errors specifically
					const errorMessage = error instanceof Error ? error.message : String(error);
					console.error("[AIService] OpenAI API error:", errorMessage);
					
					if (errorMessage.includes("401") || errorMessage.includes("Unauthorized") || errorMessage.includes("authentication")) {
						throw new AIServiceError(
							"Authentication failed with OpenAI API. Please check your API key.",
							"openai",
							401,
							error
						);
					}
					throw error;
				}
			}

			case "anthropic":
			case "gemini":
			case "openrouter":
				throw new AIServiceError(
					`Streaming for ${this.provider} is supported but not yet implemented`,
					this.provider,
				);

			default:
				throw new AIServiceError(
					`Unsupported provider for streaming: ${this.provider}`,
					this.provider,
				);
		}
	}

	private async *processMistralStream(
		stream: AsyncIterable<unknown>, // Use unknown for broader compatibility
	): AsyncGenerator<AIStreamChunk, void, unknown> {
		try {
			for await (const chunk of stream) {
				// Type assertion or checking might be needed here if accessing specific properties
				const mistralChunk = chunk as {
					data?: { choices?: Array<{ delta?: { content?: string | null } }> };
					id?: string;
				};
				if (mistralChunk.data?.choices?.[0]?.delta?.content) {
					yield {
						id: mistralChunk.id,
						content: mistralChunk.data.choices[0].delta.content,
						done: false,
					};
				}
			}
			yield { content: "", done: true };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new AIServiceError(
				`Error processing Mistral stream: ${message}`,
				"mistral",
				undefined,
				error,
			);
		}
	}

	private async *processOpenAIStream(
		stream: AsyncIterable<unknown>, // Use unknown for broader compatibility
	): AsyncGenerator<AIStreamChunk, void, unknown> {
		try {
			for await (const chunk of stream) {
				// Type assertion or checking might be needed here if accessing specific properties
				const openAIChunk = chunk as {
					id?: string;
					choices?: Array<{ delta?: { content?: string | null } }>;
				};
				if (openAIChunk.choices?.[0]?.delta?.content) {
					yield {
						id: openAIChunk.id,
						content: openAIChunk.choices[0].delta.content,
						done: false,
					};
				}
			}
			yield { content: "", done: true };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new AIServiceError(
				`Error processing OpenAI stream: ${message}`,
				"openai",
				undefined,
				error,
			);
		}
	}

	// Utility method to validate and get API key
	static async validateApiKey(
		provider: string,
		apiKey: string,
	): Promise<boolean> {
		try {
			const service = new AIService(provider, apiKey);

			// Make a minimal test call based on provider
			switch (provider) {
				case "mistral": {
					const client = service.getMistralClient();
					await client.models.list();
					break;
				}
				case "openai": {
					const client = service.getOpenAIClient();
					await client.models.list();
					break;
				}
				// Add other providers as needed
			}

			return true;
		} catch (error) {
			console.error(`Error validating ${provider} API key:`, error);
			return false;
		}
	}
}
