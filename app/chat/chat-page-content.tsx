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

import { usePathname, useRouter } from "next/navigation";
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
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { useSettingsStore } from "../../stores/settings";
import { ChatHeader } from "./components/chat-header";
import { formatSourceDate, formatTime, generateId } from "./utils";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	isLoading?: boolean;
	isStreaming?: boolean;
	sources?: {
		title: string;
		url: string;
		date?: string;
		type?: "article" | "manual" | "guideline" | "publication";
	}[];
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
	sources: unknown;
};

// Wrap the main component in an error boundary
export function ChatPageWrapper({ initialSessionId }: ChatPageProps) {
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
				<h1 className="mb-4 font-bold text-2xl">Something went wrong</h1>
				<p className="mb-4">There was an error loading the chat interface.</p>
				<button
					type="button"
					className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					onClick={() => window.location.reload()}
				>
					Refresh Page
				</button>
			</div>
		);
	}

	return <ChatPageImpl initialSessionId={initialSessionId} />;
}

// Main chat component implementation
function ChatPageImpl({ initialSessionId }: ChatPageProps) {
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
	const [expandedSources, setExpandedSources] = useState<string | null>(null);
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
		
		// Register router event handlers
		router.events?.on('routeChangeStart', handleRouteChangeStart);
		router.events?.on('routeChangeComplete', handleRouteChangeComplete);
		router.events?.on('routeChangeError', handleRouteChangeError);
		
		return () => {
			// Clean up event handlers
			router.events?.off('routeChangeStart', handleRouteChangeStart);
			router.events?.off('routeChangeComplete', handleRouteChangeComplete);
			router.events?.off('routeChangeError', handleRouteChangeError);
		};
	}, [router]);

	// Extract session ID from URL if not provided as prop
	// This is critical for synchronizing the UI state with the URL
	useEffect(() => {
		// If we're on a specific chat URL (e.g. /chat/123-456-789)
		if (
			pathname.includes("/chat/") &&
			pathname !== "/chat/settings"
		) {
			const urlSessionId = pathname.split("/").pop();
			
			// Only update if we have a valid session ID in the URL that differs from current state
			if (urlSessionId && urlSessionId !== sessionId) {
				console.log(`Updating session ID from URL: ${urlSessionId}`);
				setSessionId(urlSessionId);
				latestSessionIdRef.current = urlSessionId; // Update ref for latest session ID
			}
		} else if (pathname === "/chat") {
			// If we're on the base /chat route, we should be ready for a new session
			// but only clear the session ID if we're not on an existing session page
			if (sessionId && !initialSessionId) {
				console.log("Base chat route detected, clearing session ID for new conversation");
				setSessionId(undefined);
				latestSessionIdRef.current = undefined; // Update ref for latest session ID
				setMessages([]);
			}
		}
	}, [initialSessionId, pathname, sessionId]);

	// tRPC mutations and queries
	const sendMessageMutation = api.chat.sendMessage.useMutation({
		onSuccess: (data) => {
			// Always update the sessionId if we get a response, even if we think we have one
			// This ensures consistency between client state and server state
			setSessionId(data.session_id);
			latestSessionIdRef.current = data.session_id; // Update ref for latest session ID
			
			// Always update the URL to reflect the correct session
			// This is critical to fix the issue with messages being split across sessions
			if (pathname !== `/chat/${data.session_id}`) {
				console.log(`⚡⚡⚡ [CHAT-DEBUG] Redirecting to correct session: /chat/${data.session_id} ⚡⚡⚡`);
				
				// For the base /chat route, force a hard redirect to ensure synchronization
				if (pathname === '/chat') {
					console.log(`🚨🚨🚨 [CHAT-DEBUG] Using HARD REDIRECT for /chat base route! 🚨🚨🚨`);
					// Use window.location for a full page refresh and redirect
					window.location.href = `/chat/${data.session_id}`;
					return; // Exit early as we're doing a full page navigation
				} else {
					// For other routes, use replace for smoother navigation
					console.log(`🔄🔄🔄 [CHAT-DEBUG] Using router.replace for non-base route 🔄🔄🔄`);
					router.replace(`/chat/${data.session_id}`, { scroll: false });
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
					// Note: Sources would come from the backend in a real implementation
					// Currently, we'll leave sources empty as we're not mocking them
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
		{ session_id: sessionId || "" }, // Provide empty string as fallback (query is disabled when sessionId is falsy)
		{
			enabled: !!sessionId, // Only enable query when sessionId exists
			refetchOnMount: true, // This ensures it runs when session ID is updated
			refetchOnWindowFocus: false,
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
				// Only update if we have messages and it's not the initial welcome message
				const formattedMessages = messagesQuery.data.map(
					(msg: ChatMessageFromDB) => ({
						id: msg.id,
						role: msg.role as "user" | "assistant",
						content: msg.content,
						timestamp: new Date(msg.timestamp),
						sources: msg.sources
							? (msg.sources as Message["sources"])
							: undefined,
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
			console.log(`Message sending prevented: ${isTyping ? 'AI is still responding' : 'Navigation in progress'}`);
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
		const cleanedApiKey = apiKey.trim().replace(/['"]/g, '');
		
		// Basic validation of API key format
		const isValidFormat = (provider === "mistral" && cleanedApiKey.length >= 20) ||
		                     (provider === "openai" && (cleanedApiKey.startsWith("sk-") || cleanedApiKey.length >= 30)) ||
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

		const userMessage: Message = {
			id: `user-${generateId()}`,
			role: "user",
			content: input,
			timestamp: new Date(),
		};

		// Add user message to UI
		setMessages((prev) => [...prev, userMessage]);
		setInput("");

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
			console.log(`Sending message with sessionId: ${currentSessionId || 'creating new session'}`);
			
			if (streamingEnabled) {
				// Use streaming endpoint
				await handleStreamingResponse(userMessage.content);
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
	const handleStreamingResponse = async (content: string) => {
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
			console.log(`Using API key for ${provider}: ${apiKey ? 'Key present (length: ' + apiKey.length + ')' : 'Not found'}`);
			
			// Ensure API key doesn't have any whitespace or quotes
			const cleanedApiKey = apiKey?.trim().replace(/['"]/g, '');

			// Capture the current session ID before making the request
			// This is important to avoid race conditions where the session ID
			// might change while we're waiting for the response
			const currentSessionId = sessionId;
			console.log(`🔍🔍🔍 [CHAT-DEBUG] Streaming with session ID: ${currentSessionId || 'creating new session'} 🔍🔍🔍`);
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
					// Pass the system prompt from settings
					systemPrompt,
					// Include API key for development mode (will only be used if server env vars aren't set)
					apiKey: cleanedApiKey,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				
				// Special handling for authentication errors
				if (response.status === 401 || response.status === 403) {
					const errorMsg = errorData?.message || errorData?.error || "Authentication failed";
					console.error(`API Authentication error (${response.status}):`, errorData);
					
					// Add more descriptive message
					throw new Error(
						`Authentication error: ${errorMsg}. Please check your API key for ${provider} in settings.`
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
									console.log(`📌📌📌 [CHAT-DEBUG] Server returned session ID: ${parsedData.session_id}, Current path: ${pathname} 📌📌📌`);
								} else {
									console.log(`⚠️⚠️⚠️ [CHAT-DEBUG] No session ID received from server! Keys in response: ${Object.keys(parsedData).join(', ')} ⚠️⚠️⚠️`);
									console.log(`⚠️⚠️⚠️ [CHAT-DEBUG] Full parsedData: ${JSON.stringify(parsedData)} ⚠️⚠️⚠️`);
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
				console.log(`🎯🎯🎯 [CHAT-DEBUG] SETTING SESSION ID: ${tempSessionId} (current: ${sessionId || 'undefined'}) 🎯🎯🎯`);
				
				// Always update the session ID state and ref, even if we think we have the same one
				// This ensures client and server state are synchronized
				setSessionId(tempSessionId);
				latestSessionIdRef.current = tempSessionId;

				// Always update the URL to match the session ID
				// This ensures the user is on the correct route for this conversation
				if (pathname !== `/chat/${tempSessionId}`) {
					console.log(`Updating URL to match session: /chat/${tempSessionId}`);
					
					// Use replace instead of push for immediate URL replacement without history entry
					router.replace(`/chat/${tempSessionId}`, { scroll: false });
					console.log(`URL replacement initiated for session: ${tempSessionId}`);
					
					// For the base /chat route, force a hard redirect to ensure synchronization
					if (pathname === '/chat' && tempSessionId) {
						console.log(`🚨🚨🚨 [CHAT-DEBUG] Using HARD REDIRECT for streaming response on /chat base route! 🚨🚨🚨`);
						// Use window.location for a full page refresh and redirect
						// No delay needed - immediately redirect
						window.location.href = `/chat/${tempSessionId}`;
						return; // Exit early to prevent further processing
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

	// Toggle source expansion for a specific message
	const toggleSourceExpansion = (messageId: string) => {
		setExpandedSources((prev) => (prev === messageId ? null : messageId));
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
					title="AI Assistant"
					description="Ask questions and get personalized first aid guidance"
				/>
			</div>

			<div className="flex flex-1 flex-col overflow-hidden p-2 sm:p-6">
				{/* Welcome banner */}
				{showWelcomeBanner && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className={cn(
							"relative mb-4 rounded-2xl p-5 shadow-md",
							"border border-red-500/20 bg-gradient-to-br from-red-100 to-red-50",
							"dark:border-red-900/20 dark:from-red-950/30 dark:to-red-900/10",
						)}
					>
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-3 right-3 h-7 w-7 rounded-full text-muted-foreground hover:bg-background/80 hover:text-foreground"
							onClick={() => setShowWelcomeBanner(false)}
						>
							<XCircle className="h-4 w-4" />
							<span className="sr-only">Close welcome banner</span>
						</Button>
						<div className="flex items-start gap-5">
							<div
								className={cn(
									"flex h-14 w-14 shrink-0 select-none items-center justify-center rounded-2xl shadow-md",
									"bg-gradient-to-br from-red-700 to-red-800 text-red-100 shadow-red-700/10",
								)}
							>
								<Heart className="h-7 w-7" strokeWidth={2.5} />
							</div>
							<div>
								<h3 className="mb-1.5 font-semibold text-foreground text-xl">
									Welcome to Red Cross AI Assistant
								</h3>
								<p className="text-foreground/90 leading-relaxed">
									I can help you with first aid procedures, emergency response
									protocols, and CPR techniques. Ask me anything about safety
									training and medical emergencies!
								</p>
							</div>
						</div>
					</motion.div>
				)}

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
								className="hide-scrollbar flex-1 space-y-7 overflow-y-auto p-3 sm:p-5"
							>
								<AnimatePresence initial={false}>
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

														{message.sources && message.sources.length > 0 && (
															<motion.div
																initial={{ opacity: 0 }}
																animate={{ opacity: 1 }}
																transition={{ delay: 0.5 }}
															>
																<Button
																	variant={
																		expandedSources === message.id
																			? "secondary"
																			: "outline"
																	}
																	size="sm"
																	onClick={() =>
																		toggleSourceExpansion(message.id)
																	}
																	className={cn(
																		"h-7 rounded-full px-3 font-normal text-xs transition-all",
																		expandedSources === message.id
																			? "border-red-800/30 bg-red-900/40 text-red-200 hover:bg-red-900/50"
																			: "border-dashed bg-zinc-800/60 hover:bg-zinc-800/90",
																	)}
																>
																	<BookOpen className="mr-1.5 h-3 w-3" />
																	<span>
																		{message.sources.length}{" "}
																		{message.sources.length === 1
																			? "source"
																			: "sources"}
																	</span>
																</Button>
															</motion.div>
														)}
													</div>

													{/* Enhanced sources panel - more compact design with overflow fixes */}
													<AnimatePresence mode="wait">
														{expandedSources === message.id &&
															message.sources && (
																<motion.div
																	initial={{ opacity: 0, height: 0 }}
																	animate={{ opacity: 1, height: "auto" }}
																	exit={{ opacity: 0, height: 0 }}
																	transition={{ duration: 0.3 }}
																	className="overflow-hidden rounded-xl border border-zinc-700/50 bg-gradient-to-b from-zinc-800/90 to-zinc-900/80 shadow-lg shadow-zinc-950/10"
																>
																	<div className="p-2.5">
																		<div className="mb-2 flex items-center">
																			<div className="mr-1.5 rounded-md bg-red-900/30 p-1 text-red-300">
																				<LinkIcon className="h-3 w-3" />
																			</div>
																			<h4 className="font-medium text-foreground text-xs">
																				Reference Sources
																			</h4>
																		</div>

																		<ScrollArea className="scrollbar-thumb-zinc-700 pr-1.5">
																			<div className="max-h-[140px] space-y-1.5 pb-1">
																				{message.sources.map((source, idx) => (
																					<motion.div
																						key={`${source.url}-${idx}`}
																						initial={{ opacity: 0, y: 5 }}
																						animate={{ opacity: 1, y: 0 }}
																						transition={{ delay: idx * 0.1 }}
																						className="flex items-start gap-1.5 rounded-lg border border-zinc-700/40 bg-zinc-800/80 p-1.5 hover:bg-zinc-800"
																					>
																						<div
																							className={cn(
																								"flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md p-0.5",
																								source.type === "manual"
																									? "border-amber-800/40 bg-amber-900/30 text-amber-300"
																									: source.type === "guideline"
																										? "border-blue-800/40 bg-blue-900/30 text-blue-300"
																										: "border-purple-800/40 bg-purple-900/30 text-purple-300",
																								"border",
																							)}
																						>
																							{source.type === "manual" ? (
																								<BookOpen className="h-3 w-3" />
																							) : source.type ===
																								"guideline" ? (
																								<FileText className="h-3 w-3" />
																							) : (
																								<BookOpen className="h-3 w-3" />
																							)}
																						</div>

																						<div className="min-w-0 flex-1 overflow-hidden">
																							<div className="flex items-center gap-1">
																								<h5 className="truncate font-medium text-[11px]">
																									{source.title}
																								</h5>
																								<Badge
																									variant="secondary"
																									className="h-3.5 flex-shrink-0 whitespace-nowrap border-zinc-700/50 bg-zinc-900 px-1 py-0 text-[9px]"
																								>
																									{source.type || "Article"}
																								</Badge>
																							</div>
																							<p className="mt-0.5 truncate text-[10px] text-muted-foreground">
																								{source.url}
																							</p>
																							{source.date && (
																								<div className="mt-0.5 flex items-center text-[9px] text-zinc-400">
																									<Calendar className="mr-1 h-2 w-2 flex-shrink-0" />
																									<span className="truncate">
																										{formatSourceDate(
																											source.date,
																										)}
																									</span>
																								</div>
																							)}
																						</div>

																						<a
																							href={source.url}
																							target="_blank"
																							rel="noopener noreferrer"
																							className="ml-0.5 flex flex-shrink-0 items-center self-start rounded-md bg-zinc-700/70 p-1 text-zinc-300 transition-all hover:scale-105 hover:bg-zinc-700 hover:text-zinc-100"
																							title="Open source"
																						>
																							<ExternalLink className="h-2.5 w-2.5" />
																						</a>
																					</motion.div>
																				))}
																			</div>
																		</ScrollArea>
																	</div>
																</motion.div>
															)}
													</AnimatePresence>
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
										placeholder="Ask about first aid procedures, emergency response, or CPR techniques..."
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
													Attach file
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
													Attach image
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
													Send message
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
												AI is typing...
											</motion.span>
										) : (
											<span className="flex items-center">
												<Heart className="mr-1.5 h-3 w-3 fill-red-500 stroke-red-500" />
												<span>Powered by Red Cross AI</span>
											</span>
										)}
									</div>

									<div className="hidden items-center gap-2 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground sm:flex">
										<div className="flex items-center">
											<kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-muted-foreground">
												Enter
											</kbd>
											<span className="mx-1.5 text-muted-foreground">
												to send
											</span>
										</div>
										<div className="flex items-center">
											<kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-muted-foreground">
												Shift+Enter
											</kbd>
											<span className="ml-1.5 text-muted-foreground">
												for new line
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
