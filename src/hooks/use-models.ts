import { useCallback, useEffect, useRef, useState } from "react";
import { useSettingsStore } from "../../stores/settings";
import type { AIModel } from "../../stores/settings";

interface UseModelsOptions {
	/**
	 * Whether to automatically fetch models when the provider changes
	 * @default false
	 */
	autoFetch?: boolean;

	/**
	 * Time-to-live for the cache in milliseconds
	 * @default 24 * 60 * 60 * 1000 (24 hours)
	 */
	cacheTimeToLive?: number;

	/**
	 * Grace period after TTL when cache can still be used but
	 * a background refresh is triggered
	 * @default 7 * 24 * 60 * 60 * 1000 (7 days)
	 */
	cacheGracePeriod?: number;

	/**
	 * Time-to-live for API key verification in milliseconds
	 * @default 7 * 24 * 60 * 60 * 1000 (7 days)
	 */
	apiKeyVerificationTTL?: number;
}

interface UseModelsReturn {
	/**
	 * Models available for the current provider
	 */
	models: AIModel[];

	/**
	 * Whether models are currently being fetched as a primary operation
	 */
	isLoading: boolean;

	/**
	 * Whether a background refresh is happening
	 */
	isRefreshingInBackground: boolean;

	/**
	 * Error message, if any
	 */
	error: string | null;

	/**
	 * Fetch models for the given provider
	 */
	fetchModels: (provider: string, apiKey: string) => Promise<AIModel[]>;

	/**
	 * Verify API key for the given provider
	 */
	verifyApiKey: (provider: string, apiKey: string) => Promise<boolean>;

	/**
	 * Clear the cache for the given provider
	 */
	clearCache: (provider?: string, apiKey?: string) => void;

	/**
	 * Check if the cache for the given provider is expired
	 */
	isCacheExpired: (provider: string, apiKey: string) => boolean;

	/**
	 * Check if the cache is in grace period (expired but still usable with background refresh)
	 */
	isCacheStale: (provider: string, apiKey: string) => boolean;

	/**
	 * Get the timestamp when the cache was last updated
	 */
	getLastCacheUpdate: (provider: string, apiKey: string) => Date | null;

	/**
	 * Calculate when the cache will expire
	 */
	getCacheExpiryTime: (provider: string, apiKey: string) => Date | null;

	/**
	 * Check if an API key needs re-verification
	 */
	isKeyVerificationExpired: (provider: string, apiKey: string) => boolean;
}

/**
 * Hook to manage models with smarter caching and API key verification
 */
export function useModels(
	provider: string,
	options: UseModelsOptions = {},
): UseModelsReturn {
	const {
		autoFetch = false,
		cacheTimeToLive,
		cacheGracePeriod = 7 * 24 * 60 * 60 * 1000, // 7 days grace period by default
		apiKeyVerificationTTL,
	} = options;

	const [models, setModels] = useState<AIModel[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isRefreshingInBackground, setIsRefreshingInBackground] =
		useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Track last auto-refresh to prevent multiple simultaneous background refreshes
	const lastAutoRefreshAttempt = useRef<Record<string, number>>({});

	// Reference for ongoing fetch operations to prevent duplicate requests
	const ongoingFetchRef = useRef<Record<string, boolean>>({});

	// Add state for API key verification status (using the store's isAPIKeyVerified)
	// const [isKeyVerified, setIsKeyVerified] = useState<Record<string, boolean>>({}); // Example if not using store

	const {
		modelsCache,
		verifiedAPIKeys,
		updateModelsCache,
		getModelsFromCache,
		isCacheExpired,
		isKeyVerificationExpired,
		setCacheTimeToLive,
		setApiKeyVerificationTTL,
		setVerifiedAPIKey,
		isAPIKeyVerified, // Use this from the store
		clearModelsCache,
	} = useSettingsStore();

	// Set custom TTL if provided in options
	useEffect(() => {
		if (cacheTimeToLive) {
			setCacheTimeToLive(cacheTimeToLive);
		}
		if (apiKeyVerificationTTL) {
			setApiKeyVerificationTTL(apiKeyVerificationTTL);
		}
	}, [
		cacheTimeToLive,
		apiKeyVerificationTTL,
		setCacheTimeToLive,
		setApiKeyVerificationTTL,
	]);

	// Check if the cache is stale (expired but still usable with background refresh)
	const isCacheStale = useCallback(
		(providerName: string, apiKey: string): boolean => {
			// If cache is fully expired, it's also stale
			if (isCacheExpired(providerName, apiKey)) {
				const keyHash = apiKey.substring(0, 8);
				const cacheKey = `${providerName}:${keyHash}`;

				// Get actual cache entry to check timestamp
				const cacheEntry = modelsCache[cacheKey];
				if (!cacheEntry) return true;

				const now = Date.now();
				const cacheAge = now - cacheEntry.lastFetched;

				// If cache is expired but still within grace period, it's stale
				return (
					cacheAge <=
					(cacheTimeToLive || 24 * 60 * 60 * 1000) + cacheGracePeriod
				);
			}

			return false;
		},
		[modelsCache, isCacheExpired, cacheTimeToLive, cacheGracePeriod],
	);

	// Calculate when the cache will expire
	const getCacheExpiryTime = useCallback(
		(providerName: string, apiKey: string): Date | null => {
			const keyHash = apiKey.substring(0, 8);
			const cacheKey = `${providerName}:${keyHash}`;
			const cache = modelsCache[cacheKey];

			if (!cache) return null;

			const ttl = cacheTimeToLive || 24 * 60 * 60 * 1000;
			return new Date(cache.lastFetched + ttl);
		},
		[modelsCache, cacheTimeToLive],
	);

	// Get last cache update time
	const getLastCacheUpdate = useCallback(
		(providerName: string, apiKey: string): Date | null => {
			const keyHash = apiKey.substring(0, 8);
			const cacheKey = `${providerName}:${keyHash}`;
			const cache = modelsCache[cacheKey];
			return cache ? new Date(cache.lastFetched) : null;
		},
		[modelsCache],
	);

	// Load models from cache initially if we have an API key
	useEffect(() => {
		const apiKey = localStorage.getItem(`${provider}_api_key`);
		if (apiKey) {
			const cachedModels = getModelsFromCache(provider, apiKey);
			if (cachedModels) {
				setModels(cachedModels);
			}
		}
	}, [provider, getModelsFromCache]);

	// Wrap getProviderEndpoint in useCallback
	const getProviderEndpoint = useCallback((providerName: string): string => {
		const endpoints: Record<string, string> = {
			openai: "https://api.openai.com/v1/models",
			mistral: "https://api.mistral.ai/v1/models",
			anthropic: "https://api.anthropic.com/v1/models",
			gemini: "https://generativelanguage.googleapis.com/v1beta/models",
			openrouter: "https://openrouter.ai/api/v1/models",
		};

		return endpoints[providerName] || "";
	}, []); // Empty dependency array as it has no external dependencies

	/**
	 * Parses the raw API response into a standardized AIModel array
	 */
	// Wrap parseModelsResponse in useCallback
	const parseModelsResponse = useCallback(
		(data: unknown, providerName: string): AIModel[] => {
			let parsedModels: AIModel[] = [];

			// Type guards remain the same
			const isOpenAIResponse = (d: unknown): d is { data: { id: string }[] } =>
				typeof d === "object" &&
				d !== null &&
				"data" in d &&
				Array.isArray((d as { data: unknown }).data);

			const isMistralResponse = (d: unknown): d is { data: { id: string }[] } =>
				typeof d === "object" &&
				d !== null &&
				"data" in d &&
				Array.isArray((d as { data: unknown }).data);

			const isAnthropicResponse = (
				d: unknown,
			): d is { models: { id: string; name?: string }[] } =>
				typeof d === "object" &&
				d !== null &&
				"models" in d &&
				Array.isArray((d as { models: unknown }).models);

			const isGeminiResponse = (
				d: unknown,
			): d is { models: { name: string; displayName?: string }[] } =>
				typeof d === "object" &&
				d !== null &&
				"models" in d &&
				Array.isArray((d as { models: unknown }).models);

			const isOpenRouterResponse = (
				d: unknown,
			): d is { data: { id: string; name?: string }[] } =>
				typeof d === "object" &&
				d !== null &&
				"data" in d &&
				Array.isArray((d as { data: unknown }).data);

			switch (providerName) {
				// Cases remain the same
				case "openai":
					if (isOpenAIResponse(data)) {
						parsedModels = data.data.map((model) => ({
							id: model.id,
							name: model.id,
						}));
					} else {
						console.error("[useModels] Invalid OpenAI response format:", data);
					}
					break;
				case "mistral":
					if (isMistralResponse(data)) {
						parsedModels = data.data.map((model) => ({
							id: model.id,
							name: model.id,
						}));
					} else {
						console.error("[useModels] Invalid Mistral response format:", data);
					}
					break;
				case "anthropic":
					if (isAnthropicResponse(data)) {
						parsedModels = (data.models || []).map((model) => ({
							id: model.id,
							name: model.name || model.id,
							provider: "anthropic",
						}));
					} else {
						console.error(
							"[useModels] Invalid Anthropic response format:",
							data,
						);
					}
					break;
				case "gemini":
					if (isGeminiResponse(data)) {
						parsedModels = (data.models || []).map((model) => ({
							id: model.name.split("/").pop() || model.name,
							name: model.displayName || model.name,
							provider: "gemini",
						}));
					} else {
						console.error("[useModels] Invalid Gemini response format:", data);
					}
					break;
				case "openrouter":
					if (isOpenRouterResponse(data)) {
						parsedModels = (data.data || []).map((model) => ({
							id: model.id,
							name: model.name || model.id,
							provider: "openrouter",
						}));
					} else {
						console.error(
							"[useModels] Invalid OpenRouter response format:",
							data,
						);
					}
					break;
				default:
					console.warn(`[useModels] Unknown provider: ${providerName}`);
			}

			return parsedModels;
		},
		[],
	); // Empty dependency array as it has no external dependencies

	// Wrap fetchModelsFromAPI in useCallback
	const fetchModelsFromAPI = useCallback(
		async (providerName: string, apiKey: string): Promise<AIModel[]> => {
			// Prevent duplicate API calls for the same provider-key pair
			const keyHash = apiKey.substring(0, 8);
			const fetchKey = `${providerName}:${keyHash}`;

			if (ongoingFetchRef.current[fetchKey]) {
				console.log(
					`[useModels] Fetch already in progress for ${providerName}, skipping duplicate request`,
				);
				throw new Error(
					"A fetch operation is already in progress for this provider",
				);
			}

			ongoingFetchRef.current[fetchKey] = true;

			try {
				const endpoint = getProviderEndpoint(providerName);
				if (!endpoint) {
					throw new Error(`Unsupported provider: ${providerName}`);
				}

				// Configure endpoint and headers based on provider
				let finalEndpoint = endpoint;
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
				};

				if (providerName === "gemini") {
					// For Gemini, API key is a query parameter
					const url = new URL(endpoint);
					url.searchParams.append("key", apiKey);
					finalEndpoint = url.toString();
					// No Authorization header needed
				} else {
					// For other providers, use Authorization header
					headers.Authorization = `Bearer ${apiKey}`;
				}

				// Add cache control headers to prevent browser caching
				headers["Cache-Control"] = "no-cache, no-store, must-revalidate";

				// Make API call with timeout
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

				const response = await fetch(finalEndpoint, {
					method: "GET",
					headers,
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`API request failed: ${response.status} ${response.statusText} - ${errorText}`,
					);
				}

				// Parse response
				const data = await response.json();

				// Parse models based on provider
				return parseModelsResponse(data, providerName);
			} finally {
				// Clear the ongoing fetch flag
				delete ongoingFetchRef.current[fetchKey];
			}
			// Add dependencies for functions defined outside this useCallback but used inside
			// Assuming getProviderEndpoint and parseModelsResponse are stable or wrapped elsewhere
		},
		[getProviderEndpoint, parseModelsResponse],
	);

	/**
	 * Fetch models from the API or cache with smart background refresh
	 */
	const fetchModels = useCallback(
		async (
			providerName: string,
			apiKey: string | null | undefined,
			forceRefresh = false,
			background = false,
		): Promise<AIModel[]> => {
			console.log(
				`[useModels] Fetching models for ${providerName} (forceRefresh: ${forceRefresh}, background: ${background})`,
			);

			// Ensure apiKey is a string before proceeding. Crucial check!
			if (typeof apiKey !== "string" || !apiKey) {
				// Added !apiKey check for empty string safety
				console.warn(
					`[useModels] API key is missing or invalid for ${providerName}. Cannot fetch models.`,
				);
				setIsLoading(false);
				setIsRefreshingInBackground(false);
				setError("API key is required");
				// Ensure a promise is always returned
				return Promise.resolve([]);
			}

			// apiKey is now guaranteed to be a non-empty string here
			const validApiKey = apiKey;

			if (background) {
				setIsRefreshingInBackground(true);
			} else {
				setIsLoading(true);
			}
			setError(null);

			try {
				// 1. Check cache first (only if not forcing refresh)
				if (!forceRefresh) {
					// Pass the validated apiKey
					const cachedModels = getModelsFromCache(providerName, validApiKey);
					const cacheExpired = isCacheExpired(providerName, validApiKey);
					const cacheStale = isCacheStale(providerName, validApiKey);

					if (cachedModels && !cacheExpired) {
						console.log(`[useModels] Using cached models for ${providerName}`);
						if (providerName === provider) {
							setModels(cachedModels);
						}
						setIsLoading(false); // Stop loading if returning cached data

						if (cacheStale) {
							console.log(
								`[useModels] Cache is stale for ${providerName}, triggering background refresh.`,
							);
							const now = Date.now();
							const lastAttempt =
								lastAutoRefreshAttempt.current[providerName] || 0;
							if (now - lastAttempt > 60000) {
								lastAutoRefreshAttempt.current[providerName] = now;
								// Use await but don't block the return of cached data
								// Explicitly type caught error
								fetchModels(providerName, validApiKey, true, true).catch(
									(e: unknown) =>
										console.error(
											`[useModels] Background refresh failed for ${providerName}:`,
											e,
										),
								);
							}
						}
						return cachedModels; // Return cached data immediately
					}
				}

				// 2. Fetch from API
				console.log(
					`[useModels] Fetching fresh models for ${providerName} (${background ? "background" : "foreground"})`,
				);
				// Pass the validated apiKey
				const fetchedModels = await fetchModelsFromAPI(
					providerName,
					validApiKey,
				);

				// 3. Update cache and state
				// Pass the validated apiKey
				updateModelsCache(providerName, validApiKey, fetchedModels);
				if (providerName === provider) {
					setModels(fetchedModels);
				}
				// Pass the validated apiKey
				setVerifiedAPIKey(providerName, validApiKey, true);

				console.log(
					`[useModels] Successfully fetched models for ${providerName}`,
				);
				return fetchedModels;
			} catch (error: unknown) {
				console.error(
					`[useModels] Error fetching models for ${providerName}:`,
					error,
				);
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error during fetch";
				setError(errorMessage);

				// Mark key as unverified on fetch error
				// Pass the validated apiKey
				setVerifiedAPIKey(providerName, validApiKey, false);

				// Attempt to return stale cache data if available on error
				// Pass the validated apiKey
				const staleCache = getModelsFromCache(providerName, validApiKey);
				// Pass the validated apiKey
				if (staleCache && isCacheStale(providerName, validApiKey)) {
					console.warn(
						`[useModels] Returning stale cache for ${providerName} due to fetch error.`,
					);
					if (providerName === provider) {
						setModels(staleCache);
					}
					return staleCache;
				}

				return []; // Return empty array on error if no stale cache
			} finally {
				if (background) {
					setIsRefreshingInBackground(false);
				} else {
					setIsLoading(false);
				}
			}
		},
		// Corrected dependencies: Remove state setters, keep stable functions/values
		[
			fetchModelsFromAPI, // Now stable
			getModelsFromCache,
			isCacheExpired,
			isCacheStale,
			updateModelsCache,
			setVerifiedAPIKey,
			provider, // Hook's current provider
		],
	);

	/**
	 * Effect to fetch models automatically if autoFetch is true and provider/API key changes
	 */
	useEffect(() => {
		const apiKey = localStorage.getItem(`${provider}_api_key`);

		if (autoFetch && provider && apiKey) {
			console.log(`[useModels] Auto-fetching models for ${provider}`);
			const cached = getModelsFromCache(provider, apiKey);
			const expired = isCacheExpired(provider, apiKey);
			const stale = isCacheStale(provider, apiKey);

			if (cached && !expired) {
				setModels(cached);
				if (stale) {
					// Replace template literal with string literal
					fetchModels(provider, apiKey, true, true).catch((e: unknown) =>
						console.error("[useModels] Initial background refresh failed:", e),
					);
				}
			} else {
				// Replace template literal with string literal
				fetchModels(provider, apiKey, true, false).catch((e: unknown) =>
					console.error("[useModels] Initial fetch failed:", e),
				);
			}
		} else if (autoFetch && provider && !apiKey) {
			console.warn(
				`[useModels] Auto-fetch enabled for ${provider}, but no API key found.`,
			);
			setModels([]);
			setError("API key required for auto-fetch.");
		}
	}, [
		provider,
		autoFetch,
		fetchModels,
		getModelsFromCache,
		isCacheExpired,
		isCacheStale,
	]);

	/**
	 * Function to verify API key
	 */
	const verifyApiKey = useCallback(
		async (providerName: string, apiKey: string): Promise<boolean> => {
			if (!apiKey) return false;

			// Use the validated key from the store
			if (
				isAPIKeyVerified(providerName, apiKey) &&
				!isKeyVerificationExpired(providerName, apiKey)
			) {
				console.log(
					`[useModels] API key for ${providerName} already verified.`,
				);
				return true;
			}

			console.log(`[useModels] Verifying API key for ${providerName}...`);
			setIsLoading(true);
			setError(null);

			try {
				// Attempt to fetch models as a way to verify the key
				await fetchModelsFromAPI(providerName, apiKey);
				setVerifiedAPIKey(providerName, apiKey, true);
				console.log(
					`[useModels] API key for ${providerName} verified successfully.`,
				);
				return true;
			} catch (error) {
				console.error(
					`[useModels] API key verification failed for ${providerName}:`,
					error,
				);
				setVerifiedAPIKey(providerName, apiKey, false);
				setError(
					error instanceof Error
						? error.message
						: "API key verification failed",
				);
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[
			fetchModelsFromAPI, // Now stable
			isAPIKeyVerified,
			isKeyVerificationExpired,
			setVerifiedAPIKey,
		],
	);

	/**
	 * Function to clear cache
	 */
	const clearCache = useCallback(
		(providerName?: string, apiKey?: string) => {
			clearModelsCache(providerName, apiKey);
			console.log(
				`[useModels] Cache cleared for ${providerName || "all providers"}`,
			);
			if (providerName === provider || !providerName) {
				setModels([]); // Clear current models if relevant cache was cleared
			}
		},
		// Corrected dependencies: Remove state setter
		[clearModelsCache, provider], // Removed setModels
	);

	// Final return statement for the hook
	return {
		models,
		isLoading,
		isRefreshingInBackground,
		error,
		fetchModels: (p: string, key: string) => fetchModels(p, key, true, false),
		verifyApiKey,
		clearCache,
		isCacheExpired,
		isCacheStale,
		getLastCacheUpdate,
		getCacheExpiryTime,
		isKeyVerificationExpired,
	};
}
