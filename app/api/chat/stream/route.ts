import { createServerClient } from "@supabase/ssr";
import { and, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { AIService } from "~/lib/services/ai";
import type { ChatMessage } from "~/lib/services/ai";
import { getDb } from "~/server/db";
import { chatMessages, chatSessions } from "~/server/db/schema";

// Define a type for the input messages
type InputMessage = {
	role: string;
	content: string;
};

// Helper to format messages for streaming
function formatMessagesForAI(
	messages: InputMessage[],
	systemPrompt?: string,
): ChatMessage[] {
	// Use provided system prompt or fall back to default
	const defaultSystemPrompt =
		"You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately. Provide reliable information based on official Red Cross guidelines.";

	return [
		{ role: "system", content: systemPrompt || defaultSystemPrompt },
		...messages.map((msg) => ({
			role: msg.role as "user" | "assistant" | "system",
			content: msg.content,
		})),
	];
}

// Improved SSE message formatting
function formatSSE(event: string, data: unknown) {
	return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
	try {
		console.log("[stream] Starting chat stream request");
		const cookieStore = await cookies();
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
		
		// Create Supabase client
		const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
			cookies: {
				get: (name) => cookieStore.get(name)?.value ?? "",
				set: () => {}, // Not needed for this endpoint
				remove: () => {}, // Not needed for this endpoint
			},
		});

		// Get authentication session
		const authResult = await supabase.auth.getSession();
		console.log("[stream] Auth result:", JSON.stringify({
			hasSession: !!authResult.data.session,
			hasUser: !!authResult.data.session?.user,
		}));

		// Require authentication
		if (!authResult.data.session?.user) {
			console.error("[stream] Unauthorized: No valid user session found");
			return new Response(JSON.stringify({ 
				error: "Unauthorized",
				message: "Authentication required. Please log in to continue."
			}), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Authentication successful
		const session = authResult.data.session;
		const userId = session.user.id;
		console.log(`[stream] Authenticated user: ${userId.slice(0, 8)}...`);

		// Parse request body
		let requestBody;
		try {
			requestBody = await request.json();
		} catch (error) {
			console.error("[stream] Failed to parse request body:", error);
			return new Response(JSON.stringify({ 
				error: "Bad Request",
				message: "Invalid request format. Expected JSON body."
			}), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Extract request parameters
		const {
			session_id,
			messages,
			provider = "mistral",
			model,
			temperature = 0.7,
			maxTokens = 4000,
			apiKey: clientApiKey,
			streamingSystemPrompt,
		} = requestBody;

		// Validate messages
		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			console.error("[stream] Invalid messages in request");
			return new Response(JSON.stringify({ 
				error: "Bad Request",
				message: "Messages must be a non-empty array"
			}), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Get API key - prefer server-side env var but fall back to client-provided key
		const apiKeyEnvVar = `${provider.toUpperCase()}_API_KEY`;
		const serverApiKey = process.env[apiKeyEnvVar];
		
		// Clean API keys (remove whitespace and quotes)
		const cleanedClientApiKey = clientApiKey?.trim().replace(/['"]/g, '');
		const cleanedServerApiKey = serverApiKey?.trim().replace(/['"]/g, '');
		
		// OVERRIDE: Temporarily force use of client key for debugging
		const apiKey = cleanedClientApiKey || cleanedServerApiKey;
		
		// Log detailed key information for debugging
		console.log(`[stream] DETAILED KEY INFO:`, {
			clientKeyLength: cleanedClientApiKey?.length || 0,
			clientKeyPrefix: cleanedClientApiKey ? cleanedClientApiKey.substring(0, 5) + '...' : 'none',
			serverKeyLength: cleanedServerApiKey?.length || 0,
			serverKeyPrefix: cleanedServerApiKey ? cleanedServerApiKey.substring(0, 5) + '...' : 'none',
			usingKey: cleanedClientApiKey ? 'CLIENT' : 'SERVER',
			usingPrefix: apiKey?.substring(0, 5) + '...'
		});
		
		// Check and warn about key mismatches
		if (cleanedClientApiKey && cleanedServerApiKey && cleanedClientApiKey !== cleanedServerApiKey) {
			console.warn(`[stream] ⚠️ WARNING: API key mismatch detected for ${provider}!
			- Server environment variable key (${apiKeyEnvVar}): ${cleanedServerApiKey.substring(0, 3)}...${cleanedServerApiKey.substring(cleanedServerApiKey.length - 3)}
			- Client-side settings key: ${cleanedClientApiKey.substring(0, 3)}...${cleanedClientApiKey.substring(cleanedClientApiKey.length - 3)}
			This might cause issues if your server is preferring environment variables. Currently using: ${apiKey === cleanedServerApiKey ? 'SERVER' : 'CLIENT'} key.`);
		}

		// Add detailed logging for API key handling
		console.log(`[stream] API key info:`, {
			provider,
			hasServerKey: !!serverApiKey,
			hasClientKey: !!clientApiKey,
			usingClientKey: !serverApiKey && !!clientApiKey,
			apiKeyLength: apiKey ? apiKey.length : 0,
			apiKeyPrefix: apiKey ? apiKey.substring(0, 3) + '...' : '',
		});

		if (!apiKey) {
			console.error(`[stream] API key for ${provider} is not configured`);
			return new Response(
				JSON.stringify({ 
					error: "API Key Required",
					message: `API key for ${provider} is not configured. Add it in settings.`
				}),
				{
					status: 403,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		
		// Verify API key format
		if (apiKey.length < 10 || !apiKey.match(/^[A-Za-z0-9_\-]+$/)) {
			console.error(`[stream] Invalid API key format for ${provider}`);
			return new Response(
				JSON.stringify({ 
					error: "Invalid API Key",
					message: `The API key for ${provider} appears to be invalid. Please check your settings.`
				}),
				{
					status: 403,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Make sure database connection is ready before proceeding
		const db = await getDb();

		// Check if user exists in database and create if not (auto-sync)
		try {
			const { users } = await import("~/server/db/schema");
			const { eq } = await import("drizzle-orm");

			// Check if user exists in our database
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1)
				.then((rows) => rows[0] || null);

			if (!existingUser) {
				console.log(
					`[stream] User ${userId.slice(0, 8)}... not found in database, auto-creating`,
				);
				// Create user record
				await db.insert(users).values({
					id: userId,
					email: session.user.email || "",
				});
				console.log(
					`[stream] User ${userId.slice(0, 8)}... created successfully`,
				);
			}
		} catch (error) {
			console.error(
				`[stream] Error syncing user: ${error instanceof Error ? error.message : String(error)}`,
			);
			// Continue despite user sync error - this is non-critical
		}

		// Create or identify session
		let currentSessionId = session_id;
		let isNewSession = false;

		// Get user message (should be the last one)
		const userMessage = messages[messages.length - 1];
		console.log(
			`[stream] Processing user message: ${userMessage.content.slice(0, 30)}...`,
		);

		// If no session provided, create one
		if (!currentSessionId) {
			isNewSession = true;
			console.log("[stream] No session ID provided, creating new session");

			// Create title from first message
			const firstLine = userMessage.content.split("\n")[0];
			const title =
				firstLine.length > 30
					? `${firstLine.substring(0, 30)}...`
					: firstLine || "New Chat";

			// Create session in DB
			const newSession = await db
				.insert(chatSessions)
				.values({
					id: uuidv4(),
					user_id: userId,
					title,
					position: 0,
					is_pinned: false,
					status: "active",
					created_at: new Date(),
					updated_at: new Date(),
				})
				.returning();

			if (!newSession.length || !newSession[0]?.id) {
				console.error("[stream] Failed to create chat session");
				return new Response(
					JSON.stringify({ error: "Failed to create chat session" }),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			currentSessionId = newSession[0].id;
			console.log(`[stream] Created new session with ID: ${currentSessionId}`);
		} else {
			console.log(`[stream] Using existing session ID: ${currentSessionId}`);
			// Verify session belongs to user
			const sessionCheck = await db
				.select()
				.from(chatSessions)
				.where(
					and(
						eq(chatSessions.id, currentSessionId),
						eq(chatSessions.user_id, userId),
					),
				)
				.limit(1);

			if (!sessionCheck.length) {
				console.error("[stream] Session not found or doesn't belong to user");
				return new Response(
					JSON.stringify({ error: "Chat session not found or unauthorized" }),
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Update session timestamp
			await db
				.update(chatSessions)
				.set({ updated_at: new Date() })
				.where(eq(chatSessions.id, currentSessionId));

			console.log(
				`[stream] Session timestamp updated for session: ${currentSessionId}`,
			);
		}

		// Save user message to database
		const userMsgId = uuidv4();
		await db.insert(chatMessages).values({
			id: userMsgId,
			session_id: currentSessionId,
			role: "user",
			content: userMessage.content,
			timestamp: new Date(),
		});

		console.log(`[stream] Saved user message with ID: ${userMsgId}`);

		// Create AI service
		const aiService = new AIService(provider, apiKey, model);

		// Format messages for AI
		const formattedMessages = formatMessagesForAI(
			messages,
			streamingSystemPrompt,
		);

		// Create the streaming response
		const stream = new ReadableStream({
			async start(controller) {
				try {
					// Send initial setup event with metadata
					const setupMessage = {
						session_id: currentSessionId,
						message_id: uuidv4(),
					};
					console.log(
						`[stream] Sending setup event with session ID: ${setupMessage.session_id}`,
					);
					controller.enqueue(formatSSE("setup", setupMessage));

					let fullResponse = "";

					// Generate AI response (streaming)
					console.log("[stream] Starting AI streaming response generation");
					
					let streamGenerator;
					try {
						streamGenerator = await aiService.generateStreamingResponse(
							formattedMessages,
							{
								temperature,
								maxTokens,
							},
						);
					} catch (streamError) {
						console.error("[stream] Error initializing stream:", streamError);
						const errorMessage = streamError instanceof Error ? streamError.message : "Unknown error";
						
						// Check specifically for auth errors
						const isAuthError = 
							errorMessage.includes("401") || 
							errorMessage.includes("auth") || 
							errorMessage.includes("Unauthorized") ||
							errorMessage.includes("Invalid API key");
							
						if (isAuthError) {
							throw new Error(`Authentication failed with provider: ${provider}. Please check your API key.`);
						} else {
							throw new Error(`Failed to initialize stream with ${provider}: ${errorMessage}`);
						}
					}

					// Stream chunks to the client
					for await (const chunk of streamGenerator) {
						if (chunk.content) {
							// Send each chunk as a 'text' event
							controller.enqueue(formatSSE("text", { content: chunk.content }));
							fullResponse += chunk.content;
						}

						if (chunk.done) {
							break;
						}
					}

					console.log(
						`[stream] Generated full response of length: ${fullResponse.length}`,
					);

					// Save assistant message
					const assistantMsgId = uuidv4();
					console.log(
						`[stream] Saving assistant response with ID: ${assistantMsgId}`,
					);
					await db.insert(chatMessages).values({
						id: assistantMsgId,
						session_id: currentSessionId,
						role: "assistant",
						content: fullResponse,
						timestamp: new Date(),
						metrics: {
							provider,
							model,
						},
					});

					console.log(
						`[stream] Assistant message saved successfully to session: ${currentSessionId}`,
					);

					// Send done event
					controller.enqueue(
						formatSSE("done", {
							message_id: assistantMsgId,
							session_id: currentSessionId,
						}),
					);

					// Verify messages were saved correctly
					const messagesCheck = await db
						.select()
						.from(chatMessages)
						.where(eq(chatMessages.session_id, currentSessionId))
						.orderBy(desc(chatMessages.timestamp))
						.limit(5);

					console.log(
						`[stream] Session ${currentSessionId} now has ${messagesCheck.length} messages`,
					);

					// Close the stream
					controller.close();
				} catch (error) {
					// Log error
					console.error("[stream] Streaming error:", error);

					// Send error to client
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					controller.enqueue(
						formatSSE("error", {
							error: `Error generating response: ${errorMessage}`,
						}),
					);

					// Delete session if we created it and encountered an error
					if (isNewSession) {
						try {
							const db = await getDb();
							await db
								.delete(chatSessions)
								.where(eq(chatSessions.id, currentSessionId));
							console.log(
								`[stream] Cleaned up session ${currentSessionId} after error`,
							);
						} catch (deleteError) {
							console.error(
								"[stream] Error cleaning up session after error:",
								deleteError,
							);
						}
					}

					// Close the stream
					controller.close();
				}
			},
		});

		// Return streaming response
		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"X-Accel-Buffering": "no", // Tells Nginx not to buffer this response
			},
		});
	} catch (error) {
		console.error("[stream] Chat stream error:", error);
		const message = error instanceof Error ? error.message : "Unknown error";

		return new Response(
			JSON.stringify({
				error: `Failed to generate streaming response: ${message}`,
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}