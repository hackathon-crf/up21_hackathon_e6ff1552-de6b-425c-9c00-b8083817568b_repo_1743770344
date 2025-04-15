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
		isAPIKeyVerified,
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

	const getProviderEndpoint = (providerName: string): string => {
		const endpoints: Record<string, string> = {
			openai: "https://api.openai.com/v1/models",
			mistral: "https://api.mistral.ai/v1/models",
			anthropic: "https://api.anthropic.com/v1/models",
			gemini: "https://generativelanguage.googleapis.com/v1beta/models",
			openrouter: "https://openrouter.ai/api/v1/models",
		};

		return endpoints[providerName] || "";
	};

	const parseModelsResponse = (data: any, providerName: string): AIModel[] => {
		let parsedModels: AIModel[] = [];

		try {
			switch (providerName) {
				case "openai":
					parsedModels = data.data.map((model: any) => ({
						id: model.id,
						name: model.id
							.split("-")
							.map(
								(word: string) => word.charAt(0).toUpperCase() + word.slice(1),
							)
							.join(" "),
						contextLength: model.context_window || 4096,
					}));
					break;
				case "mistral":
					parsedModels = data.data.map((model: any) => ({
						id: model.id,
						name: model.id
							.split("-")
							.map(
								(word: string) => word.charAt(0).toUpperCase() + word.slice(1),
							)
							.join(" "),
						contextLength: model.context_window || 8192,
					}));
					break;
				case "anthropic":
					parsedModels = (data.models || []).map((model: any) => ({
						id: model.id,
						name: model.name || model.id,
						contextLength: model.context_window || 100000,
					}));
					break;
				case "gemini":
					parsedModels = (data.models || []).map((model: any) => ({
						id: model.name.split("/").pop() || model.name,
						name: model.displayName || model.name,
						contextLength: model.inputTokenLimit || 32000,
					}));
					break;
				case "openrouter":
					parsedModels = (data.data || []).map((model: any) => ({
						id: model.id,
						name: model.name || model.id,
						contextLength: model.context_length || 4096,
					}));
					break;
				default:
					throw new Error(`Unknown provider: ${providerName}`);
			}
		} catch (e) {
			console.error(`Error parsing models for ${providerName}:`, e);
			throw new Error(
				`Failed to parse models: ${e instanceof Error ? e.message : "Unknown error"}`,
			);
		}

		return parsedModels;
	};

	const fetchModelsFromAPI = async (
		providerName: string,
		apiKey: string,
	): Promise<AIModel[]> => {
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
			// headers['Pragma'] = 'no-cache'; // Removed Pragma header causing CORS issue with Mistral

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
	};

	/**
	 * Fetch models from the API or cache with smart background refresh
	 */
	const fetchModels = useCallback(
		async (
			providerName: string,
			apiKey: string,
			options: { forceRefresh?: boolean; background?: boolean } = {},
		): Promise<AIModel[]> => {
			const { forceRefresh = false, background = false } = options;

			// Set loading state only for foreground operations
			if (!background) {
				setIsLoading(true);
				setError(null);
			} else {
				setIsRefreshingInBackground(true);
			}

			try {
				// Check if we have cached models
				const cachedModels = getModelsFromCache(providerName, apiKey);
				const cacheExpired = isCacheExpired(providerName, apiKey);
				const cacheStale = isCacheStale(providerName, apiKey);

				// Use cache if:
				// 1. We have cached models AND
				// 2. Cache is not expired OR cache is stale but this isn't a forced refresh AND
				// 3. This isn't a forced refresh operation
				if (
					cachedModels &&
					(!cacheExpired || (cacheStale && !forceRefresh)) &&
					!forceRefresh
				) {
					console.log(
						`[useModels] Using ${cacheExpired ? "stale" : "valid"} cached models for ${providerName}`,
					);

					// Update UI with cached models
					if (!background || models.length === 0) {
						setModels(cachedModels);
					}

					// If cache is stale (in grace period), trigger a background refresh
					// But only if we haven't attempted one recently
					const now = Date.now();
					const lastAttempt = lastAutoRefreshAttempt.current[providerName] || 0;
					const timeSinceLastAttempt = now - lastAttempt;

					// Only auto-refresh if more than 10 minutes since last attempt
					if (
						cacheStale &&
						timeSinceLastAttempt > 10 * 60 * 1000 &&
						!background
					) {
						console.log(
							`[useModels] Cache is stale, triggering background refresh for ${providerName}`,
						);
						lastAutoRefreshAttempt.current[providerName] = now;

						// Fire and forget - don't await this
						fetchModels(providerName, apiKey, {
							forceRefresh: true,
							background: true,
						}).catch((e) =>
							console.log(
								`[useModels] Background refresh failed: ${e.message}`,
							),
						);
					}

					return cachedModels;
				}

				// No valid cache or force refresh, fetch from API
				console.log(
					`[useModels] Fetching fresh models for ${providerName} (${background ? "background" : "foreground"})`,
				);
				const fetchedModels = await fetchModelsFromAPI(providerName, apiKey);

				// Update cache and state
				updateModelsCache(providerName, apiKey, fetchedModels);

				// Only update the UI state if this isn't a background operation
				// or if there are no models currently displayed
				if (!background || models.length === 0) {
					setModels(fetchedModels);
				}

				// Mark API key as verified
				setVerifiedAPIKey(providerName, apiKey, true);

				return fetchedModels;
			} catch (e) {
				const errorMsg =
					e instanceof Error ? e.message : "Unknown error fetching models";

				// Only show errors for foreground operations
				if (!background) {
					console.error(
						`[useModels] Error fetching models for ${providerName}:`,
						e,
					);
					setError(errorMsg);

					// Mark API key as invalid if this was an API request error
					if (e instanceof Error && e.message.includes("API request failed")) {
						setVerifiedAPIKey(providerName, apiKey, false);
					}
				} else {
					console.log(`[useModels] Background refresh error: ${errorMsg}`);
				}

				// Return current models if available, empty array otherwise
				return models.length > 0 ? models : [];
			} finally {
				// Clear loading states
				if (!background) {
					setIsLoading(false);
				} else {
					setIsRefreshingInBackground(false);
				}
			}
		},
		[
			getModelsFromCache,
			isCacheExpired,
			isCacheStale,
			updateModelsCache,
			setVerifiedAPIKey,
			models,
		],
	);

	/**
	 * Verify API key by attempting to fetch models
	 * With optimization to avoid re-verification if the key is already verified
	 */
	const verifyApiKey = useCallback(
		async (providerName: string, apiKey: string): Promise<boolean> => {
			// If the key is already verified and verification is still valid, return immediately
			// This is a significant optimization to prevent unnecessary API calls
			if (isAPIKeyVerified(providerName, apiKey)) {
				console.log(
					`[useModels] API key already verified for ${providerName}, skipping verification`,
				);
				return true;
			}

			try {
				// Check if verification is expired but we have cached models
				const keyVerificationExpired = isKeyVerificationExpired(
					providerName,
					apiKey,
				);
				const cachedModels = getModelsFromCache(providerName, apiKey);

				if (keyVerificationExpired && cachedModels) {
					// If we have models in cache but verification expired,
					// consider the key valid but trigger background refresh
					setVerifiedAPIKey(providerName, apiKey, true);

					// Trigger a background refresh
					fetchModels(providerName, apiKey, {
						forceRefresh: true,
						background: true,
					}).catch((e) =>
						console.log(
							`[useModels] Background verification refresh failed: ${e.message}`,
						),
					);

					return true;
				}

				// If no cached models or verification is needed,
				// try to fetch models as verification
				const fetchedModels = await fetchModels(providerName, apiKey, {
					forceRefresh: true,
				});
				return fetchedModels.length > 0;
			} catch (e) {
				console.error(
					`[useModels] API key verification failed for ${providerName}:`,
					e,
				);
				return false;
			}
		},
		[
			fetchModels,
			isAPIKeyVerified,
			isKeyVerificationExpired,
			getModelsFromCache,
			setVerifiedAPIKey,
		],
	);

	// Auto fetch models when provider changes if autoFetch is true
	useEffect(() => {
		if (autoFetch) {
			// In a real implementation, we would get the API key from somewhere secure
			// This is just a placeholder - you should replace this with your actual API key retrieval logic
			const apiKey = localStorage.getItem(`${provider}_api_key`);

			if (apiKey) {
				fetchModels(provider, apiKey).catch(console.error);
			}
		}
	}, [provider, autoFetch, fetchModels]);

	return {
		models,
		isLoading,
		isRefreshingInBackground,
		error,
		fetchModels: (provider, apiKey) => fetchModels(provider, apiKey, {}),
		verifyApiKey,
		clearCache: clearModelsCache,
		isCacheExpired,
		isCacheStale,
		getLastCacheUpdate,
		getCacheExpiryTime,
		isKeyVerificationExpired,
	};
}
