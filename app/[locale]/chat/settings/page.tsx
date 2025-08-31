"use client";

import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "~/i18n/navigation";
import { useSettingsStore } from "~/stores/settings";
import { api } from "~/trpc/react";

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
import { Slider } from "~/components/ui/slider";
import { Textarea } from "~/components/ui/textarea";

export default function ChatSettingsPage() {
	const t = useTranslations("chat.settings");

	// Get settings from store
	const {
		provider,
		model,
		temperature,
		maxTokens,
		systemPrompt,
		apiKeys,
		setProvider,
		setModel,
		setTemperature,
		setMaxTokens,
		setSystemPrompt,
		setApiKey,
	} = useSettingsStore();

	// Local state
	const [selectedProvider, setSelectedProvider] = useState(
		provider || "mistral",
	);
	const [selectedModel, setSelectedModel] = useState(
		model || "mistral-small-latest",
	);
	const [showApiKey, setShowApiKey] = useState(false);
	const [currentApiKey, setCurrentApiKey] = useState("");

	// Get providers and models from tRPC
	const { data: providers, isLoading: providersLoading } = api.ai.getProviders.useQuery();
	const { data: models, isLoading: modelsLoading, error: modelsError, refetch: refetchModels } = api.ai.getModelsByProvider.useQuery(
		{
			provider: selectedProvider as
				| "mistral"
				| "openai"
				| "anthropic"
				| "gemini"
				| "openrouter",
			apiKey: apiKeys[selectedProvider as keyof typeof apiKeys], // Pass the API key
		},
		{ 
			enabled: !!selectedProvider && ["mistral", "openai", "anthropic", "gemini", "openrouter"].includes(selectedProvider),
		},
	);

	// Debug logging
	useEffect(() => {
		console.log("Settings Debug:", {
			selectedProvider,
			providersLoading,
			providers,
			modelsLoading,
			models,
			modelsError: modelsError?.message,
		});
	}, [selectedProvider, providersLoading, providers, modelsLoading, models, modelsError]);

	// Update settings when selections change
	useEffect(() => {
		setProvider(selectedProvider);
		// Update current API key when provider changes
		const providerKey = apiKeys[selectedProvider as keyof typeof apiKeys] || "";
		setCurrentApiKey(providerKey);
	}, [selectedProvider, setProvider, apiKeys]);

	useEffect(() => {
		setModel(selectedModel);
	}, [selectedModel, setModel]);

	// Refetch models when provider or API key changes
	useEffect(() => {
		console.log("Provider or API key changed, refetching models...");
		refetchModels();
	}, [selectedProvider, apiKeys, refetchModels]);

	// Auto-select first model when provider changes and models are loaded
	useEffect(() => {
		if (models && models.length > 0) {
			// Check if current selectedModel exists in the new provider's models
			const modelExists = models.some(m => m.id === selectedModel);
			if (!modelExists) {
				// Select first model if current model doesn't exist
				console.log("Auto-selecting first model:", models[0]?.id);
				setSelectedModel(models[0]?.id || "");
			}
		}
	}, [models, selectedModel]);

	const handleSave = () => {
		// Settings are automatically saved to the store
		console.log("Settings saved");
		// Optionally validate API key by refetching models
		if (currentApiKey) {
			refetchModels();
		}
	};

	return (
		<div className="flex h-screen flex-col bg-gradient-to-b from-background to-background/80">
			<main className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="mx-auto max-w-4xl space-y-6">
					<div className="flex items-center justify-between">
						<Button variant="ghost" size="sm" asChild className="group">
							<Link href="/chat">
								<ArrowLeft className="group-hover:-translate-x-1 h-4 w-4 transition-transform" />
								<span className="ml-2">Back to Chat</span>
							</Link>
						</Button>
					</div>

					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>AI Model Settings</CardTitle>
								<CardDescription>
									Configure the AI model and its parameters
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* API Key Input */}
								<div className="space-y-2">
									<Label htmlFor="api-key">API Key for {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}</Label>
									<div className="relative">
										<Input
											id="api-key"
											type={showApiKey ? "text" : "password"}
											value={currentApiKey}
											onChange={(e) => {
												setCurrentApiKey(e.target.value);
												setApiKey(selectedProvider, e.target.value);
											}}
											placeholder={`Enter your ${selectedProvider} API key`}
											className="pr-10"
										/>
										<button
											type="button"
											onClick={() => setShowApiKey(!showApiKey)}
											className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
											aria-label={showApiKey ? "Hide API key" : "Show API key"}
										>
											{showApiKey ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									</div>
									<p className="text-sm text-muted-foreground">
										Your API key is stored locally and never sent to our servers.
									</p>
									{modelsError && currentApiKey && (
										<p className="text-sm text-destructive">
											Invalid API key or connection error. Please check your key.
										</p>
									)}
									{models && models.length > 0 && currentApiKey && (
										<p className="text-sm text-green-600">
											✓ API key is valid - {models.length} models available
										</p>
									)}
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="provider">Provider</Label>
										<Select
											value={selectedProvider}
											onValueChange={setSelectedProvider}
											disabled={providersLoading}
										>
											<SelectTrigger>
												<SelectValue 
													placeholder={providersLoading ? "Loading providers..." : "Select provider"} 
												/>
											</SelectTrigger>
											<SelectContent>
												{providers?.map((provider) => (
													<SelectItem key={provider.id} value={provider.id}>
														{provider.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="model">Model</Label>
										<Select
											value={selectedModel}
											onValueChange={setSelectedModel}
											disabled={modelsLoading || !models || models.length === 0}
										>
											<SelectTrigger>
												<SelectValue 
													placeholder={
														modelsLoading 
															? "Loading models..." 
															: modelsError 
															? "Error loading models"
															: "Select model"
													} 
												/>
											</SelectTrigger>
											<SelectContent>
												{models?.map((model, index) => (
													<SelectItem key={`${model.id}-${index}`} value={model.id}>
														{model.name}
													</SelectItem>
												))}
												{!models?.length && !modelsLoading && (
													<SelectItem value="" disabled>
														No models available
													</SelectItem>
												)}
											</SelectContent>
										</Select>
										{modelsError && (
											<p className="text-sm text-destructive">
												Error: {modelsError.message}
											</p>
										)}
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="temperature">
										Temperature: {temperature}
									</Label>
									<Slider
										id="temperature"
										min={0}
										max={2}
										step={0.1}
										value={[temperature]}
										onValueChange={(value) => setTemperature(value[0] || 0.7)}
										className="w-full"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="maxTokens">Max Tokens</Label>
									<Input
										id="maxTokens"
										type="number"
										value={maxTokens}
										onChange={(e) => setMaxTokens(Number(e.target.value))}
										min={1}
										max={8000}
									/>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>System Prompt</CardTitle>
								<CardDescription>
									Customize the system prompt for the AI
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Textarea
									value={systemPrompt}
									onChange={(e) => setSystemPrompt(e.target.value)}
									placeholder="Enter your system prompt..."
									className="min-h-[100px]"
								/>
							</CardContent>
						</Card>

						<Button onClick={handleSave} className="w-full">
							Save Settings
						</Button>
					</div>
				</div>
			</main>
		</div>
	);
}
