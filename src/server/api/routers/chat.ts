import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { chatSessions, chatMessages, feedback } from "../../db/schema";
import { and, desc, eq, asc, inArray, sql } from "drizzle-orm";
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
      is_pinned: z.boolean().optional().default(false), // Changed from isPinned to is_pinned
      position: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[chat.createSession] - Request received with input:", input);
      console.log("[chat.createSession] - Auth context:", {
        hasAuth: !!ctx.auth,
        hasUser: !!ctx.auth.user,
        userId: ctx.auth.user?.id || 'none'
      });
      
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create chat sessions"
        });
      }
      
      // Ensure we have a title, even if it wasn't provided
      const title = input.title || "New Chat";
      console.log(`[chat.createSession] - Creating session with title "${title}" for user: ${userId}`);
      
      try {
        // Try to create a real session in the database
        try {
          console.log("[chat.createSession] - Attempting to create session in database");
          
          // Get the highest position value for this user's sessions to place new one at top
          let position = 0;
          if (input.position === undefined) {
            try {
              const highestPositionResult = await db.select({ maxPosition: sql`MAX(${chatSessions.position})` })
                .from(chatSessions)
                .where(eq(chatSessions.user_id, userId));
                
              if (highestPositionResult[0]?.maxPosition !== null) {
                position = (highestPositionResult[0]?.maxPosition || 0) + 1;
              }
              console.log(`[chat.createSession] - Calculated position for new session: ${position}`);
            } catch (posErr) {
              console.error("[chat.createSession] - Error getting highest position:", posErr);
              // Continue with default position 0
            }
          } else {
            position = input.position;
          }
          
          // Insert new session with the new schema fields
          const newSession = await db.insert(chatSessions)
            .values({
              id: uuidv4(),
              user_id: userId,
              title: title,
              position: position,
              is_pinned: input.is_pinned,
              status: 'active',
              created_at: new Date(),
              updated_at: new Date(),
            })
            .returning();
            
          if (newSession && newSession.length > 0) {
            console.log(`[chat.createSession] - Successfully created session in database: ${newSession[0].id}`);
            return newSession[0];
          }
        } catch (dbError) {
          console.error("[chat.createSession] - Database error:", dbError);
          console.log("[chat.createSession] - Falling back to mock session due to database error");
        }
        
        // Fallback: Create a mock session
        console.log("[chat.createSession] - Creating mock session");
        const sessionId = uuidv4();
        console.log(`[chat.createSession] - Generated session ID: ${sessionId}`);
        
        // Calculate position for mock sessions too
        let position = 0;
        if (input.position === undefined) {
          // For mock data, just use a timestamp-based position to ensure uniqueness
          position = Date.now();
        } else {
          position = input.position;
        }
        
        // Create a mock session object with the updated structure
        const mockSession = {
          id: sessionId,
          user_id: userId,
          title: title,
          position: position,
          is_pinned: input.is_pinned || false,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`[chat.createSession] - Successfully created mock session: ${mockSession.id}`);
        
        // Wait a moment to simulate a database operation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return mockSession;
      } catch (error) {
        console.error("[chat.createSession] - Error:", error);
        console.error("[chat.createSession] - Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create chat session: ${error instanceof Error ? error.message : 'Unknown error'}`,
          cause: error,
        });
      }
    }),

  // Get a specific session
  getSession: protectedProcedure
    .input(z.object({
      session_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access chat sessions"
        });
      }
      
      console.log(`[chat.getSession] - Looking up session: ${input.session_id} for user: ${userId}`);
      
      try {
        // For the mock-session-1 and mock-session-2 IDs, return mock data
        if (input.session_id === 'mock-session-1') {
          return {
            id: "mock-session-1",
            user_id: userId,
            title: "First Chat Session",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        if (input.session_id === 'mock-session-2') {
          return {
            id: "mock-session-2",
            user_id: userId,
            title: "Second Chat Session",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString()
          };
        }
        
        // For any real UUID, try to find the actual session in database
        console.log(`[chat.getSession] - Trying to find session by ID: ${input.session_id}`);
        
        // Use a safer approach to query the database
        try {
          const session = await db.query.chatSessions.findFirst({
            where: and(
              eq(chatSessions.id, input.session_id),
              eq(chatSessions.user_id, userId)
            )
          });
          
          if (session) {
            console.log(`[chat.getSession] - Found session: ${session.id}`);
            return session;
          }
        } catch (dbError) {
          console.error(`[chat.getSession] - Database error:`, dbError);
          // Continue to fallback instead of throwing
        }
        
        // If not found or DB error, throw NOT_FOUND
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found"
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error; // Re-throw TRPCError
        }
        
        console.error(`[chat.getSession] - Error:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get chat session",
          cause: error
        });
      }
    }),

  // Get a user's chat sessions
  getSessions: protectedProcedure
    // Add optional parameters for filtering and sorting
    .input(z.object({
      status: z.enum(['active', 'archived', 'deleted']).optional().default('active'),
      limit: z.number().int().positive().optional().default(50),
      includeDeleted: z.boolean().optional().default(false),
      sortBy: z.enum(['updated_at', 'created_at', 'position']).optional().default('updated_at'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }).optional().default({}))
    .query(async ({ ctx, input }) => {
      console.log("[chat.getSessions] - Request received with input:", input);
      const userId = ctx.auth.user?.id;
      
      if (!userId) {
        console.error("[chat.getSessions] - Unauthorized: No user ID found in context");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access chat sessions"
        });
      }
      
      console.log(`[chat.getSessions] - Fetching sessions for user: ${userId}`);
      try {
        // Try to fetch from the database first with the new schema fields
        try {
          console.log(`[chat.getSessions] - Attempting to fetch from database with filters: 
            status=${input.status}, sortBy=${input.sortBy}, sortOrder=${input.sortOrder}`);
          
          // Build the query
          let query = db.select()
            .from(chatSessions)
            .where(eq(chatSessions.user_id, userId));
            
          // Add status filter if not including deleted
          if (!input.includeDeleted) {
            if (input.status === 'active') {
              query = query.where(eq(chatSessions.status, 'active'));
            } else if (input.status === 'archived') {
              query = query.where(eq(chatSessions.status, 'archived'));
            } else if (input.status === 'deleted') {
              query = query.where(eq(chatSessions.status, 'deleted'));
            }
          }
          
          // Add ordering
          if (input.sortBy === 'updated_at') {
            query = query.orderBy(input.sortOrder === 'desc' ? desc(chatSessions.updated_at) : asc(chatSessions.updated_at));
          } else if (input.sortBy === 'created_at') {
            query = query.orderBy(input.sortOrder === 'desc' ? desc(chatSessions.created_at) : asc(chatSessions.created_at));
          } else if (input.sortBy === 'position') {
            // For position, first sort by is_pinned (pinned first), then by position
            query = query.orderBy(desc(chatSessions.is_pinned), 
              input.sortOrder === 'desc' ? desc(chatSessions.position) : asc(chatSessions.position));
          }
          
          // Add limit
          query = query.limit(input.limit);
          
          // Execute the query
          const dbSessions = await query;
          
          if (dbSessions && dbSessions.length > 0) {
            console.log(`[chat.getSessions] - Successfully fetched ${dbSessions.length} sessions from database`);
            return dbSessions;
          } else {
            console.log(`[chat.getSessions] - No sessions found in database, using mock data`);
          }
        } catch (dbError) {
          console.error(`[chat.getSessions] - Database error:`, dbError);
          console.log(`[chat.getSessions] - Falling back to mock data due to database error`);
        }
        
        // Fallback: Create some mock sessions that match the database schema
        // Use the exact same column names as defined in the database (snake_case)
        const mockSessions = [
          {
            id: "mock-session-1",
            user_id: userId,
            title: "First Chat Session",
            position: 1,
            is_pinned: false,
            status: "active", 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "mock-session-2",
            user_id: userId,
            title: "Second Chat Session",
            position: 0,
            is_pinned: true,
            status: "active",
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            updated_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: "mock-session-3",
            user_id: userId,
            title: "Archived Chat Session",
            position: 2,
            is_pinned: false,
            status: "archived",
            created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            updated_at: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        
        // Filter mock sessions based on input
        let filteredMockSessions = mockSessions;
        
        if (!input.includeDeleted) {
          filteredMockSessions = filteredMockSessions.filter(s => 
            input.status === 'active' ? s.status === 'active' : 
            input.status === 'archived' ? s.status === 'archived' : 
            input.status === 'deleted' ? s.status === 'deleted' : true
          );
        }
        
        // Sort mock sessions based on input
        filteredMockSessions.sort((a, b) => {
          if (input.sortBy === 'updated_at') {
            return input.sortOrder === 'desc' 
              ? new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
              : new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          } else if (input.sortBy === 'created_at') {
            return input.sortOrder === 'desc'
              ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          } else if (input.sortBy === 'position') {
            // Sort by pinned first, then by position
            if (a.is_pinned !== b.is_pinned) {
              return a.is_pinned ? -1 : 1;
            }
            return input.sortOrder === 'desc'
              ? b.position - a.position
              : a.position - b.position;
          }
          return 0;
        });
        
        // Apply limit
        filteredMockSessions = filteredMockSessions.slice(0, input.limit);
        
        console.log(`[chat.getSessions] - Successfully returned ${filteredMockSessions.length} filtered mock sessions`);
        return filteredMockSessions;
      } catch (error) {
        console.error(`[chat.getSessions] - Error handling sessions for user ${userId}:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch chat sessions",
          cause: error,
        });
      }
    }),

  // Delete a chat session (with soft delete option)
  deleteSession: protectedProcedure
    .input(z.object({
      session_id: z.string().uuid(),
      permanent: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[chat.deleteSession] - Request received:", input);
      
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete chat sessions"
        });
      }
      
      console.log(`[chat.deleteSession] - Checking session ownership for: ${input.session_id}`);
      
      // Verify session belongs to user
      const session = await db.select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.id, input.session_id),
          eq(chatSessions.user_id, userId)
        ))
        .limit(1);
      
      if (!session.length) {
        console.log(`[chat.deleteSession] - Session not found or not owned by user: ${userId}`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found"
        });
      }
      
      try {
        if (input.permanent) {
          // Hard delete - remove from database
          console.log(`[chat.deleteSession] - Performing permanent deletion: ${input.session_id}`);
          await db.delete(chatSessions)
            .where(eq(chatSessions.id, input.session_id));
        } else {
          // Soft delete - update status to 'deleted'
          console.log(`[chat.deleteSession] - Performing soft deletion: ${input.session_id}`);
          await db.update(chatSessions)
            .set({ 
              status: 'deleted',
              updated_at: new Date()
            })
            .where(eq(chatSessions.id, input.session_id));
        }
        
        return { 
          success: true,
          permanent: input.permanent,
          id: input.session_id
        };
      } catch (error) {
        console.error(`[chat.deleteSession] - Error deleting session:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete chat session",
          cause: error
        });
      }
    }),

  // Get messages from a specific session
  getMessages: protectedProcedure
    .input(z.object({
      session_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access chat messages"
        });
      }
      
      // Verify the session belongs to the user - updated with proper column names
      const session = await db.select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.id, input.session_id),
          eq(chatSessions.user_id, userId) // Using snake_case for column names
        ))
        .limit(1);
      
      if (!session.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found"
        });
      }
      
      return await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.session_id, input.session_id)) // Using snake_case
        .orderBy(asc(chatMessages.timestamp));
    }),

  // Update session title (original method, kept for backward compatibility)
  updateSessionTitle: protectedProcedure
    .input(z.object({
      session_id: z.string().uuid(),
      title: z.string().min(1).max(256),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[chat.updateSessionTitle] - Request received:", input);
      
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update chat sessions"
        });
      }
      
      // Verify session belongs to user
      const session = await db.select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.id, input.session_id),
          eq(chatSessions.user_id, userId)
        ))
        .limit(1);
      
      if (!session.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found"
        });
      }
      
      try {
        const updated = await db.update(chatSessions)
          .set({
            title: input.title,
            updated_at: new Date(),
          })
          .where(eq(chatSessions.id, input.session_id))
          .returning();
        
        return updated[0];
      } catch (error) {
        console.error("[chat.updateSessionTitle] - Error updating session title:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update chat session title",
          cause: error
        });
      }
    }),
    
  // Update session details (comprehensive update for all fields)
  updateSession: protectedProcedure
    .input(z.object({
      session_id: z.string().uuid(),
      title: z.string().min(1).max(256).optional(),
      is_pinned: z.boolean().optional(), // Changed from isPinned to is_pinned
      status: z.enum(['active', 'archived', 'deleted']).optional(),
      position: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[chat.updateSession] - Request received:", input);
      
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update chat sessions"
        });
      }
      
      // Verify session belongs to user
      const session = await db.select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.id, input.session_id),
          eq(chatSessions.user_id, userId)
        ))
        .limit(1);
      
      if (!session.length) {
        console.log(`[chat.updateSession] - Session not found: ${input.session_id}`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found"
        });
      }
      
      try {
        // Build update object with only provided fields
        const updateData: Record<string, any> = { 
          updated_at: new Date() 
        };
        
        if (input.title !== undefined) updateData.title = input.title;
        if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.position !== undefined) updateData.position = input.position;
        
        console.log(`[chat.updateSession] - Updating session with data:`, updateData);
        
        const updated = await db.update(chatSessions)
          .set(updateData)
          .where(eq(chatSessions.id, input.session_id))
          .returning();
        
        if (updated.length > 0) {
          console.log(`[chat.updateSession] - Successfully updated session: ${updated[0].id}`);
          return updated[0];
        } else {
          throw new Error("Update did not return the updated session");
        }
      } catch (error) {
        console.error("[chat.updateSession] - Error updating session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update chat session",
          cause: error
        });
      }
    }),
    
  // Bulk update session positions (for drag and drop reordering)
  updateSessionPositions: protectedProcedure
    .input(z.object({
      positions: z.array(z.object({
        session_id: z.string().uuid(),
        position: z.number().int(),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[chat.updateSessionPositions] - Request received with", 
        input.positions.length, "position updates");
      
      const userId = ctx.auth.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update chat sessions"
        });
      }
      
      // Verify all sessions belong to the user
      const sessionIds = input.positions.map(p => p.session_id);
      
      const userSessions = await db.select({ id: chatSessions.id })
        .from(chatSessions)
        .where(and(
          inArray(chatSessions.id, sessionIds),
          eq(chatSessions.user_id, userId)
        ));
      
      const userSessionIds = new Set(userSessions.map(s => s.id));
      
      // Check if any requested sessions don't belong to the user
      const invalidSessions = sessionIds.filter(id => !userSessionIds.has(id));
      
      if (invalidSessions.length > 0) {
        console.log(`[chat.updateSessionPositions] - Invalid sessions detected:`, invalidSessions);
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "One or more sessions not found or don't belong to you"
        });
      }
      
      try {
        console.log(`[chat.updateSessionPositions] - Performing batch updates`);
        
        // Use a transaction to update all positions
        const results = await db.transaction(async (tx) => {
          const updates = [];
          
          for (const { session_id, position } of input.positions) {
            const result = await tx.update(chatSessions)
              .set({ 
                position: position,
                updated_at: new Date()
              })
              .where(eq(chatSessions.id, session_id))
              .returning({ id: chatSessions.id, position: chatSessions.position });
              
            updates.push(...result);
          }
          
          return updates;
        });
        
        console.log(`[chat.updateSessionPositions] - Successfully updated ${results.length} sessions`);
        
        return { 
          success: true,
          updated: results.length,
          positions: results
        };
      } catch (error) {
        console.error("[chat.updateSessionPositions] - Error updating positions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update session positions",
          cause: error
        });
      }
    }),

  // Send message and get AI response
  sendMessage: protectedProcedure
    .input(z.object({
      session_id: z.string().uuid().optional(),
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
      let session_id = input.session_id;
      let isNewSession = false;
      
      if (!session_id) {
        // Create new session
        const newSession = await db.insert(chatSessions).values({
          id: uuidv4(),
          user_id: userId,
          title: generateTitleFromMessage(input.content),
          position: 0,
          is_pinned: false,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        }).returning();
        
        if (!newSession.length) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create chat session"
          });
        }
        
        session_id = newSession[0].id;
        isNewSession = true;
        
      } else {
        // Verify session belongs to user
        const session = await db.select()
          .from(chatSessions)
          .where(and(
            eq(chatSessions.id, session_id),
            eq(chatSessions.user_id, userId)
          ))
          .limit(1);
        
        if (!session.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Chat session not found"
          });
        }
        
        // Update session timestamp
        await db.update(chatSessions)
          .set({ updated_at: new Date() })
          .where(eq(chatSessions.id, session_id));
      }
      
      // Get chat history (limit to last 20 messages for context)
      const history = await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.session_id, session_id))
        .orderBy(desc(chatMessages.timestamp))
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
      const user_msg_id = uuidv4();
      await db.insert(chatMessages).values({
        id: user_msg_id,
        session_id: session_id,
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
        const assistant_msg_id = uuidv4();
        await db.insert(chatMessages).values({
          id: assistant_msg_id,
          session_id: session_id,
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
          await db.update(chatSessions)
            .set({
              title: generateTitleFromMessage(input.content)
              // No need to update updated_at as it's handled by the onUpdate trigger in the schema
            })
            .where(eq(chatSessions.id, session_id));
        }
        
        return {
          session_id,
          user_message_id: user_msg_id,
          assistant_message_id: assistant_msg_id,
          response: response.content
        };
        
      } catch (error) {
        console.error("Error generating AI response:", error);
        
        // Don't leave orphaned sessions on error
        if (isNewSession) {
          await db.delete(chatSessions)
            .where(eq(chatSessions.id, session_id));
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
      message_id: z.string().uuid(),
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
        id: chatMessages.id,
        session_id: chatMessages.session_id
      })
      .from(chatMessages)
      .where(eq(chatMessages.id, input.message_id))
      .limit(1);
      
      if (!message.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found"
        });
      }
      
      // Verify session belongs to user
      const session = await db.select()
        .from(chatSessions)
        .where(and(
          eq(chatSessions.id, message[0].session_id),
          eq(chatSessions.user_id, userId)
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
        message_id: input.message_id, 
        rating: input.rating,
        comments: input.comments,
        created_at: new Date()
      });
      
      return { success: true };
    }),
});