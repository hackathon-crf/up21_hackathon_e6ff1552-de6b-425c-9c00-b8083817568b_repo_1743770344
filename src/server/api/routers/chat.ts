import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { chatSession, chatMessage, feedback } from "../../db/schema";
import { and, desc, eq, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { AIService, ChatMessage } from "~/lib/services/ai";
import { TRPCError } from "@trpc/server";

// Helper to extract title from first message
function generateTitleFromMessage(content: string): string {
  // Take first line or first 30 chars as title
  const firstLine = content.split('\n')[0];
  const title = firstLine.length > 30 
    ? firstLine.substring(0, 30) + '...'
    : firstLine;
  return title || "New Chat";
}

export const chatRouter = createTRPCRouter({
  // Create a new chat session
  createSession: protectedProcedure
    .input(z.object({
      title: z.string().default("New Chat"),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[chat.createSession] - Request received with input:", input);
      
      const userId = ctx.auth.user?.id;
      if (!userId) {
        console.error("[chat.createSession] - Unauthorized: No user ID found in context");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a chat session"
        });
      }
      
      // Ensure we have a title, even if it wasn't provided
      const title = input.title || "New Chat";
      console.log(`[chat.createSession] - Creating session with title "${title}" for user: ${userId.slice(0, 8)}...`);
      
      try {
        const session = await db.insert(chatSession).values({
          id: uuidv4(),
          userId,
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        
        if (!session.length) {
          console.error("[chat.createSession] - Failed to create session - no rows returned");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create chat session"
          });
        }
        
        console.log(`[chat.createSession] - Successfully created session: ${session[0].id}`);
        return session[0];
      } catch (error) {
        console.error("[chat.createSession] - Database error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create chat session due to a database error",
          cause: error,
        });
      }
    }),

  // Get a specific session
  getSession: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access chat sessions"
        });
      }
      
      const session = await db.select()
        .from(chatSession)
        .where(and(
          eq(chatSession.id, input.sessionId),
          eq(chatSession.userId, userId)
        ))
        .limit(1);
      
      if (!session.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found"
        });
      }
      
      return session[0];
    }),

  // Get a user's chat sessions
  getSessions: protectedProcedure
    .query(async ({ ctx }) => {
      console.log("[chat.getSessions] - Request received");
      const userId = ctx.auth.user?.id;
      
      if (!userId) {
        console.error("[chat.getSessions] - Unauthorized: No user ID found in context");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access chat sessions"
        });
      }
      
      console.log(`[chat.getSessions] - Fetching sessions for user: ${userId.slice(0, 8)}...`);
      try {
        const sessions = await db.select()
          .from(chatSession)
          .where(eq(chatSession.userId, userId))
          .orderBy(desc(chatSession.updatedAt));
        console.log(`[chat.getSessions] - Successfully fetched ${sessions.length} sessions for user: ${userId.slice(0, 8)}...`);
        return sessions;
      } catch (error) {
        console.error(`[chat.getSessions] - Database error fetching sessions for user ${userId.slice(0, 8)}...:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch chat sessions due to a database error",
          cause: error, // Keep original error cause
        });
      }
    }),

  // Delete a chat session
  deleteSession: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete chat sessions"
        });
      }
      
      // Verify session belongs to user
      const session = await db.select()
        .from(chatSession)
        .where(and(
          eq(chatSession.id, input.sessionId),
          eq(chatSession.userId, userId)
        ))
        .limit(1);
      
      if (!session.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found"
        });
      }
      
      // Delete session (cascade will delete messages)
      await db.delete(chatSession)
        .where(eq(chatSession.id, input.sessionId));
      
      return { success: true };
    }),

  // Get messages from a specific session
  getMessages: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access chat messages"
        });
      }
      
      // Verify the session belongs to the user
      const session = await db.select()
        .from(chatSession)
        .where(and(
          eq(chatSession.id, input.sessionId),
          eq(chatSession.userId, userId)
        ))
        .limit(1);
      
      if (!session.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found"
        });
      }
      
      return await db.select()
        .from(chatMessage)
        .where(eq(chatMessage.sessionId, input.sessionId))
        .orderBy(asc(chatMessage.timestamp));
    }),

  // Update session title
  updateSessionTitle: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      title: z.string().min(1).max(256),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update chat sessions"
        });
      }
      
      // Verify session belongs to user
      const session = await db.select()
        .from(chatSession)
        .where(and(
          eq(chatSession.id, input.sessionId),
          eq(chatSession.userId, userId)
        ))
        .limit(1);
      
      if (!session.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found"
        });
      }
      
      const updated = await db.update(chatSession)
        .set({
          title: input.title,
          updatedAt: new Date(),
        })
        .where(eq(chatSession.id, input.sessionId))
        .returning();
      
      return updated[0];
    }),

  // Send message and get AI response
  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid().optional(),
      content: z.string().min(1),
      provider: z.string().optional(),
      model: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
      maxTokens: z.number().int().positive().optional(),
      ragEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to send messages"
        });
      }
      
      // Get or create session
      let sessionId = input.sessionId;
      let isNewSession = false;
      
      if (!sessionId) {
        // Create new session
        const newSession = await db.insert(chatSession).values({
          id: uuidv4(),
          userId,
          title: generateTitleFromMessage(input.content),
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        
        if (!newSession.length) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create chat session"
          });
        }
        
        sessionId = newSession[0].id;
        isNewSession = true;
        
      } else {
        // Verify session belongs to user
        const session = await db.select()
          .from(chatSession)
          .where(and(
            eq(chatSession.id, sessionId),
            eq(chatSession.userId, userId)
          ))
          .limit(1);
        
        if (!session.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Chat session not found"
          });
        }
        
        // Update session timestamp
        await db.update(chatSession)
          .set({ updatedAt: new Date() })
          .where(eq(chatSession.id, sessionId));
      }
      
      // Get chat history (limit to last 20 messages for context)
      const history = await db.select()
        .from(chatMessage)
        .where(eq(chatMessage.sessionId, sessionId))
        .orderBy(desc(chatMessage.timestamp))
        .limit(20);
      
      // Format messages for AI
      const systemPrompt = "You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately. Provide reliable information based on official Red Cross guidelines.";
      
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...history
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
          })),
        { role: "user", content: input.content }
      ];
      
      // Save user message
      const userMsgId = uuidv4();
      await db.insert(chatMessage).values({
        id: userMsgId,
        sessionId,
        role: "user",
        content: input.content,
        timestamp: new Date()
      });
      
      try {
        // Get API key from environment variables
        const provider = input.provider || "mistral";
        const apiKeyEnvVar = `${provider.toUpperCase()}_API_KEY`;
        const apiKey = process.env[apiKeyEnvVar];
        
        if (!apiKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `API key for ${provider} is not configured`
          });
        }
        
        // Create AI service
        const aiService = new AIService(
          provider,
          apiKey,
          input.model
        );
        
        // Generate response (non-streaming)
        const response = await aiService.generateResponse(messages, {
          temperature: input.temperature,
          maxTokens: input.maxTokens
        });
        
        // Save assistant message
        const assistantMsgId = uuidv4();
        await db.insert(chatMessage).values({
          id: assistantMsgId,
          sessionId,
          role: "assistant",
          content: response.content,
          timestamp: new Date(),
          metrics: { 
            tokens: response.usage,
            provider: response.provider,
            model: response.model
          }
        });
        
        // If this is a new session, update the title based on the first exchange
        if (isNewSession) {
          await db.update(chatSession)
            .set({
              title: generateTitleFromMessage(input.content)
            })
            .where(eq(chatSession.id, sessionId));
        }
        
        return {
          sessionId,
          userMessageId: userMsgId,
          assistantMessageId: assistantMsgId,
          response: response.content
        };
        
      } catch (error) {
        console.error("Error generating AI response:", error);
        
        // Don't leave orphaned sessions on error
        if (isNewSession) {
          await db.delete(chatSession)
            .where(eq(chatSession.id, sessionId));
        }
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`
        });
      }
    }),

  // Submit feedback for a message
  submitFeedback: protectedProcedure
    .input(z.object({
      messageId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      comments: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to submit feedback"
        });
      }
      
      // Verify the message exists and belongs to user's session
      const message = await db.select({
        id: chatMessage.id,
        sessionId: chatMessage.sessionId
      })
      .from(chatMessage)
      .where(eq(chatMessage.id, input.messageId))
      .limit(1);
      
      if (!message.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found"
        });
      }
      
      // Verify session belongs to user
      const session = await db.select()
        .from(chatSession)
        .where(and(
          eq(chatSession.id, message[0].sessionId),
          eq(chatSession.userId, userId)
        ))
        .limit(1);
      
      if (!session.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to submit feedback for this message"
        });
      }
      
      // Insert feedback
      await db.insert(feedback).values({
        messageId: input.messageId,
        rating: input.rating,
        comments: input.comments,
        createdAt: new Date()
      });
      
      return { success: true };
    }),
});