"use client";

import {
	ArrowLeft,
	Book,
	Brain,
	Check,
	ChevronRight,
	Database,
	Download,
	Eye,
	EyeOff,
	FileText,
	Globe,
	HardDrive,
	Info,
	Key,
	Lock,
	MessageSquare,
	Plus,
	RefreshCw,
	Save,
	Settings,
	Sparkles,
	Trash2,
	Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useModels } from "~/hooks/use-models";
import { api } from "~/trpc/react";
import { useSettingsStore } from "../../../stores/settings";
import type { PromptTemplate } from "../../../stores/settings";

import { motion } from "framer-motion";
import { DashboardHeader } from "~/components/dashboard-header";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useToast } from "~/hooks/use-toast";

export default function AIAssistantSettingsPage() {
	const router = useRouter();
	const { toast } = useToast();

	// Get settings from Zustand store
	const {
		provider,
		model,
		temperature,
		maxTokens,
		systemPrompt, // Renamed from defaultPrompt
		streamingSystemPrompt,
		chatRouterSystemPrompt,
		promptPrefix,
		promptSuffix,
		promptTemplates,
		ragEnabled,
		chunkSize,
		similarityThreshold,
		streamingEnabled,
		darkMode,
		citationsEnabled,
		historyRetentionDays,
		cacheTimeToLive,

		// Actions
		setProvider,
		setModel,
		setTemperature,
		setMaxTokens,
		setSystemPrompt, // Renamed from setDefaultPrompt
		setStreamingSystemPrompt,
		setChatRouterSystemPrompt,
		setPromptPrefix,
		setPromptSuffix,
		addPromptTemplate,
		deletePromptTemplate,
		setRagEnabled,
		setChunkSize,
		setSimilarityThreshold,
		setStreamingEnabled,
		setDarkMode,
		setCitationsEnabled,
		setHistoryRetentionDays,
		setCacheTimeToLive,
	} = useSettingsStore();

	// UI State and non-persisted state
	const [selectedProvider, setSelectedProvider] = useState<string>(() => {
		return provider || "openai";
	});
	const [availableModels, setAvailableModels] = useState<
		Array<{ id: string; name: string; contextLength?: number }>
	>([]);
	const [selectedModel, setSelectedModel] = useState<string>(() => {
		return model || "gpt-4o";
	});
	const [apiKey, setApiKey] = useState("");
	const [showApiKey, setShowApiKey] = useState(false);
	const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
	// Track which provider+key combinations we've already loaded models for
	const [loadedProviderKeys, setLoadedProviderKeys] = useState<
		Record<string, boolean>
	>({});

	// Get cached API key from localStorage
	useEffect(() => {
		const storedKey = localStorage.getItem(`${selectedProvider}_api_key`);
		if (storedKey) {
			setApiKey(storedKey);
		} else {
			setApiKey("");
		}
	}, [selectedProvider]);

	// Use our enhanced models hook
	const {
		models,
		isLoading: isLoadingModels,
		isRefreshingInBackground,
		error,
		fetchModels,
		verifyApiKey,
		clearCache,
		isCacheExpired,
		isCacheStale,
		getLastCacheUpdate,
		getCacheExpiryTime,
	} = useModels(selectedProvider, {
		// Don't auto fetch - we'll do this manually
		autoFetch: false,
		cacheTimeToLive: cacheTimeToLive,
	});

	// Update available models when the hook's models change
	useEffect(() => {
		if (models.length > 0) {
			setAvailableModels(models);

			// Auto-select first model if current selection isn't available
			const modelExists = models.some((m) => m.id === selectedModel);
			if (!modelExists && models[0] && typeof models[0].id === "string") {
				setSelectedModel(models[0].id);
				setModel(models[0].id);
			}
		}
	}, [models, selectedModel, setModel]);

	// Ref to track if fetch is in progress and prevent unnecessary re-fetches
	const fetchInProgressRef = useRef(false);

	// Ref to track which provider+key combination we've already fetched
	const lastFetchRef = useRef<{ provider: string; key: string } | null>(null);

	// State to track which provider+key combinations we've already loaded
	const [loadedCombinations, setLoadedCombinations] = useState<{
		[key: string]: boolean;
	}>({});

	// Load cached models on initial load if API key exists - with strict control to prevent loops
	useEffect(() => {
		// Create a unique key for this provider+key combination
		const combinationKey = `${selectedProvider}:${apiKey}`;

		// Skip if no API key, fetch in progress, or we've already loaded this combination
		if (
			!apiKey ||
			fetchInProgressRef.current ||
			loadedCombinations[combinationKey]
		) {
			return;
		}

		// Mark fetch as in progress
		fetchInProgressRef.current = true;

		console.log(`[settings] Initial fetch for ${combinationKey}`);

		// Use a stable timeout to prevent rapid succession of API calls
		const timeoutId = setTimeout(() => {
			fetchModels(selectedProvider, apiKey)
				.then((fetchedModels) => {
					console.log(
						`[settings] Loaded ${fetchedModels.length} models for ${selectedProvider}`,
					);
					// Mark this combination as loaded to prevent future fetches
					setLoadedCombinations((prev) => ({
						...prev,
						[combinationKey]: true,
					}));
					fetchInProgressRef.current = false;
				})
				.catch((err) => {
					console.error("[settings] Failed to load models:", err);
					setApiErrorMessage(err.message || "Failed to load models");
					fetchInProgressRef.current = false;
				});
		}, 300);

		// Cleanup function to prevent memory leaks
		return () => {
			clearTimeout(timeoutId);
			fetchInProgressRef.current = false;
		};
	}, [apiKey, fetchModels, selectedProvider, loadedCombinations]);

	const [newPromptName, setNewPromptName] = useState("");
	const [newPromptContent, setNewPromptContent] = useState("");

	// Data sources state (not in Zustand store)
	const [dataSources, setDataSources] = useState([
		{ id: 1, name: "Red Cross First Aid Manual", type: "pdf", enabled: true },
		{
			id: 2,
			name: "Emergency Response Guidelines",
			type: "pdf",
			enabled: true,
		},
		{ id: 3, name: "CPR & AED Training Materials", type: "pdf", enabled: true },
	]);
	const [newDataSource, setNewDataSource] = useState("");
	const [newDataSourceType, setNewDataSourceType] = useState("pdf");

	// UI state for other features not in Zustand store
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [autoSaveHistory, setAutoSaveHistory] = useState(true);

	// Cache UI state
	const [cacheTTLDays, setCacheTTLDays] = useState(
		() => Math.floor(cacheTimeToLive / (24 * 60 * 60 * 1000)) || 1,
	);

	// Only fetch provider list automatically
	const { data: providers } = api.ai.getProviders.useQuery();

	// Check if API key is provided
	const hasApiKey = useMemo(() => apiKey.trim().length > 0, [apiKey]);

	// Get cache status information for UI
	const cacheInfo = useMemo(() => {
		if (!hasApiKey) return null;

		const lastUpdate = getLastCacheUpdate(selectedProvider, apiKey);
		const expiryTime = getCacheExpiryTime(selectedProvider, apiKey);
		const isExpired = isCacheExpired(selectedProvider, apiKey);
		const isStale = isCacheStale(selectedProvider, apiKey);

		return {
			lastUpdate,
			expiryTime,
			isExpired,
			isStale,
			status: isExpired
				? "expired"
				: isStale
					? "stale"
					: lastUpdate
						? "valid"
						: "none",
		};
	}, [
		selectedProvider,
		apiKey,
		getLastCacheUpdate,
		getCacheExpiryTime,
		isCacheExpired,
		isCacheStale,
		hasApiKey,
	]);

	return (
		<div className="flex h-screen flex-col bg-gradient-to-b from-background to-background/80">
			<DashboardHeader
				title="AI Assistant Settings"
				description="Configure your AI assistant's behavior and capabilities"
				className="flex-none"
			/>

			<main className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="mx-auto max-w-5xl space-y-6">
					<div className="flex items-center justify-between">
						<Button variant="ghost" size="sm" asChild className="group mb-4">
							<Link href="/chat">
								<ArrowLeft className="group-hover:-translate-x-1 mr-2 h-4 w-4 transition-transform" />
								Back to Chat
							</Link>
						</Button>

						<div className="flex gap-2">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="outline"
										className="transition-all hover:bg-destructive/10"
									>
										Reset to Defaults
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent className="border-2">
									<AlertDialogHeader>
										<AlertDialogTitle>Reset all settings?</AlertDialogTitle>
										<AlertDialogDescription>
											This will reset all AI Assistant settings to their default
											values. This action cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => {
												setProvider("openai");
												setModel("gpt-4o");
												setTemperature(0.7);
												setMaxTokens(4000);
												setSystemPrompt(
													"You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately.",
												);
												setStreamingSystemPrompt("");
												setChatRouterSystemPrompt("");
												setPromptPrefix("");
												setPromptSuffix(
													"Please provide reliable information based on official Red Cross guidelines.",
												);
												setRagEnabled(true);
												setChunkSize(1000);
												setSimilarityThreshold(0.75);
												setStreamingEnabled(true);
												setDarkMode(false);
												setCitationsEnabled(true);
												setHistoryRetentionDays(30);
												setCacheTimeToLive(24 * 60 * 60 * 1000); // 24 hours

												toast({
													title: "Settings reset",
													description:
														"All settings have been reset to their default values.",
												});
											}}
											className="bg-destructive text-destructive-foreground"
										>
											Reset
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>

							<Button
								onClick={() => {
									toast({
										title: "Settings saved",
										description:
											"Your AI Assistant settings have been updated successfully.",
									});
								}}
								className="group relative overflow-hidden"
							>
								<span className="relative z-10 flex items-center">
									<Save className="mr-2 h-4 w-4" />
									Save Settings
								</span>
								<span className="absolute inset-0 origin-left scale-x-0 transform bg-primary-foreground/10 transition-transform group-hover:scale-x-100" />
							</Button>
						</div>
					</div>

					<Tabs defaultValue="model" className="space-y-4">
						<TabsList className="grid grid-cols-2 bg-muted/50 p-1 backdrop-blur-sm md:grid-cols-4">
							<TabsTrigger
								value="model"
								className="flex items-center gap-2 data-[state=active]:bg-background"
							>
								<Brain className="h-4 w-4" />
								<span className="hidden md:inline">Model Settings</span>
								<span className="md:hidden">Model</span>
							</TabsTrigger>
							<TabsTrigger
								value="prompt"
								className="flex items-center gap-2 data-[state=active]:bg-background"
							>
								<MessageSquare className="h-4 w-4" />
								<span className="hidden md:inline">Prompt Settings</span>
								<span className="md:hidden">Prompt</span>
							</TabsTrigger>
							<TabsTrigger
								value="rag"
								className="flex items-center gap-2 data-[state=active]:bg-background"
							>
								<Database className="h-4 w-4" />
								<span className="hidden md:inline">RAG Settings</span>
								<span className="md:hidden">RAG</span>
							</TabsTrigger>
							<TabsTrigger
								value="other"
								className="flex items-center gap-2 data-[state=active]:bg-background"
							>
								<Settings className="h-4 w-4" />
								<span className="hidden md:inline">Other Settings</span>
								<span className="md:hidden">Other</span>
							</TabsTrigger>
						</TabsList>

						{/* Model Settings Tab */}
						<TabsContent value="model" className="space-y-4">
							<Card className="overflow-hidden border-2 shadow-md">
								<CardHeader className="border-b bg-card/50 backdrop-blur-sm">
									<CardTitle className="flex items-center gap-2">
										<Sparkles className="h-5 w-5 text-primary" />
										AI Model Configuration
									</CardTitle>
									<CardDescription>
										Select the AI model and adjust parameters to control the
										assistant's behavior
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6 p-6">
									<div className="space-y-6">
										<div className="space-y-2">
											<Label
												htmlFor="provider-select"
												className="font-medium text-base"
											>
												Model Provider
											</Label>
											<Select
												value={selectedProvider}
												onValueChange={(value) => {
													setSelectedProvider(value);
													setProvider(value);

													// Clear available models until verified
													setAvailableModels([]);
													setApiErrorMessage(null);

													// Try to load the API key for the selected provider
													const storedKey = localStorage.getItem(
														`${value}_api_key`,
													);
													if (storedKey) {
														setApiKey(storedKey);
													} else {
														setApiKey("");
													}
												}}
											>
												<SelectTrigger
													id="provider-select"
													className="h-11 border-2"
												>
													<SelectValue placeholder="Select a provider" />
												</SelectTrigger>
												<SelectContent>
													{providers?.map((provider) => (
														<SelectItem key={provider.id} value={provider.id}>
															{provider.name}
														</SelectItem>
													)) || (
														<>
															<SelectItem value="openai">OpenAI</SelectItem>
															<SelectItem value="mistral">Mistral</SelectItem>
															<SelectItem value="anthropic">
																Anthropic
															</SelectItem>
															<SelectItem value="gemini">Gemini</SelectItem>
															<SelectItem value="openrouter">
																OpenRouter
															</SelectItem>
														</>
													)}
												</SelectContent>
											</Select>
											<p className="mt-1 text-muted-foreground text-sm">
												Choose your AI provider. Each offers different models
												with varying capabilities and pricing.
											</p>
										</div>

										<div className="space-y-2">
											<Label
												htmlFor="api-key"
												className="flex items-center gap-2 font-medium text-base"
											>
												<Key className="h-4 w-4" />
												{selectedProvider.charAt(0).toUpperCase() +
													selectedProvider.slice(1)}{" "}
												API Key
											</Label>
											<div className="flex flex-col gap-2 sm:flex-row">
												<div className="relative flex-1">
													<Input
														id="api-key"
														type={showApiKey ? "text" : "password"}
														placeholder={`Enter your ${selectedProvider} API key`}
														value={apiKey}
														onChange={(e) => setApiKey(e.target.value)}
														className="h-11 border-2 pr-12"
													/>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="absolute top-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
														onClick={() => setShowApiKey(!showApiKey)}
													>
														{showApiKey ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
														<span className="sr-only">
															{showApiKey ? "Hide API key" : "Show API key"}
														</span>
													</Button>
												</div>
												<Button
													variant="outline"
													className="h-11 w-full border-2 hover:bg-muted/50 sm:w-auto"
													onClick={async () => {
														if (!apiKey.trim()) {
															toast({
																title: "Error",
																description: "Please enter an API key first",
																variant: "destructive",
															});
															return;
														}

														// Show loading state
														toast({
															title: "Verifying API key",
															description: `Checking your ${selectedProvider} API key...`,
														});

														// Set loading state
														setApiErrorMessage(null);

														try {
															// Use the verifyApiKey function from our hook
															const isValid = await verifyApiKey(
																selectedProvider,
																apiKey,
															);

															if (isValid) {
																// Save valid API key
																localStorage.setItem(
																	`${selectedProvider}_api_key`,
																	apiKey,
																);

																// Fetch models to display
																const fetchedModels = await fetchModels(
																	selectedProvider,
																	apiKey,
																);

																// Update the UI with models
																setAvailableModels(fetchedModels);

																// Select the first model if available
																if (
																	fetchedModels.length > 0 &&
																	fetchedModels[0]
																) {
																	setSelectedModel(fetchedModels[0].id);
																	setModel(fetchedModels[0].id);
																}

																// Show success message
																toast({
																	title: "API key verified",
																	description: `Your ${selectedProvider} API key verified successfully. ${fetchedModels.length} models available.`,
																	variant: "default",
																});
															} else {
																throw new Error(
																	"Invalid API key. Please check and try again.",
																);
															}
														} catch (error) {
															// Handle the error
															console.error("API verification error:", error);

															// Show error message to user
															toast({
																title: "Verification failed",
																description: `Could not verify the API key: ${
																	error instanceof Error
																		? error.message
																		: "Unknown error"
																}`,
																variant: "destructive",
															});

															setApiErrorMessage(
																error instanceof Error
																	? error.message
																	: "Unknown error",
															);
														}
													}}
													disabled={!apiKey.trim()}
												>
													Verify
												</Button>
											</div>
											<p className="mt-1 text-muted-foreground text-sm">
												Your {selectedProvider} API key is required to use{" "}
												{selectedProvider} models. Keys are stored locally in
												your browser.
											</p>

											{/* Display cache status if available */}
											{cacheInfo && cacheInfo.status !== "none" && (
												<div
													className={`mt-2 rounded-md border px-3 py-2 text-sm ${
														cacheInfo.status === "valid"
															? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
															: cacheInfo.status === "stale"
																? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
																: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
													}`}
												>
													<div className="flex items-center justify-between">
														<span>
															Model list cache:{" "}
															<strong>
																{cacheInfo.status === "valid"
																	? "Valid"
																	: cacheInfo.status === "stale"
																		? "Stale"
																		: "Expired"}
															</strong>
														</span>
														<Button
															variant="ghost"
															size="sm"
															className="h-6 p-1"
															onClick={() => {
																if (!apiKey) return;
																clearCache(selectedProvider, apiKey);
																toast({
																	title: "Cache cleared",
																	description: `Model cache for ${selectedProvider} has been cleared.`,
																});
															}}
														>
															<RefreshCw className="mr-1 h-3 w-3" />
															<span className="text-xs">Refresh</span>
														</Button>
													</div>
													{cacheInfo.lastUpdate && (
														<div className="mt-1 text-xs">
															Last updated:{" "}
															{cacheInfo.lastUpdate.toLocaleString()}
														</div>
													)}
													{cacheInfo.expiryTime && (
														<div className="mt-0.5 text-xs">
															Expires: {cacheInfo.expiryTime.toLocaleString()}
														</div>
													)}
												</div>
											)}
										</div>

										<div className="space-y-2">
											<Label
												htmlFor="model-select"
												className="font-medium text-base"
											>
												AI Model
											</Label>
											<Select
												value={selectedModel}
												onValueChange={(value) => {
													setSelectedModel(value);
													setModel(value);
												}}
												disabled={
													isLoadingModels || availableModels.length === 0
												}
											>
												<SelectTrigger
													id="model-select"
													className="h-11 border-2"
												>
													{isLoadingModels ? (
														<span className="text-muted-foreground">
															Loading models...
														</span>
													) : (
														<SelectValue placeholder="Select a model" />
													)}
												</SelectTrigger>
												<SelectContent>
													{isLoadingModels ? (
														<SelectItem value="loading" disabled>
															Loading models...
														</SelectItem>
													) : apiErrorMessage ? (
														<SelectItem value="error" disabled>
															<div className="text-destructive">
																Error: {apiErrorMessage}
															</div>
														</SelectItem>
													) : availableModels.length > 0 ? (
														availableModels.map((model) => (
															<SelectItem key={model.id} value={model.id}>
																<div className="flex items-center gap-2">
																	<span>{model.name}</span>
																	{model.id === "gpt-4o" && (
																		<Badge className="ml-2 bg-primary/20 text-primary hover:bg-primary/30">
																			Recommended
																		</Badge>
																	)}
																</div>
															</SelectItem>
														))
													) : (
														<SelectItem value="no-models" disabled>
															API verification required to load models
														</SelectItem>
													)}
												</SelectContent>
											</Select>
											{apiErrorMessage ? (
												<p className="mt-1 font-medium text-destructive text-sm">
													Error: {apiErrorMessage}
												</p>
											) : (
												<p className="mt-1 text-muted-foreground text-sm">
													The AI model determines the quality, capabilities, and
													cost of responses
												</p>
											)}
										</div>
									</div>

									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label
												htmlFor="temperature-slider"
												className="font-medium text-base"
											>
												Temperature: {temperature}
											</Label>
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6"
														>
															<Info className="h-4 w-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent className="max-w-xs">
														<p>
															Controls randomness: Lower values (0.1-0.5) for
															more focused, deterministic responses. Higher
															values (0.7-1.0) for more creative, varied
															responses.
														</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
										<Slider
											id="temperature-slider"
											min={0}
											max={2}
											step={0.1}
											value={[temperature]}
											onValueChange={(value) => {
												if (value[0] !== undefined) {
													setTemperature(value[0]);
												}
											}}
											className="py-2"
										/>
										<div className="flex justify-between text-muted-foreground text-xs">
											<span>Precise (0)</span>
											<span>Balanced (1)</span>
											<span>Creative (2)</span>
										</div>
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="max-tokens"
											className="font-medium text-base"
										>
											Maximum Output Length
										</Label>
										<div className="flex flex-col gap-2 sm:flex-row">
											<Input
												id="max-tokens"
												type="number"
												min={100}
												max={32000}
												value={maxTokens}
												onChange={(e) => {
													const value = Number.parseInt(e.target.value);
													setMaxTokens(Number.isNaN(value) ? 4000 : value);
												}}
												className="h-11 w-full border-2"
											/>
											<Select
												value={maxTokens.toString()}
												onValueChange={(value) => {
													const parsed = Number.parseInt(value);
													setMaxTokens(
														Number.isNaN(parsed) ? maxTokens : parsed,
													);
												}}
											>
												<SelectTrigger className="h-11 border-2">
													<SelectValue placeholder="Preset lengths" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="1000">Short (1,000)</SelectItem>
													<SelectItem value="4000">Medium (4,000)</SelectItem>
													<SelectItem value="8000">Long (8,000)</SelectItem>
													<SelectItem value="16000">
														Very Long (16,000)
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<p className="mt-1 text-muted-foreground text-sm">
											Maximum number of tokens (words/characters) in the AI's
											response
										</p>
									</div>

									<Accordion type="single" collapsible className="w-full">
										<AccordionItem
											value="advanced"
											className="rounded-md border-2"
										>
											<AccordionTrigger className="rounded-t-md px-4 py-3 hover:bg-muted/50">
												Advanced Model Settings
											</AccordionTrigger>
											<AccordionContent className="space-y-4 px-4 py-3">
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<Label htmlFor="cache-ttl">
															Cache Time-to-Live (Days)
														</Label>
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-6 w-6"
																	>
																		<Info className="h-4 w-4" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p className="max-w-xs">
																		How long to cache model lists before
																		requiring a refresh. Longer values reduce
																		API calls but may miss new models.
																	</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													</div>
													<div className="flex items-center gap-2">
														<Input
															id="cache-ttl"
															type="number"
															min={1}
															max={30}
															value={cacheTTLDays}
															onChange={(e) => {
																const value = Number.parseInt(e.target.value);
																if (!Number.isNaN(value) && value > 0) {
																	setCacheTTLDays(value);
																	// Convert days to milliseconds
																	setCacheTimeToLive(
																		value * 24 * 60 * 60 * 1000,
																	);
																}
															}}
															className="h-11 w-full border-2"
														/>
														<Button
															variant="outline"
															onClick={() => {
																// Clear all model caches
																clearCache();
																toast({
																	title: "Cache cleared",
																	description:
																		"All model caches have been cleared.",
																});
															}}
															className="h-11 border-2"
														>
															<RefreshCw className="mr-2 h-4 w-4" />
															Clear All Caches
														</Button>
													</div>
												</div>

												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<Label htmlFor="top-p-slider">Top P: 0.95</Label>
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-6 w-6"
																	>
																		<Info className="h-4 w-4" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p className="max-w-xs">
																		Controls diversity via nucleus sampling:
																		Only consider tokens with the top P
																		probability mass.
																	</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													</div>
													<Slider
														id="top-p-slider"
														min={0.1}
														max={1}
														step={0.05}
														defaultValue={[0.95]}
														className="py-2"
													/>
												</div>

												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<Label htmlFor="frequency-penalty-slider">
															Frequency Penalty: 0.0
														</Label>
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-6 w-6"
																	>
																		<Info className="h-4 w-4" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p className="max-w-xs">
																		Reduces repetition by penalizing tokens that
																		have already appeared in the text.
																	</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													</div>
													<Slider
														id="frequency-penalty-slider"
														min={-2}
														max={2}
														step={0.1}
														defaultValue={[0]}
														className="py-2"
													/>
												</div>

												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<Label htmlFor="presence-penalty-slider">
															Presence Penalty: 0.0
														</Label>
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-6 w-6"
																	>
																		<Info className="h-4 w-4" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	<p className="max-w-xs">
																		Encourages the model to talk about new
																		topics by penalizing tokens that have
																		appeared at all.
																	</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													</div>
													<Slider
														id="presence-penalty-slider"
														min={-2}
														max={2}
														step={0.1}
														defaultValue={[0]}
														className="py-2"
													/>
												</div>
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Prompt Settings Tab */}
						<TabsContent value="prompt" className="space-y-4">
							<Card className="overflow-hidden border-2 shadow-md">
								<CardHeader className="border-b bg-card/50 backdrop-blur-sm">
									<CardTitle className="flex items-center gap-2">
										<MessageSquare className="h-5 w-5 text-primary" />
										Prompt Configuration
									</CardTitle>
									<CardDescription>
										Customize how the AI assistant interprets and responds to
										queries
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6 p-6">
									<div className="space-y-2">
										<Label
											htmlFor="system-prompt"
											className="font-medium text-base"
										>
											System Prompt
										</Label>
										<Textarea
											id="system-prompt"
											placeholder="Enter the system prompt that defines your AI assistant's behavior"
											value={systemPrompt}
											onChange={(e) => setSystemPrompt(e.target.value)}
											className="min-h-[150px] resize-y border-2"
										/>
										<p className="mt-1 text-muted-foreground text-sm">
											The system prompt defines the AI's personality, knowledge
											base, and behavior. This prompt will be used for all
											interactions with the AI assistant.
										</p>
										<div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
											<div className="flex gap-2">
												<Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
												<div>
													<h4 className="font-medium text-amber-800 dark:text-amber-300">
														System Prompt Tips
													</h4>
													<ul className="mt-1 list-inside list-disc space-y-1 text-amber-700 text-sm dark:text-amber-400">
														<li>
															Be specific about the AI's role, knowledge domain,
															and tone
														</li>
														<li>
															Include any specific guidelines or constraints for
															responses
														</li>
														<li>
															Specify the format you want responses in if
															applicable
														</li>
													</ul>
												</div>
											</div>
										</div>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label
												htmlFor="prompt-prefix"
												className="font-medium text-base"
											>
												Prompt Prefix
											</Label>
											<Input
												id="prompt-prefix"
												placeholder="Text to add before each user prompt"
												value={promptPrefix}
												onChange={(e) => setPromptPrefix(e.target.value)}
												className="h-11 border-2"
											/>
											<p className="mt-1 text-muted-foreground text-sm">
												Added before each user message
											</p>
										</div>
										<div className="space-y-2">
											<Label
												htmlFor="prompt-suffix"
												className="font-medium text-base"
											>
												Prompt Suffix
											</Label>
											<Input
												id="prompt-suffix"
												placeholder="Text to add after each user prompt"
												value={promptSuffix}
												onChange={(e) => setPromptSuffix(e.target.value)}
												className="h-11 border-2"
											/>
											<p className="mt-1 text-muted-foreground text-sm">
												Added after each user message
											</p>
										</div>
									</div>

									<Separator className="my-2" />

									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="font-medium text-lg">
												Saved Prompt Templates
											</h3>
											<Badge variant="outline" className="border-2">
												{promptTemplates.length} Templates
											</Badge>
										</div>

										<div className="space-y-4">
											{promptTemplates.map((prompt: PromptTemplate) => (
												<motion.div
													key={prompt.id}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ duration: 0.2 }}
													className="flex items-start justify-between rounded-md border-2 p-4 transition-colors hover:bg-muted/30"
												>
													<div className="space-y-1">
														<h4 className="font-medium">{prompt.name}</h4>
														<p className="line-clamp-2 text-muted-foreground text-sm">
															{prompt.prompt}
														</p>
													</div>
													<div className="flex gap-2">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
															onClick={() => {
																setSystemPrompt(prompt.prompt);
																toast({
																	title: "Prompt applied",
																	description: `"${prompt.name}" has been set as the default prompt.`,
																});
															}}
														>
															<Check className="h-4 w-4" />
															<span className="sr-only">Use Prompt</span>
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
															onClick={() => deletePromptTemplate(prompt.id)}
														>
															<Trash2 className="h-4 w-4" />
															<span className="sr-only">Delete Prompt</span>
														</Button>
													</div>
												</motion.div>
											))}
										</div>

										<div className="space-y-2 rounded-md border-2 bg-card/50 p-4">
											<h4 className="font-medium">Add New Prompt Template</h4>
											<div className="space-y-2">
												<Input
													placeholder="Template Name"
													value={newPromptName}
													onChange={(e) => setNewPromptName(e.target.value)}
													className="h-11 border-2"
												/>
												<Textarea
													placeholder="Prompt Content"
													value={newPromptContent}
													onChange={(e) => setNewPromptContent(e.target.value)}
													className="min-h-[80px] resize-y border-2"
												/>
												<Button
													onClick={() => {
														const newPrompt = {
															id: Date.now(),
															name: newPromptName,
															prompt: newPromptContent,
														};

														addPromptTemplate(newPrompt);
														setNewPromptName("");
														setNewPromptContent("");

														toast({
															title: "Prompt saved",
															description:
																"Your prompt template has been saved successfully.",
														});
													}}
													className="group relative w-full overflow-hidden"
													disabled={
														!newPromptName.trim() || !newPromptContent.trim()
													}
												>
													<span className="relative z-10 flex items-center">
														<Plus className="mr-2 h-4 w-4" />
														Save Template
													</span>
													<span className="absolute inset-0 origin-left scale-x-0 transform bg-primary-foreground/10 transition-transform group-hover:scale-x-100" />
												</Button>
											</div>
										</div>

										<Separator className="my-2" />

										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<h3 className="font-medium text-lg">
													System Prompts Configuration
												</h3>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-6 w-6"
															>
																<Info className="h-4 w-4" />
															</Button>
														</TooltipTrigger>
														<TooltipContent className="max-w-xs">
															<p>
																System prompts define how the AI behaves in
																different parts of the application. Changes here
																will affect all future conversations.
															</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>

											<div className="space-y-4 rounded-md border-2 bg-card/50 p-4">
												<div className="space-y-2">
													<Label
														htmlFor="streaming-system-prompt"
														className="font-medium text-base"
													>
														Streaming API System Prompt
													</Label>
													<Textarea
														id="streaming-system-prompt"
														placeholder="System prompt used for streaming API responses"
														value={streamingSystemPrompt}
														onChange={(e) =>
															setStreamingSystemPrompt(e.target.value)
														}
														className="min-h-[120px] resize-y border-2"
													/>
													<p className="mt-1 text-muted-foreground text-sm">
														Used when generating streaming responses in the chat
														interface
													</p>
												</div>

												<div className="space-y-2">
													<Label
														htmlFor="chat-router-system-prompt"
														className="font-medium text-base"
													>
														Chat Router System Prompt
													</Label>
													<Textarea
														id="chat-router-system-prompt"
														placeholder="System prompt used in the chat router"
														value={chatRouterSystemPrompt}
														onChange={(e) =>
															setChatRouterSystemPrompt(e.target.value)
														}
														className="min-h-[120px] resize-y border-2"
													/>
													<p className="mt-1 text-muted-foreground text-sm">
														Used by the server when processing non-streaming
														chat requests
													</p>
												</div>
											</div>

											<Button
												onClick={() => {
													toast({
														title: "System prompts saved",
														description:
															"Your system prompt changes have been applied to all components.",
													});
												}}
												className="group relative w-full overflow-hidden"
											>
												<span className="relative z-10 flex items-center">
													<Save className="mr-2 h-4 w-4" />
													Save System Prompts
												</span>
												<span className="absolute inset-0 origin-left scale-x-0 transform bg-primary-foreground/10 transition-transform group-hover:scale-x-100" />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* RAG Settings Tab */}
						<TabsContent value="rag" className="space-y-4">
							<Card className="overflow-hidden border-2 shadow-md">
								<CardHeader className="border-b bg-card/50 backdrop-blur-sm">
									<CardTitle className="flex items-center gap-2">
										<Database className="h-5 w-5 text-primary" />
										Retrieval-Augmented Generation (RAG)
									</CardTitle>
									<CardDescription>
										Configure how the AI retrieves and uses information from
										your knowledge base
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6 p-6">
									<div className="flex items-center justify-between space-y-0 pb-2">
										<div className="space-y-0.5">
											<Label
												htmlFor="rag-toggle"
												className="font-medium text-base"
											>
												Enable RAG
											</Label>
											<p className="text-muted-foreground text-sm">
												Allow the AI to retrieve information from your knowledge
												base
											</p>
										</div>
										<Switch
											id="rag-toggle"
											checked={ragEnabled}
											onCheckedChange={setRagEnabled}
											className="data-[state=checked]:bg-primary"
										/>
									</div>

									<div
										className={
											ragEnabled ? "" : "pointer-events-none opacity-50"
										}
									>
										<div className="space-y-4">
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<Label
														htmlFor="chunk-size"
														className="font-medium text-base"
													>
														Chunk Size: {chunkSize}
													</Label>
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6"
																>
																	<Info className="h-4 w-4" />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p className="max-w-xs">
																	The size of text chunks for processing
																	documents. Smaller chunks are more precise but
																	may lose context.
																</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
												<Slider
													id="chunk-size"
													min={100}
													max={2000}
													step={100}
													value={[chunkSize]}
													onValueChange={(value) => {
														if (value[0] !== undefined) {
															setChunkSize(value[0]);
														}
													}}
													className="py-2"
												/>
												<div className="flex justify-between text-muted-foreground text-xs">
													<span>Small (100)</span>
													<span>Medium (1000)</span>
													<span>Large (2000)</span>
												</div>
											</div>

											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<Label
														htmlFor="similarity-threshold"
														className="font-medium text-base"
													>
														Similarity Threshold: {similarityThreshold}
													</Label>
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6"
																>
																	<Info className="h-4 w-4" />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p className="max-w-xs">
																	Minimum similarity score required for
																	retrieved content to be included. Higher
																	values mean more relevant but potentially
																	fewer results.
																</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
												<Slider
													id="similarity-threshold"
													min={0.1}
													max={1.0}
													step={0.05}
													value={[similarityThreshold]}
													onValueChange={(value) => {
														if (value[0] !== undefined) {
															setSimilarityThreshold(value[0]);
														}
													}}
													className="py-2"
												/>
												<div className="flex justify-between text-muted-foreground text-xs">
													<span>Broad (0.1)</span>
													<span>Balanced (0.5)</span>
													<span>Strict (1.0)</span>
												</div>
											</div>

											<Separator className="my-2" />

											<div className="space-y-4">
												<div className="flex items-center justify-between">
													<h3 className="font-medium text-lg">Data Sources</h3>
													<Badge variant="outline" className="border-2">
														{dataSources.filter((s) => s.enabled).length} Active
													</Badge>
												</div>

												<div className="space-y-2">
													{dataSources.map((source) => (
														<motion.div
															key={source.id}
															initial={{ opacity: 0, y: 10 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{ duration: 0.2 }}
															className="flex items-center justify-between rounded-md border-2 p-4 transition-colors hover:bg-muted/30"
														>
															<div className="flex items-center gap-3">
																{source.type === "pdf" ? (
																	<FileText className="h-5 w-5 text-red-500" />
																) : source.type === "web" ? (
																	<Globe className="h-5 w-5 text-blue-500" />
																) : (
																	<HardDrive className="h-5 w-5 text-green-500" />
																)}
																<div>
																	<p className="font-medium">{source.name}</p>
																	<p className="text-muted-foreground text-xs">
																		{source.type.toUpperCase()} •{" "}
																		{source.enabled ? "Active" : "Inactive"}
																	</p>
																</div>
															</div>
															<div className="flex gap-2">
																<Switch
																	checked={source.enabled}
																	onCheckedChange={() =>
																		setDataSources(
																			dataSources.map((s) =>
																				s.id === source.id
																					? { ...s, enabled: !s.enabled }
																					: s,
																			),
																		)
																	}
																	className="data-[state=checked]:bg-primary"
																/>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
																	onClick={() =>
																		setDataSources(
																			dataSources.filter(
																				(s) => s.id !== source.id,
																			),
																		)
																	}
																>
																	<Trash2 className="h-4 w-4" />
																	<span className="sr-only">Delete Source</span>
																</Button>
															</div>
														</motion.div>
													))}
												</div>

												<div className="space-y-2 rounded-md border-2 bg-card/50 p-4">
													<h4 className="font-medium">Add New Data Source</h4>
													<div className="flex gap-2">
														<Input
															placeholder="Data Source Name"
															value={newDataSource}
															onChange={(e) => setNewDataSource(e.target.value)}
															className="h-11 flex-1 border-2"
														/>
														<Select
															value={newDataSourceType}
															onValueChange={setNewDataSourceType}
														>
															<SelectTrigger className="h-11 w-[120px] border-2">
																<SelectValue placeholder="Type" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="pdf">PDF</SelectItem>
																<SelectItem value="web">Web</SelectItem>
																<SelectItem value="database">
																	Database
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
													<div className="mt-2 flex gap-2">
														<Button
															variant="outline"
															className="h-11 flex-1 border-2 hover:bg-muted/50"
														>
															<Upload className="mr-2 h-4 w-4" />
															Upload File
														</Button>
														<Button
															onClick={() => {
																const newSource = {
																	id: dataSources.length + 1,
																	name: newDataSource,
																	type: newDataSourceType,
																	enabled: true,
																};

																setDataSources([...dataSources, newSource]);
																setNewDataSource("");

																toast({
																	title: "Data source added",
																	description:
																		"The new data source has been added successfully.",
																});
															}}
															className="group relative flex-1 overflow-hidden"
															disabled={!newDataSource.trim()}
														>
															<span className="relative z-10 flex items-center">
																<Plus className="mr-2 h-4 w-4" />
																Add Source
															</span>
															<span className="absolute inset-0 origin-left scale-x-0 transform bg-primary-foreground/10 transition-transform group-hover:scale-x-100" />
														</Button>
													</div>
												</div>
											</div>

											<Accordion type="single" collapsible className="w-full">
												<AccordionItem
													value="advanced-rag"
													className="rounded-md border-2"
												>
													<AccordionTrigger className="rounded-t-md px-4 py-3 hover:bg-muted/50">
														Advanced RAG Settings
													</AccordionTrigger>
													<AccordionContent className="space-y-4 px-4 py-3">
														<div className="space-y-2">
															<Label
																htmlFor="embedding-model"
																className="font-medium text-base"
															>
																Embedding Model
															</Label>
															<Select defaultValue="text-embedding-3-large">
																<SelectTrigger
																	id="embedding-model"
																	className="h-11 border-2"
																>
																	<SelectValue placeholder="Select embedding model" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="text-embedding-3-large">
																		text-embedding-3-large
																	</SelectItem>
																	<SelectItem value="text-embedding-3-small">
																		text-embedding-3-small
																	</SelectItem>
																	<SelectItem value="text-embedding-ada-002">
																		text-embedding-ada-002
																	</SelectItem>
																</SelectContent>
															</Select>
															<p className="mt-1 text-muted-foreground text-sm">
																Model used to convert text into vector
																embeddings for similarity search
															</p>
														</div>

														<div className="space-y-2">
															<Label
																htmlFor="retrieval-count"
																className="font-medium text-base"
															>
																Maximum Retrievals
															</Label>
															<Input
																id="retrieval-count"
																type="number"
																min={1}
																max={20}
																defaultValue={5}
																className="h-11 border-2"
															/>
															<p className="mt-1 text-muted-foreground text-sm">
																Maximum number of chunks to retrieve per query
															</p>
														</div>

														<div className="flex items-center justify-between space-y-0 pb-2">
															<div className="space-y-0.5">
																<Label
																	htmlFor="rerank-toggle"
																	className="font-medium text-base"
																>
																	Enable Re-ranking
																</Label>
																<p className="text-muted-foreground text-sm">
																	Apply a secondary ranking to improve retrieval
																	relevance
																</p>
															</div>
															<Switch
																id="rerank-toggle"
																defaultChecked={true}
																className="data-[state=checked]:bg-primary"
															/>
														</div>
													</AccordionContent>
												</AccordionItem>
											</Accordion>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Other Settings Tab */}
						<TabsContent value="other" className="space-y-4">
							<Card className="overflow-hidden border-2 shadow-md">
								<CardHeader className="border-b bg-card/50 backdrop-blur-sm">
									<CardTitle className="flex items-center gap-2">
										<Settings className="h-5 w-5 text-primary" />
										General Settings
									</CardTitle>
									<CardDescription>
										Configure general preferences and behavior of the AI
										assistant
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6 p-6">
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-4">
											<div className="flex items-center justify-between space-y-0 rounded-md border-2 p-3 transition-colors hover:bg-muted/30">
												<div className="space-y-0.5">
													<Label
														htmlFor="dark-mode-toggle"
														className="font-medium text-base"
													>
														Dark Mode
													</Label>
													<p className="text-muted-foreground text-sm">
														Switch between light and dark theme
													</p>
												</div>
												<Switch
													id="dark-mode-toggle"
													checked={darkMode}
													onCheckedChange={setDarkMode}
													className="data-[state=checked]:bg-primary"
												/>
											</div>

											<div className="flex items-center justify-between space-y-0 rounded-md border-2 p-3 transition-colors hover:bg-muted/30">
												<div className="space-y-0.5">
													<Label
														htmlFor="notifications-toggle"
														className="font-medium text-base"
													>
														Notifications
													</Label>
													<p className="text-muted-foreground text-sm">
														Enable notifications for AI responses
													</p>
												</div>
												<Switch
													id="notifications-toggle"
													checked={notificationsEnabled}
													onCheckedChange={setNotificationsEnabled}
													className="data-[state=checked]:bg-primary"
												/>
											</div>

											<div className="flex items-center justify-between space-y-0 rounded-md border-2 p-3 transition-colors hover:bg-muted/30">
												<div className="space-y-0.5">
													<Label
														htmlFor="streaming-toggle"
														className="font-medium text-base"
													>
														Streaming Responses
													</Label>
													<p className="text-muted-foreground text-sm">
														Show AI responses as they are generated
													</p>
												</div>
												<Switch
													id="streaming-toggle"
													checked={streamingEnabled}
													onCheckedChange={setStreamingEnabled}
													className="data-[state=checked]:bg-primary"
												/>
											</div>
										</div>

										<div className="space-y-4">
											<div className="flex items-center justify-between space-y-0 rounded-md border-2 p-3 transition-colors hover:bg-muted/30">
												<div className="space-y-0.5">
													<Label
														htmlFor="autosave-toggle"
														className="font-medium text-base"
													>
														Auto-save History
													</Label>
													<p className="text-muted-foreground text-sm">
														Automatically save chat history
													</p>
												</div>
												<Switch
													id="autosave-toggle"
													checked={autoSaveHistory}
													onCheckedChange={setAutoSaveHistory}
													className="data-[state=checked]:bg-primary"
												/>
											</div>

											<div className="flex items-center justify-between space-y-0 rounded-md border-2 p-3 transition-colors hover:bg-muted/30">
												<div className="space-y-0.5">
													<Label
														htmlFor="citations-toggle"
														className="font-medium text-base"
													>
														Show Citations
													</Label>
													<p className="text-muted-foreground text-sm">
														Display source citations in AI responses
													</p>
												</div>
												<Switch
													id="citations-toggle"
													checked={citationsEnabled}
													onCheckedChange={setCitationsEnabled}
													className="data-[state=checked]:bg-primary"
												/>
											</div>

											<div className="space-y-2 rounded-md border-2 p-3 transition-colors hover:bg-muted/30">
												<Label
													htmlFor="history-retention"
													className="font-medium text-base"
												>
													History Retention (Days)
												</Label>
												<Input
													id="history-retention"
													type="number"
													min={1}
													max={365}
													value={historyRetentionDays}
													onChange={(e) => {
														const value = Number.parseInt(e.target.value);
														setHistoryRetentionDays(
															Number.isNaN(value) ? 30 : value,
														);
													}}
													className="h-11 border-2"
												/>
												<p className="mt-1 text-muted-foreground text-sm">
													Number of days to keep chat history
												</p>
											</div>
										</div>
									</div>

									<Separator className="my-2" />

									<div className="space-y-4">
										<h3 className="font-medium text-lg">Chat Interface</h3>

										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2 rounded-md border-2 p-3 transition-colors hover:bg-muted/30">
												<Label
													htmlFor="font-size"
													className="font-medium text-base"
												>
													Font Size
												</Label>
												<Select defaultValue="medium">
													<SelectTrigger
														id="font-size"
														className="h-11 border-2"
													>
														<SelectValue placeholder="Select font size" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="small">Small</SelectItem>
														<SelectItem value="medium">Medium</SelectItem>
														<SelectItem value="large">Large</SelectItem>
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2 rounded-md border-2 p-3 transition-colors hover:bg-muted/30">
												<Label
													htmlFor="code-theme"
													className="font-medium text-base"
												>
													Code Syntax Highlighting
												</Label>
												<Select defaultValue="github-dark">
													<SelectTrigger
														id="code-theme"
														className="h-11 border-2"
													>
														<SelectValue placeholder="Select code theme" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="github-dark">
															GitHub Dark
														</SelectItem>
														<SelectItem value="github-light">
															GitHub Light
														</SelectItem>
														<SelectItem value="dracula">Dracula</SelectItem>
														<SelectItem value="nord">Nord</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="space-y-2 rounded-md border-2 p-3 transition-colors hover:bg-muted/30">
											<Label
												htmlFor="message-display"
												className="font-medium text-base"
											>
												Message Display
											</Label>
											<Select defaultValue="bubbles">
												<SelectTrigger
													id="message-display"
													className="h-11 border-2"
												>
													<SelectValue placeholder="Select message display style" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="bubbles">Chat Bubbles</SelectItem>
													<SelectItem value="blocks">Message Blocks</SelectItem>
													<SelectItem value="minimal">Minimal</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<Separator className="my-2" />

									<div className="space-y-4">
										<h3 className="font-medium text-lg">Export & Import</h3>

										<div className="flex gap-2">
											<Button
												variant="outline"
												className="h-11 flex-1 border-2 hover:bg-muted/50"
											>
												<Upload className="mr-2 h-4 w-4" />
												Import Settings
											</Button>
											<Button
												variant="outline"
												className="h-11 flex-1 border-2 hover:bg-muted/50"
											>
												<Download className="mr-2 h-4 w-4" />
												Export Settings
											</Button>
										</div>

										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button variant="destructive" className="w-full">
													<Trash2 className="mr-2 h-4 w-4" />
													Clear All Data
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent className="border-2">
												<AlertDialogHeader>
													<AlertDialogTitle>
														Are you absolutely sure?
													</AlertDialogTitle>
													<AlertDialogDescription>
														This will permanently delete all your chat history,
														saved prompts, and custom settings. This action
														cannot be undone.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction className="bg-destructive text-destructive-foreground">
														Yes, delete everything
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</CardContent>
							</Card>

							<Card className="overflow-hidden border-2 shadow-md">
								<CardHeader className="border-b bg-card/50 backdrop-blur-sm">
									<CardTitle className="flex items-center gap-2">
										<Book className="h-5 w-5 text-primary" />
										Documentation & Resources
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 p-6">
									<div className="grid gap-4 md:grid-cols-2">
										<div className="group rounded-md border-2 p-4 transition-colors hover:bg-muted/30">
											<h3 className="mb-2 flex items-center font-medium">
												AI Model Documentation
												<ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
											</h3>
											<p className="mb-4 text-muted-foreground text-sm">
												Learn about the AI models and their capabilities
											</p>
											<Button
												variant="outline"
												className="w-full border-2 hover:bg-muted/50"
											>
												View Documentation
											</Button>
										</div>
										<div className="group rounded-md border-2 p-4 transition-colors hover:bg-muted/30">
											<h3 className="mb-2 flex items-center font-medium">
												RAG Configuration Guide
												<ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
											</h3>
											<p className="mb-4 text-muted-foreground text-sm">
												Best practices for setting up retrieval-augmented
												generation
											</p>
											<Button
												variant="outline"
												className="w-full border-2 hover:bg-muted/50"
											>
												Read Guide
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</main>
		</div>
	);
}
