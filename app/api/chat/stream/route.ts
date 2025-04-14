import { NextRequest } from "next/server";
import { AIService } from "~/lib/services/ai";
import type { ChatMessage } from "~/lib/services/ai"; // Change to type-only import
import { db } from "~/server/db";
import { chatSessions, chatMessages } from "~/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

// Helper to format messages for streaming
function formatMessagesForAI(messages: any[], systemPrompt?: string): ChatMessage[] {
  // Use provided system prompt or fall back to default
  const defaultSystemPrompt = "You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately. Provide reliable information based on official Red Cross guidelines.";
  
  return [
    { role: "system", content: systemPrompt || defaultSystemPrompt },
    ...messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }))
  ];
}

// Improved SSE message formatting
function formatSSE(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[stream] Starting chat stream request");
    const cookieStore = await cookies(); // Fix: await the cookies() call
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value ?? "", // Fix: Add empty string fallback
          set: () => {}, // Not needed for this endpoint
          remove: () => {}, // Not needed for this endpoint
        },
      }
    );

    // Authenticate the user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error("[stream] Unauthorized: No user session found");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const userId = session.user.id;
    console.log(`[stream] Authenticated user: ${userId.slice(0, 8)}...`);
    
    // Parse request
    const {
      session_id,
      messages,
      provider = "mistral",
      model,
      temperature = 0.7,
      maxTokens = 4000,
      apiKey: clientApiKey,
      streamingSystemPrompt // Get custom system prompt from request
    } = await request.json();

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("[stream] Invalid messages in request");
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get API key - prefer server-side env var but fall back to client-provided key for development
    const apiKeyEnvVar = `${provider.toUpperCase()}_API_KEY`;
    const apiKey = process.env[apiKeyEnvVar] || clientApiKey;

    if (!apiKey) {
      console.error(`[stream] API key for ${provider} is not configured`);
      return new Response(JSON.stringify({ error: `API key for ${provider} is not configured` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Create or identify session
    let currentSessionId = session_id;
    let isNewSession = false;
    
    // Get user message (should be the last one)
    const userMessage = messages[messages.length - 1];
    console.log(`[stream] Processing user message: ${userMessage.content.slice(0, 30)}...`);
    
    // If no session provided, create one
    if (!currentSessionId) {
      isNewSession = true;
      console.log("[stream] No session ID provided, creating new session");
      
      // Create title from first message
      const firstLine = userMessage.content.split('\n')[0];
      const title = firstLine.length > 30 
        ? firstLine.substring(0, 30) + '...' 
        : firstLine || "New Chat";
      
      // Create session in DB
      const newSession = await db.insert(chatSessions).values({
        id: uuidv4(),
        user_id: userId,
        title,
        position: 0,
        is_pinned: false,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      }).returning();
      
      if (!newSession.length || !newSession[0]?.id) { // Fix: Add proper null check
        console.error("[stream] Failed to create chat session");
        return new Response(JSON.stringify({ error: "Failed to create chat session" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      currentSessionId = newSession[0].id;
      console.log(`[stream] Created new session with ID: ${currentSessionId}`);
    } else {
      console.log(`[stream] Using existing session ID: ${currentSessionId}`);
      // Verify session belongs to user
      const session = await db.select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.id, currentSessionId),
          eq(chatSessions.user_id, userId)
        ))
        .limit(1);
      
      if (!session.length) {
        console.error("[stream] Session not found or doesn't belong to user");
        return new Response(JSON.stringify({ error: "Chat session not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // Update session timestamp
      await db.update(chatSessions)
        .set({ updated_at: new Date() })
        .where(eq(chatSessions.id, currentSessionId));
      
      console.log(`[stream] Session timestamp updated for session: ${currentSessionId}`);
    }
    
    // Save user message to database
    const userMsgId = uuidv4();
    await db.insert(chatMessages).values({
      id: userMsgId,
      session_id: currentSessionId,
      role: "user",
      content: userMessage.content,
      timestamp: new Date()
    });
    
    console.log(`[stream] Saved user message with ID: ${userMsgId}`);
    
    // Create AI service
    const aiService = new AIService(
      provider,
      apiKey,
      model
    );

    // Format messages for AI
    const formattedMessages = formatMessagesForAI(messages, streamingSystemPrompt);
    
    // Create the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial setup event with metadata
          const setupMessage = { 
            session_id: currentSessionId,
            message_id: uuidv4()
          };
          console.log(`[stream] Sending setup event with session ID: ${setupMessage.session_id}`);
          controller.enqueue(formatSSE("setup", setupMessage));
          
          let fullResponse = "";
          
          // Generate AI response (streaming)
          console.log("[stream] Starting AI streaming response generation");
          const streamGenerator = await aiService.generateStreamingResponse(
            formattedMessages,
            {
              temperature,
              maxTokens
            }
          );
          
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
          
          console.log(`[stream] Generated full response of length: ${fullResponse.length}`);
          
          // Save assistant message
          const assistantMsgId = uuidv4();
          console.log(`[stream] Saving assistant response with ID: ${assistantMsgId}`);
          await db.insert(chatMessages).values({
            id: assistantMsgId,
            session_id: currentSessionId,
            role: "assistant",
            content: fullResponse,
            timestamp: new Date(),
            metrics: { 
              provider,
              model
            }
          });
          
          console.log(`[stream] Assistant message saved successfully to session: ${currentSessionId}`);
          
          // Send done event
          controller.enqueue(formatSSE("done", { 
            message_id: assistantMsgId,
            session_id: currentSessionId // Include session ID in done event too
          }));
          
          // Verify messages were saved correctly
          const messages = await db.select()
            .from(chatMessages)
            .where(eq(chatMessages.session_id, currentSessionId))
            .orderBy(desc(chatMessages.timestamp))
            .limit(5);
          
          console.log(`[stream] Session ${currentSessionId} now has ${messages.length} messages`);
          
          // Close the stream
          controller.close();
        } catch (error) {
          // Log error
          console.error("[stream] Streaming error:", error);
          
          // Send error to client
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(formatSSE("error", { 
            error: `Error generating response: ${errorMessage}`
          }));
          
          // Delete session if we created it and encountered an error
          if (isNewSession) {
            try {
              await db.delete(chatSessions)
                .where(eq(chatSessions.id, currentSessionId));
              console.log(`[stream] Cleaned up session ${currentSessionId} after error`);
            } catch (deleteError) {
              console.error("[stream] Error cleaning up session after error:", deleteError);
            }
          }
          
          // Close the stream
          controller.close();
        }
      }
    });
    
    // Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
  } catch (error) {
    console.error("[stream] Chat stream error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ error: `Failed to generate streaming response: ${message}` }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}