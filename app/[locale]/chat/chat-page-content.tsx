"use client";

import type { TRPCClientErrorLike } from "@trpc/client";
import type React from "react";
import type { AppRouter } from "~/server/api/root";

import { AnimatePresence, motion } from "framer-motion";
import {
	BookOpen,
	Bot,
	Calendar,
	ExternalLink,
	FileText,
	Heart,
	ImageIcon,
	Link as LinkIcon,
	Loader2,
	Paperclip,
	Send,
	User,
	XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "~/hooks/use-toast";
import { usePathname } from "~/i18n/navigation";
import { useRouter } from "~/i18n/navigation";
import { getScenarioSystemPrompt } from "~/lib/prompts/system-prompts";
import { cn } from "~/lib/utils";
import { useSettingsStore } from "~/stores/settings";
import { api } from "~/trpc/react";
import { ChatHeader } from "./components/chat-header";
import { ConversationalScenarioPicker } from "./components/conversational-scenario-picker";
import {
	type Scenario,
	ScenarioPicker,
} from "./components/scenario-picker-new";
import { useConversationalScenarioStore } from "./stores/conversational-scenario-store";
import type { ConversationalScenario } from "./types/conversational-scenario";
import { formatSourceDate, formatTime, generateId } from "./utils";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	isLoading?: boolean;
	isStreaming?: boolean;
}

export interface ChatPageProps {
	initialSessionId?: string;
}

// Define types for the chat message from the database
type ChatMessageFromDB = {
	id: string;
	session_id: string;
	role: string;
	content: string;
	timestamp: Date;
	metrics: unknown;
};

// Wrap the main component in an error boundary
export function ChatPageWrapper({ initialSessionId }: ChatPageProps) {
	const t = useTranslations("chat.errors");
	const tUi = useTranslations("chat.ui");
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		// Error boundary for client-side errors
		const errorHandler = (event: ErrorEvent) => {
			console.error("Error:", event.message);
			setHasError(true);
			return true; // Prevent default handling
		};

		window.addEventListener("error", errorHandler);

		return () => {
			window.removeEventListener("error", errorHandler);
		};
	}, []);

	if (hasError) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center p-6">
				<h1 className="mb-4 font-bold text-2xl">{t("somethingWentWrong")}</h1>
				<p className="mb-4">{t("loadingError")}</p>
				<button
					type="button"
					className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
					onClick={() => window.location.reload()}
				>
					{tUi("refreshPage")}
				</button>
			</div>
		);
	}

	return <ChatPageImpl initialSessionId={initialSessionId} />;
}

// Main chat component implementation
function ChatPageImpl({ initialSessionId }: ChatPageProps) {
	// Translations
	const tUi = useTranslations("chat.ui");
	const tScenarios = useTranslations("chat.scenarios");

	// Router for navigation
	const router = useRouter();
	const pathname = usePathname();

	// Chat state
	const [sessionId, setSessionId] = useState<string | undefined>(
		initialSessionId,
	);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
	const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
		null,
	);
	const [showScenarioPicker, setShowScenarioPicker] = useState(true);
	const [showScenarioOverlay, setShowScenarioOverlay] = useState(false);

	// Conversational scenario store
	const {
		currentScenario,
		isScenarioActive,
		startScenario,
		endScenario,
		addCoveredTopic,
		addDemonstratedSkill,
		recordUserResponse,
		generateScenarioPrompt,
		shouldAdvanceStage,
		advanceStage,
	} = useConversationalScenarioStore();
	const [isNavigating, setIsNavigating] = useState(false); // Add navigation lock
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const latestSessionIdRef = useRef<string | undefined>(initialSessionId); // Reference for latest session ID

	// Get settings from store
	const {
		provider,
		model,
		temperature,
		maxTokens,
		streamingEnabled,
		systemPrompt, // Renamed from defaultPrompt
		ragEnabled,
	} = useSettingsStore();

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	// Focus input on load
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// Add a smooth scroll effect when container is resized
	useEffect(() => {
		const observer = new ResizeObserver(() => {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		});

		if (containerRef.current) {
			observer.observe(containerRef.current);
		}

		return () => observer.disconnect();
	}, []);

	// Set up navigation event listeners for router events
	useEffect(() => {
		// Navigation start handlers
		const handleRouteChangeStart = () => {
			console.log("🔄🔄🔄 [CHAT-DEBUG] Route change starting... 🔄🔄🔄");
			setIsNavigating(true);
		};

		// Navigation complete handlers
		const handleRouteChangeComplete = (url: string) => {
			console.log(`✅✅✅ [CHAT-DEBUG] Route change complete: ${url} ✅✅✅`);
			setIsNavigating(false);
		};

		// Navigation error handlers
		const handleRouteChangeError = (err: Error) => {
			console.error("❌❌❌ [CHAT-DEBUG] Route change error:", err, "❌❌❌");
			setIsNavigating(false);
		};

		// Note: App Router doesn't have router.events, commenting out legacy code
		// router.events?.on('routeChangeStart', handleRouteChangeStart);
		// router.events?.on('routeChangeComplete', handleRouteChangeComplete);
		// router.events?.on('routeChangeError', handleRouteChangeError);

		// return () => {
		// 	// Clean up event handlers
		// 	router.events?.off('routeChangeStart', handleRouteChangeStart);
		// 	router.events?.off('routeChangeComplete', handleRouteChangeComplete);
		// 	router.events?.off('routeChangeError', handleRouteChangeError);
		// };
	}, []);

	// Extract session ID from URL if not provided as prop
	// This is critical for synchronizing the UI state with the URL
	useEffect(() => {
		// If we're on a specific chat URL (e.g. /chat/123-456-789)
		if (pathname.includes("/chat/") && pathname !== "/chat/settings") {
			const urlSessionId = pathname.split("/").pop();

			// Only update if we have a valid session ID in the URL that differs from current state
			if (urlSessionId && urlSessionId !== sessionId) {
				console.log(`Updating session ID from URL: ${urlSessionId}`);
				// Update ref first to ensure consistent state
				latestSessionIdRef.current = urlSessionId;
				// Then update state
				setSessionId(urlSessionId);
			}
		} else if (pathname === "/chat") {
			// If we're on the base /chat route, we should be ready for a new session
			// but only clear the session ID if we're not on an existing session page
			if (sessionId && !initialSessionId) {
				console.log(
					"Base chat route detected, clearing session ID for new conversation",
				);
				// Update ref first to ensure consistent state
				latestSessionIdRef.current = undefined;
				// Then update state
				setSessionId(undefined);
				// Clear messages for new conversation
				setMessages([]);
			}
		}
	}, [initialSessionId, pathname, sessionId]);

	// tRPC mutations and queries
	const saveMessageMutation = api.chat.saveMessage.useMutation();
	const sendMessageMutation = api.chat.sendMessage.useMutation({
		onSuccess: (data) => {
			// Always update ref first, then state to maintain consistency
			// This ensures consistency between client state and server state
			latestSessionIdRef.current = data.session_id; // Update ref first
			setSessionId(data.session_id); // Then update state

			// Only update URL if we're on a different chat page or the base chat page
			// This avoids unnecessary navigation on the current session page
			if (pathname !== `/chat/${data.session_id}`) {
				console.log(
					`⚡⚡⚡ [CHAT-DEBUG] Updating URL: /chat/${data.session_id} ⚡⚡⚡`,
				);

				// Instead of navigation, update the browser URL quietly without a page change
				// This is more seamless than router.push even with shallow: true
				if (window.history?.replaceState) {
					try {
						// Quietly update the URL without triggering navigation
						window.history.replaceState({}, "", `/chat/${data.session_id}`);
						console.log(
							"🔄🔄🔄 [CHAT-DEBUG] URL quietly updated using history.replaceState 🔄🔄🔄",
						);
					} catch (err) {
						console.error("History API error:", err);
						// Fallback to router.replace only if history API fails
						router.replace(`/chat/${data.session_id}`);
					}
				}
			}

			// Update messages - remove loading state and add response
			setMessages((prev) => [
				...prev.filter((msg) => !msg.isLoading),
				{
					id: data.assistant_message_id,
					role: "assistant",
					content: data.response,
					timestamp: new Date(),
				},
			]);

			setIsTyping(false);
		},
		onError: (error) => {
			console.error("Error sending message:", error);
			setIsTyping(false);

			// Show error message
			setMessages((prev) => [
				...prev.filter((msg) => !msg.isLoading),
				{
					id: `error-${generateId()}`,
					role: "assistant",
					content: `Sorry, I encountered an error: ${error.message}`,
					timestamp: new Date(),
				},
			]);

			toast({
				title: "Error",
				description: `Failed to generate response: ${error.message}`,
				variant: "destructive",
			});
		},
	});

	// Fetch chat history when sessionId changes
	const messagesQuery = api.chat.getMessages.useQuery(
		{
			// Always provide session_id - the backend will handle empty strings
			session_id: sessionId || "",
		},
		{
			enabled: true, // Always enable query, backend will handle validation
			refetchOnMount: true, // This ensures it runs when session ID is updated
			refetchOnWindowFocus: false,
			retry: false, // Don't retry on errors
		},
	);

	// Use effect to process the query results
	useEffect(() => {
		if (messagesQuery.isLoading) return;

		if (messagesQuery.isSuccess && messagesQuery.data) {
			console.log(
				`Successfully fetched ${messagesQuery.data.length} messages for session ${sessionId}`,
			);

			if (messagesQuery.data.length > 0) {
				// Format messages from database (includes scenario intros now)
				const formattedMessages = messagesQuery.data.map(
					(msg: ChatMessageFromDB) => ({
						id: msg.id,
						role: msg.role as "user" | "assistant",
						content: msg.content,
						timestamp: new Date(msg.timestamp),
					}),
				);

				setMessages(formattedMessages);
				console.log(
					"Updated messages from database:",
					formattedMessages.length,
				);

				// Hide welcome banner since we have history
				setShowWelcomeBanner(false);
			} else {
				console.log("No messages found for this session or empty result");
			}
		}

		if (messagesQuery.isError && messagesQuery.error) {
			console.error("Error fetching chat history:", messagesQuery.error);
			// Add more detailed error logging - safely access properties
			console.error(
				`Messages query error details: ${messagesQuery.error.message}`,
				{
					// Use type assertion with a specific interface
					code: (messagesQuery.error as { code?: string }).code,
					data: (messagesQuery.error as { data?: unknown }).data,
					sessionId: sessionId,
				},
			);

			// Check if it's an authorization error and handle appropriately
			if (
				messagesQuery.error.message.includes("UNAUTHORIZED") ||
				messagesQuery.error.message.includes("logged in")
			) {
				console.error("Authentication issue detected when fetching messages");
			}

			toast({
				title: "Error",
				description: `Failed to load chat history: ${messagesQuery.error.message}`,
				variant: "destructive",
			});
		}
	}, [
		messagesQuery.data,
		messagesQuery.error,
		messagesQuery.isError,
		messagesQuery.isLoading,
		messagesQuery.isSuccess,
		sessionId,
	]);

	// Handle sending messages
	const handleSend = async () => {
		if (!input.trim()) return;

		// Prevent sending messages while waiting for sessionId to be set from a previous message
		// or while navigating between pages
		if (isTyping || isNavigating) {
			console.log(
				`Message sending prevented: ${isTyping ? "AI is still responding" : "Navigation in progress"}`,
			);
			return;
		}

		// Use the latest session ID from the ref to prevent race conditions
		const currentSessionId = latestSessionIdRef.current;

		// Hide welcome banner
		if (showWelcomeBanner) {
			setShowWelcomeBanner(false);
		}

		// Check if API key is available for selected provider
		const apiKey = localStorage.getItem(`${provider}_api_key`);

		if (!apiKey) {
			toast({
				title: "API Key Required",
				description: `Please add your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key in settings before sending messages.`,
				variant: "destructive",
			});

			// Redirect to settings
			router.push("/chat/settings");
			return;
		}

		// Clean up API key - remove any whitespace or quotes
		const cleanedApiKey = apiKey.trim().replace(/['"]/g, "");

		// Basic validation of API key format
		const isValidFormat =
			(provider === "mistral" && cleanedApiKey.length >= 20) ||
			(provider === "openai" &&
				(cleanedApiKey.startsWith("sk-") || cleanedApiKey.length >= 30)) ||
			cleanedApiKey.length >= 20;

		if (!isValidFormat) {
			toast({
				title: "Invalid API Key Format",
				description: `Your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key appears to be invalid. Please check it in settings.`,
				variant: "destructive",
			});

			// Redirect to settings
			router.push("/chat/settings");
			return;
		}

		// Use the user's input as the message content
		const messageContent = input;

		const userMessage: Message = {
			id: `user-${generateId()}`,
			role: "user",
			content: messageContent,
			timestamp: new Date(),
		};

		// Add user message to UI
		setMessages((prev) => [...prev, userMessage]);
		setInput("");

		// For conversational scenarios, record the user response and check for stage advancement
		if (isScenarioActive && currentScenario) {
			// Check if we should advance the conversation stage
			if (shouldAdvanceStage(messageContent)) {
				advanceStage();
			}

			// Record user response for assessment (AI assessment will be added later)
			recordUserResponse("Current situation", messageContent);
		}

		// Add loading indicator
		const loadingMessage: Message = {
			id: `loading-${generateId()}`,
			role: "assistant",
			content: "",
			timestamp: new Date(),
			isLoading: true,
		};

		setMessages((prev) => [...prev, loadingMessage]);
		setIsTyping(true);

		try {
			// Use the latest session ID from the ref instead of from state
			// This prevents race conditions between React renders and async operations
			console.log(
				`Sending message with sessionId: ${currentSessionId || "creating new session"}`,
			);

			if (streamingEnabled) {
				// Use streaming endpoint with conversational scenario support
				const scenarioSystemPrompt =
					isScenarioActive && currentScenario
						? generateScenarioPrompt()
						: undefined;
				await handleStreamingResponse(
					userMessage.content,
					selectedScenario,
					scenarioSystemPrompt,
				);
			} else {
				// Use tRPC mutation for non-streaming response
				sendMessageMutation.mutate({
					session_id: currentSessionId,
					content: userMessage.content,
					provider,
					model,
					temperature,
					maxTokens,
					ragEnabled,
				});
			}
		} catch (error) {
			console.error("Error sending message:", error);
			setIsTyping(false);
			setMessages((prev) => [
				...prev.filter((msg) => !msg.isLoading),
				{
					id: `error-${generateId()}`,
					role: "assistant",
					content:
						"Sorry, I encountered an error while processing your request.",
					timestamp: new Date(),
				},
			]);

			toast({
				title: "Error",
				description: `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
				variant: "destructive",
			});
		}
	};

	// Stream response using fetch API
	const handleStreamingResponse = async (
		content: string,
		scenario?: Scenario | null,
		customSystemPrompt?: string,
	) => {
		try {
			// Create unique ID for the response message
			const responseId = `stream-${generateId()}`;
			let tempSessionId = sessionId;

			// Get chat history for context
			const messageHistory = messages
				.filter((m) => !m.isLoading && !m.isStreaming)
				.map((m) => ({
					role: m.role,
					content: m.content,
				}));

			// Add the current message
			messageHistory.push({
				role: "user",
				content,
			});

			// Initialize the response message
			setMessages((prev) =>
				prev.map((msg) =>
					msg.isLoading
						? {
								...msg,
								id: responseId,
								isLoading: false,
								isStreaming: true,
								content: "", // Start with empty content
							}
						: msg,
				),
			);

			// Get the API key from localStorage - ensure we get the most current value
			const apiKey = localStorage.getItem(`${provider}_api_key`);
			console.log(
				`Using API key for ${provider}: ${apiKey ? `Key present (length: ${apiKey.length})` : "Not found"}`,
			);

			// Ensure API key doesn't have any whitespace or quotes
			const cleanedApiKey = apiKey?.trim().replace(/['"]/g, "");

			// Capture the current session ID before making the request
			// This is important to avoid race conditions where the session ID
			// might change while we're waiting for the response
			const currentSessionId = sessionId;
			console.log(
				`🔍🔍🔍 [CHAT-DEBUG] Streaming with session ID: ${currentSessionId || "creating new session"} 🔍🔍🔍`,
			);
			console.log(`🧩🧩🧩 [CHAT-DEBUG] Current pathname: ${pathname} 🧩🧩🧩`);

			// Before making request, update the latest session ID ref
			latestSessionIdRef.current = currentSessionId;

			// Make streaming request
			const response = await fetch("/api/chat/stream", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					session_id: currentSessionId,
					messages: messageHistory,
					provider,
					model,
					temperature,
					maxTokens,
					// Pass the custom scenario system prompt or unified default prompt
					streamingSystemPrompt: customSystemPrompt,
					// Include API key for development mode (will only be used if server env vars aren't set)
					apiKey: cleanedApiKey,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);

				// Special handling for authentication errors
				if (response.status === 401 || response.status === 403) {
					const errorMsg =
						errorData?.message || errorData?.error || "Authentication failed";
					console.error(
						`API Authentication error (${response.status}):`,
						errorData,
					);

					// Add more descriptive message
					throw new Error(
						`Authentication error: ${errorMsg}. Please check your API key for ${provider} in settings.`,
					);
				}

				throw new Error(
					`HTTP error ${response.status}: ${errorData?.error || errorData?.message || response.statusText}`,
				);
			}

			// Use proper EventSource handling for SSE
			if (!response.body) {
				throw new Error("Response body is null");
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let streamedContent = "";

			// Process the stream
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				// Decode the chunk and add to buffer
				buffer += decoder.decode(value, { stream: true });

				// Process complete events in the buffer
				const events = buffer.split("\n\n");
				buffer = events.pop() || ""; // Keep the last incomplete event in the buffer

				for (const event of events) {
					if (!event.trim()) continue;

					// Parse event type and data
					const lines = event.split("\n");
					let eventType = "";
					let eventData = "";

					for (const line of lines) {
						if (line.startsWith("event: ")) {
							eventType = line.slice(7);
						} else if (line.startsWith("data: ")) {
							eventData = line.slice(6);
						}
					}

					if (!eventType || !eventData) continue;

					try {
						const parsedData = JSON.parse(eventData);

						// Handle different event types
						switch (eventType) {
							case "setup":
								// FIXED: Changed from sessionId to session_id to match server format
								if (parsedData.session_id) {
									console.log(
										`🔔🔔🔔 [CHAT-DEBUG] RECEIVED SESSION ID FROM SERVER: ${parsedData.session_id} 🔔🔔🔔`,
									);
									// Always update tempSessionId, even if we think we already have one
									// This ensures consistency with the server
									tempSessionId = parsedData.session_id;

									// Log the session ID received and current URL path
									console.log(
										`📌📌📌 [CHAT-DEBUG] Server returned session ID: ${parsedData.session_id}, Current path: ${pathname} 📌📌📌`,
									);
								} else {
									console.log(
										`⚠️⚠️⚠️ [CHAT-DEBUG] No session ID received from server! Keys in response: ${Object.keys(parsedData).join(", ")} ⚠️⚠️⚠️`,
									);
									console.log(
										`⚠️⚠️⚠️ [CHAT-DEBUG] Full parsedData: ${JSON.stringify(parsedData)} ⚠️⚠️⚠️`,
									);
								}
								break;

							case "text":
								if (parsedData.content) {
									streamedContent += parsedData.content;
									setMessages((prev) =>
										prev.map((msg) =>
											msg.id === responseId
												? { ...msg, content: streamedContent }
												: msg,
										),
									);
								}
								break;

							case "done":
								// Message is complete
								console.log("Stream completed successfully");
								break;

							case "error":
								throw new Error(parsedData.error || "Unknown error in stream");
						}
					} catch (parseError) {
						console.error("Error parsing SSE data:", parseError);
					}
				}
			}

			// Finalize streaming
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === responseId ? { ...msg, isStreaming: false } : msg,
				),
			);

			setIsTyping(false);

			// Always update the session ID if we got one from the server
			// This critical step ensures all messages go to the same conversation
			if (tempSessionId) {
				console.log(
					`🎯🎯🎯 [CHAT-DEBUG] SETTING SESSION ID: ${tempSessionId} (current: ${sessionId || "undefined"}) 🎯🎯🎯`,
				);

				// Always update the session ID state and ref, even if we think we have the same one
				// This ensures client and server state are synchronized
				setSessionId(tempSessionId);
				latestSessionIdRef.current = tempSessionId;

				// Always update the URL to match the session ID
				// This ensures the user is on the correct route for this conversation
				if (pathname !== `/chat/${tempSessionId}`) {
					console.log(`Updating URL to match session: /chat/${tempSessionId}`);

					// Instead of navigation, update the browser URL quietly without a page change
					if (window.history?.replaceState) {
						try {
							// Quietly update the URL without triggering navigation
							window.history.replaceState({}, "", `/chat/${tempSessionId}`);
							console.log(
								"🔄🔄🔄 [CHAT-DEBUG] URL quietly updated using history.replaceState 🔄🔄🔄",
							);
						} catch (err) {
							console.error("History API error:", err);
							// Fallback to router.replace only if history API fails
							router.replace(`/chat/${tempSessionId}`);
						}
					}

					// Hard page refresh as a last resort if needed - uncomment if router.replace doesn't work
					// window.location.href = `/chat/${tempSessionId}`;
				}

				// Longer delay to ensure state is updated before any subsequent queries
				// This is critical to prevent race conditions with session ID updates
				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			// Refetch messages after streaming completes
			if (tempSessionId) {
				console.log("Refetching messages after streaming completes");
				try {
					await messagesQuery.refetch();
				} catch (refetchError) {
					console.error("Error refetching messages:", refetchError);
				}
			}
		} catch (error) {
			console.error("Streaming error:", error);

			// Show error message
			setMessages((prev) => [
				...prev.filter((msg) => !msg.isLoading && !msg.isStreaming),
				{
					id: `error-${generateId()}`,
					role: "assistant",
					content: `Sorry, I encountered an error while generating a response: ${error instanceof Error ? error.message : "Unknown error"}`,
					timestamp: new Date(),
				},
			]);

			setIsTyping(false);

			toast({
				title: "Streaming Error",
				description:
					error instanceof Error ? error.message : "Failed to stream response",
				variant: "destructive",
			});
		}
	};

	// Handle new scenario from header
	const handleNewScenario = () => {
		setSelectedScenario(null);
		endScenario(); // End any active conversational scenario
		setShowWelcomeBanner(true);
		setMessages([]);
		setInput("");
		// Navigate to base chat route to start fresh
		router.push("/chat");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	// Get source icon based on type
	const getSourceIcon = (type?: string) => {
		switch (type) {
			case "manual":
				return <BookOpen className="h-3.5 w-3.5" />;
			case "guideline":
				return <FileText className="h-3.5 w-3.5" />;
			case "publication":
				return <BookOpen className="h-3.5 w-3.5" />;
			default:
				return <FileText className="h-3.5 w-3.5" />;
		}
	};

	// Handlers for new scenario picker - Enhanced for rich scenarios
	const handleScenarioSelect = async (scenario: Scenario) => {
		setSelectedScenario(scenario);
		setShowScenarioPicker(false);
		setShowWelcomeBanner(false);

		// Clear any existing messages
		setMessages([]);

		// Auto-trigger AI conversation with rich scenario context
		await initializeScenarioConversation(scenario);
	};

	// Conversational scenario selection handler
	const handleConversationalScenarioSelect = async (
		scenario: ConversationalScenario,
	) => {
		// Clear any existing selected scenario to prevent conflicts
		setSelectedScenario(null);

		// Start the conversational scenario
		startScenario(scenario);
		setShowScenarioPicker(false);
		setShowWelcomeBanner(false);
		setMessages([]);

		// Immediately start the conversation with the scenario's initial prompt
		await initializeConversationalScenario(scenario);
	};

	// Initialize conversational scenario with guided prompting
	const initializeConversationalScenario = async (
		scenario: ConversationalScenario,
	) => {
		try {
			// Save the initial scenario message to database
			console.log("Saving initial scenario message to database...");

			const saveResult = await new Promise<{
				session_id: string;
				message_id: string;
				isNewSession: boolean;
			}>((resolve, reject) => {
				saveMessageMutation.mutate(
					{
						session_id: sessionId, // Will create new session if undefined
						content: scenario.initialPrompt,
						role: "assistant",
						title: `Scenario: ${scenario.title}`,
					},
					{
						onSuccess: (data) => resolve(data),
						onError: (error) => reject(error),
					},
				);
			});

			console.log("Initial scenario message saved:", saveResult);

			// Update local session state
			setSessionId(saveResult.session_id);
			latestSessionIdRef.current = saveResult.session_id;

			// Create local message for immediate UI response
			const introMessage: Message = {
				id: saveResult.message_id,
				role: "assistant",
				content: scenario.initialPrompt,
				timestamp: new Date(),
			};

			setMessages([introMessage]);

			// Update URL if we created a new session
			if (
				saveResult.isNewSession &&
				window.history &&
				window.history.replaceState
			) {
				try {
					window.history.replaceState({}, "", `/chat/${saveResult.session_id}`);
					console.log(`URL updated to /chat/${saveResult.session_id}`);
				} catch (err) {
					console.error("History API error:", err);
				}
			}

			// Focus input for user response
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		} catch (error) {
			console.error("Error initializing conversational scenario:", error);

			// Fallback to local-only message if database save fails
			const introMessage: Message = {
				id: `scenario-intro-${generateId()}`,
				role: "assistant",
				content: scenario.initialPrompt,
				timestamp: new Date(),
			};
			setMessages([introMessage]);

			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	};

	// Initialize rich scenario conversation with immediate AI response
	const initializeScenarioConversation = async (scenario: Scenario) => {
		// Get API key from localStorage and clean it
		const apiKey = localStorage.getItem(`${provider}_api_key`);
		const cleanedApiKey = apiKey?.trim().replace(/['"]/g, "");

		// Create a user message that triggers the scenario
		const triggerMessage: Message = {
			id: `trigger-${generateId()}`,
			role: "user",
			content: `Start emergency scenario: ${scenario.title}`,
			timestamp: new Date(),
		};

		// Add loading indicator for AI response
		const loadingMessage: Message = {
			id: `loading-${generateId()}`,
			role: "assistant",
			content: "",
			timestamp: new Date(),
			isLoading: true,
		};

		setMessages([triggerMessage, loadingMessage]);

		try {
			// Use current session or let backend create new one
			const currentSessionId = sessionId || "";

			// Make API call with scenario context in system prompt
			const response = await fetch("/api/chat/stream", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					session_id: currentSessionId,
					messages: [
						{
							role: "user",
							content: `EMERGENCY SCENARIO START: ${scenario.title}`,
							timestamp: new Date().toISOString(),
						},
					],
					provider,
					model,
					temperature,
					maxTokens,
					// Use scenario's detailed system prompt
					systemPrompt: scenario.systemPrompt,
					apiKey: cleanedApiKey,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to start scenario");
			}

			// Process streaming response
			const reader = response.body?.getReader();
			if (!reader) throw new Error("No response stream");

			let aiResponse = "";
			const decoder = new TextDecoder();

			// Remove loading message and add AI response
			setMessages((prev) => prev.filter((m) => !m.isLoading));

			const aiMessage: Message = {
				id: `ai-${generateId()}`,
				role: "assistant",
				content: "",
				timestamp: new Date(),
				isStreaming: true,
			};

			setMessages((prev) => [...prev, aiMessage]);

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split("\n");

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						try {
							const data = JSON.parse(line.slice(6));
							if (data.content) {
								aiResponse += data.content;
								setMessages((prev) =>
									prev.map((m) =>
										m.id === aiMessage.id ? { ...m, content: aiResponse } : m,
									),
								);
							}
						} catch (e) {
							// Ignore parsing errors
						}
					}
				}
			}

			// Mark streaming as complete
			setMessages((prev) =>
				prev.map((m) =>
					m.id === aiMessage.id ? { ...m, isStreaming: false } : m,
				),
			);
		} catch (error) {
			console.error("Error starting scenario:", error);

			// Remove loading message and show error
			setMessages((prev) => prev.filter((m) => !m.isLoading));

			// Fallback to scenario opening message
			const fallbackMessage: Message = {
				id: `fallback-${generateId()}`,
				role: "assistant",
				content: scenario.openingMessage,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, fallbackMessage]);
		}

		// Focus input for user interaction
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	const handleNewConversation = () => {
		setShowScenarioPicker(false);
		setShowWelcomeBanner(false);
		setSelectedScenario(null);
		endScenario(); // End any active conversational scenario
		setMessages([]);

		// Focus input
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	// Show scenario picker when ending scenario
	const handleEndScenario = () => {
		endScenario();
		setSelectedScenario(null);
		setShowScenarioPicker(true);
		setMessages([]);
	};

	const handleOpenScenarioOverlay = () => {
		setShowScenarioOverlay(true);
	};

	const handleCloseScenarioOverlay = () => {
		setShowScenarioOverlay(false);
	};

	const handleOverlayScenarioSelect = async (scenario: Scenario) => {
		// Close overlay first
		setShowScenarioOverlay(false);

		// Start new conversation with enhanced scenario
		setSelectedScenario(scenario);
		setMessages([]);

		// Navigate to new chat if we're in a specific session
		if (sessionId) {
			router.push("/chat");
			return;
		}

		// Auto-trigger AI conversation with rich scenario context
		await initializeScenarioConversation(scenario);
	};

	return (
		<div
			className={cn(
				"flex h-screen flex-col",
				"bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
				"from-background/80 via-background/90 to-background",
				"bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTEwIDEwaDR2MTBoMTB2NGgtMTB2MTBoLTR2LTEwaC0xMHYtNGgxMHogTTQwIDQwaDR2MTBoMTB2NGgtMTB2MTBoLTR2LTEwaC0xMHYtNGgxMHoiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==')]",
			)}
		>
			<div
				className={cn(
					"sticky top-0 z-10 border-b backdrop-blur-sm",
					"border-border/50 bg-background/90 shadow-sm",
				)}
			>
				<ChatHeader
					title={tUi("aiAssistant")}
					description={tUi("aiDescription")}
					onNewScenario={handleOpenScenarioOverlay}
					onSelectScenario={handleScenarioSelect}
					showNewScenario={messages.length > 0 || !showScenarioPicker}
					showUtilityControls={true}
				/>
			</div>

			{/* Conversational Scenario Picker - shown when no messages and picker is enabled */}
			{messages.length === 0 && showScenarioPicker && (
				<ConversationalScenarioPicker
					onScenarioSelect={handleConversationalScenarioSelect}
					className="flex-1 overflow-y-auto"
				/>
			)}

			{/* Chat interface - shown when there are messages or picker is hidden */}
			{(messages.length > 0 || !showScenarioPicker) && (
				<div className="flex flex-1 flex-col overflow-hidden p-2 sm:p-6">
					<Card
						className={cn(
							"flex flex-1 flex-col overflow-hidden rounded-2xl shadow-xl",
							"border-border/50 bg-card/60 backdrop-blur-sm",
						)}
					>
						<CardContent className="flex-1 overflow-hidden p-0">
							<div className="flex h-full flex-col">
								<div
									ref={containerRef}
									className={cn(
										"hide-scrollbar flex-1 space-y-7 overflow-y-auto",
										messages.length === 0 ? "p-0" : "p-3 sm:p-5",
									)}
								>
									<AnimatePresence initial={false}>
										{/* Scenario information banner - shown when any scenario is active */}
										{(currentScenario || selectedScenario) && (
											<motion.div
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												className="mb-4 rounded-lg border bg-muted/30 p-4"
											>
												<div className="flex items-center gap-3">
													<div
														className={cn(
															"flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white",
															"from-red-500 to-red-600",
														)}
													>
														{/* Prioritize currentScenario (conversational) over selectedScenario (legacy) */}
														{currentScenario ? (
															<currentScenario.icon className="h-4 w-4" />
														) : selectedScenario ? (
															<selectedScenario.icon className="h-4 w-4" />
														) : null}
													</div>
													<div>
														<h4 className="font-medium text-sm">
															{currentScenario?.title ||
																selectedScenario?.title}
														</h4>
														<p className="text-muted-foreground text-xs">
															{currentScenario?.description ||
																selectedScenario?.description}
														</p>
														{/* Show training badge only for conversational scenarios */}
														{currentScenario && (
															<div className="mt-1 flex items-center gap-2">
																<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800 text-xs">
																	{tUi("conversationalTraining")}
																</span>
																<span className="text-muted-foreground text-xs">
																	{currentScenario.estimatedDuration}min
																</span>
															</div>
														)}
													</div>
												</div>
											</motion.div>
										)}
										{messages.map((message) => (
											<motion.div
												key={message.id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.35, ease: "easeOut" }}
												className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} relative`}
											>
												<div
													className={`flex max-w-[90%] items-start gap-3.5 sm:max-w-[72%] ${
														message.role === "user" ? "flex-row-reverse" : ""
													}`}
												>
													<motion.div
														initial={{ scale: 0.8, rotate: -5 }}
														animate={{ scale: 1, rotate: 0 }}
														transition={{
															type: "spring",
															stiffness: 500,
															damping: 20,
														}}
														className={cn(
															"flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-xl border shadow-md",
															message.role === "user"
																? "border-slate-400/50 bg-gradient-to-br from-slate-200/90 to-slate-100/90 text-slate-700 shadow-slate-500/5 dark:border-slate-800/30 dark:from-slate-900/40 dark:to-slate-800/30 dark:text-slate-100"
																: "border-red-200/50 bg-gradient-to-br from-red-100/90 to-red-50/90 text-red-700 shadow-red-500/5 dark:border-red-800/30 dark:from-red-900/40 dark:to-red-800/30 dark:text-red-200",
														)}
													>
														{message.role === "user" ? (
															<User className="h-5 w-5" />
														) : (
															<motion.div
																animate={{ rotate: [0, 10, 0] }}
																transition={{ duration: 0.5, delay: 0.2 }}
																className="h-5 w-5 overflow-hidden"
															>
																<img
																	src="/mascot.svg"
																	alt="Red Cross Mascot"
																	className="h-full w-full object-cover"
																/>
															</motion.div>
														)}
													</motion.div>

													<div className="w-full space-y-3.5">
														<motion.div
															initial={{ opacity: 0, y: 10 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{ duration: 0.2 }}
															className={cn(
																"rounded-2xl border px-5 py-4 shadow-sm",
																message.role === "user"
																	? "border-slate-400/50 bg-gradient-to-r from-slate-200/90 to-slate-100/90 text-slate-900 shadow-slate-500/5 dark:border-slate-800/30 dark:bg-gradient-to-r dark:from-slate-900/40 dark:to-slate-800/30 dark:text-slate-100 dark:shadow-slate-950/10"
																	: "border-red-200/50 bg-gradient-to-r from-red-100/90 to-red-50/90 text-foreground shadow-red-500/5 dark:border-red-800/30 dark:bg-gradient-to-r dark:from-red-900/40 dark:to-red-800/30 dark:text-red-100 dark:shadow-red-950/10",
															)}
														>
															{message.isLoading ? (
																<div className="flex items-center justify-center py-6">
																	<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
																</div>
															) : (
																<p className="text-sm leading-relaxed">
																	{message.content}
																</p>
															)}
														</motion.div>

														{/* Sources button row */}
														<div className="flex items-center justify-between px-1">
															<div
																className={cn(
																	"flex items-center gap-1.5 rounded-full px-1.5 py-0.5 font-medium text-xs",
																	message.role === "user"
																		? "bg-gradient-to-r from-slate-200/50 to-slate-100/50 text-slate-700 dark:bg-gradient-to-r dark:from-slate-900/40 dark:to-slate-800/30 dark:text-slate-300"
																		: "bg-gradient-to-r from-red-100/50 to-red-50/50 text-red-700/70 dark:bg-gradient-to-r dark:from-red-900/40 dark:to-red-800/30 dark:text-red-200",
																)}
															>
																<div
																	className={cn(
																		"h-1.5 w-1.5 rounded-full",
																		message.role === "user"
																			? "bg-primary/70"
																			: "bg-red-500/70",
																	)}
																/>
																{formatTime(message.timestamp)}
															</div>
														</div>
													</div>
												</div>
											</motion.div>
										))}
										<div ref={messagesEndRef} className="h-4" />
									</AnimatePresence>
								</div>

								<Separator className="my-0 bg-border/50" />

								<div className="bg-muted/70 p-4 backdrop-blur-sm sm:p-5">
									<div className="relative">
										<Input
											ref={inputRef}
											placeholder={tUi("askAboutFirstAid")}
											value={input}
											onChange={(e) => setInput(e.target.value)}
											onKeyDown={handleKeyDown}
											className="rounded-xl border-border/60 bg-background/80 py-6 pr-24 text-base shadow-sm transition-all duration-200 focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-offset-0"
										/>
										<div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-700/80 hover:text-zinc-300"
														>
															<Paperclip className="h-4 w-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent side="top" sideOffset={5}>
														{tUi("attachFile")}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-700/80 hover:text-zinc-300"
														>
															<ImageIcon className="h-4 w-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent side="top" sideOffset={5}>
														{tUi("attachImage")}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															onClick={handleSend}
															disabled={!input.trim()}
															size="icon"
															className={cn(
																"h-10 w-10 rounded-full shadow-md transition-all duration-300",
																!input.trim()
																	? "cursor-not-allowed bg-primary/30 text-primary-foreground/60"
																	: "bg-primary/90 text-primary-foreground hover:scale-105 hover:bg-primary active:scale-95",
															)}
														>
															<Send className="h-4 w-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent side="top" sideOffset={5}>
														{tUi("sendMessage")}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
									</div>
									<div className="mt-3.5 flex items-center justify-between px-1">
										<div className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 font-medium text-muted-foreground text-xs">
											{isTyping ? (
												<motion.span
													className="flex items-center"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
												>
													<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
													{tUi("aiTyping")}
												</motion.span>
											) : (
												<span className="flex items-center">
													<Heart className="mr-1.5 h-3 w-3 fill-red-500 stroke-red-500" />
													<span>{tUi("poweredBy")}</span>
												</span>
											)}
										</div>

										<div className="hidden items-center gap-2 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground sm:flex">
											<div className="flex items-center">
												<kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-muted-foreground">
													{tUi("enterToSend")}
												</kbd>
												<span className="mx-1.5 text-muted-foreground">
													{tUi("toSend")}
												</span>
											</div>
											<div className="flex items-center">
												<kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-muted-foreground">
													{tUi("shiftEnterNewLine")}
												</kbd>
												<span className="ml-1.5 text-muted-foreground">
													{tUi("forNewLine")}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Scenario Overlay - shown when overlay is triggered */}
			<AnimatePresence>
				{showScenarioOverlay && (
					<ScenarioPicker
						onSelectScenario={handleOverlayScenarioSelect}
						onClose={handleCloseScenarioOverlay}
						isOverlay={true}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
