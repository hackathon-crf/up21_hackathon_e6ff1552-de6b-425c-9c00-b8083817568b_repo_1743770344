"use client";

import { ArrowLeft } from "lucide-react";
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
		setProvider,
		setModel,
		setTemperature,
		setMaxTokens,
		setSystemPrompt,
	} = useSettingsStore();

	// Local state
	const [selectedProvider, setSelectedProvider] = useState(
		provider || "mistral",
	);
	const [selectedModel, setSelectedModel] = useState(
		model || "mistral-small-latest",
	);

	// Get providers and models from tRPC
	const { data: providers } = api.ai.getProviders.useQuery();
	const { data: models } = api.ai.getModelsByProvider.useQuery(
		{
			provider: selectedProvider as
				| "mistral"
				| "openai"
				| "anthropic"
				| "gemini"
				| "openrouter",
		},
		{ enabled: !!selectedProvider },
	);

	// Update settings when selections change
	useEffect(() => {
		setProvider(selectedProvider);
	}, [selectedProvider, setProvider]);

	useEffect(() => {
		setModel(selectedModel);
	}, [selectedModel, setModel]);

	const handleSave = () => {
		// Settings are automatically saved to the store
		console.log("Settings saved");
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
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="provider">Provider</Label>
										<Select
											value={selectedProvider}
											onValueChange={setSelectedProvider}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select provider" />
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
											disabled={!models || models.length === 0}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select model" />
											</SelectTrigger>
											<SelectContent>
												{models?.map((model) => (
													<SelectItem key={model.id} value={model.id}>
														{model.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
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
