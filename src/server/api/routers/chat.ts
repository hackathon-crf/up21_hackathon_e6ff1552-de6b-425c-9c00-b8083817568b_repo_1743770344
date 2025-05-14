import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { AIService } from "~/lib/services/ai";
import type { ChatMessage } from "~/lib/services/ai";
import { db } from "../../db";
import { chatMessages, chatSessions, feedback } from "../../db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Helper to extract title from first message
function generateTitleFromMessage(content: string): string {
	// Take first line or first 30 chars as title
	const firstLine = content.split("\n")[0] || "";
	const title =
		firstLine.length > 30 ? `${firstLine.substring(0, 30)}...` : firstLine;
	return title || "New Chat";
}

export const chatRouter = createTRPCRouter({
	// Delete all chat sessions for a user
	deleteAllSessions: protectedProcedure
		.mutation(async ({ ctx }) => {
			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to delete chat sessions",
				});
			}

			try {
				// Use a transaction to ensure consistency
				return await db.transaction(async (tx) => {
					// Get all session IDs belonging to the user
					const userSessions = await tx
						.select({ id: chatSessions.id })
						.from(chatSessions)
						.where(eq(chatSessions.user_id, userId));
					
					const sessionIds = userSessions.map(session => session.id);
					
					if (sessionIds.length === 0) {
						return { success: true, count: 0 };
					}

					// Delete all messages for these sessions
					await tx
						.delete(chatMessages)
						.where(inArray(chatMessages.session_id, sessionIds));

					// Delete all the sessions
					const result = await tx
						.delete(chatSessions)
						.where(eq(chatSessions.user_id, userId))
						.returning({ id: chatSessions.id });

					return {
						success: true,
						count: result.length,
					};
				});
			} catch (error) {
				console.error("Error deleting all sessions:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete all chat sessions",
					cause: error,
				});
			}
		}),

	// Create a new chat session
	createSession: protectedProcedure
		.input(
			z.object({
				title: z.string().default("New Chat"),
				is_pinned: z.boolean().optional().default(false), // Changed from isPinned to is_pinned
				position: z.number().int().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			console.log("[chat.createSession] - Request received with input:", input);
			console.log("[chat.createSession] - Auth context:", {
				hasAuth: !!ctx.auth,
				hasUser: !!ctx.auth.user,
				userId: ctx.auth.user?.id || "none",
			});

			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to create chat sessions",
				});
			}

			// Ensure we have a title, even if it wasn't provided
			const title = input.title || "New Chat";
			console.log(
				`[chat.createSession] - Creating session with title "${title}" for user: ${userId}`,
			);

			try {
				// Try to create a real session in the database
				try {
					console.log(
						"[chat.createSession] - Attempting to create session in database",
					);

					// Get the highest position value for this user's sessions to place new one at top
					let position = 0;
					if (input.position === undefined) {
						try {
							const highestPositionResult = await db
								.select({ maxPosition: sql`MAX(${chatSessions.position})` })
								.from(chatSessions)
								.where(eq(chatSessions.user_id, userId));

							// Safely handle the result which might be NULL from SQL
							const maxPos = highestPositionResult[0]?.maxPosition;
							position = typeof maxPos === "number" ? maxPos + 1 : 1;
							console.log(
								`[chat.createSession] - Calculated position for new session: ${position}`,
							);
						} catch (posErr) {
							console.error(
								"[chat.createSession] - Error getting highest position:",
								posErr,
							);
							// Continue with default position 0
						}
					} else {
						position = input.position;
					}

					// Insert new session with the new schema fields
					const newSession = await db
						.insert(chatSessions)
						.values({
							id: uuidv4(),
							user_id: userId,
							title: title,
							position: position,
							is_pinned: input.is_pinned,
							status: "active",
							created_at: new Date(),
							updated_at: new Date(),
						})
						.returning();

					if (newSession && newSession.length > 0) {
						console.log(
							`[chat.createSession] - Successfully created session in database: ${newSession[0]?.id}`,
						);
						return newSession[0];
					}
				} catch (dbError) {
					console.error("[chat.createSession] - Database error:", dbError);
					console.log(
						"[chat.createSession] - Falling back to mock session due to database error",
					);
				}

				// Fallback: Create a mock session
				console.log("[chat.createSession] - Creating mock session");
				const sessionId = uuidv4();
				console.log(
					`[chat.createSession] - Generated session ID: ${sessionId}`,
				);

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
					status: "active",
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				};

				console.log(
					`[chat.createSession] - Successfully created mock session: ${mockSession.id}`,
				);

				// Wait a moment to simulate a database operation
				await new Promise((resolve) => setTimeout(resolve, 500));

				return mockSession;
			} catch (error) {
				console.error("[chat.createSession] - Error:", error);
				console.error(
					"[chat.createSession] - Error stack:",
					error instanceof Error ? error.stack : "No stack trace",
				);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to create chat session: ${error instanceof Error ? error.message : "Unknown error"}`,
					cause: error,
				});
			}
		}),

	// Get message counts for sessions
	getSessionMessageCounts: protectedProcedure
		.input(
			z.object({
				sessionIds: z.array(z.string().uuid()),
			}),
		)
		.query(async ({ ctx, input }) => {
			console.log(
				"[DEBUG] getSessionMessageCounts called with sessionIds:",
				input.sessionIds,
			);

			const userId = ctx.auth.user?.id;
			if (!userId) {
				console.error(
					"[DEBUG] getSessionMessageCounts: No user ID found in context",
				);
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to access chat message counts",
				});
			}

			console.log(
				"[DEBUG] getSessionMessageCounts: Authorized for user:",
				userId,
			);

			try {
				// First, verify the sessions belong to the user
				const userSessions = await db
					.select()
					.from(chatSessions)
					.where(
						and(
							inArray(chatSessions.id, input.sessionIds),
							eq(chatSessions.user_id, userId),
						),
					);

				const userSessionIds = userSessions.map((s) => s.id);
				console.log(
					"[DEBUG] getSessionMessageCounts: Found user sessions:",
					userSessionIds.length,
				);

				// Debug to see if we have messages in the database at all
				const allMessages = await db.select().from(chatMessages).limit(5);

				console.log(
					"[DEBUG] getSessionMessageCounts: Sample of all messages in DB:",
					allMessages.length > 0
						? `Found ${allMessages.length} messages, first message session_id: ${allMessages[0]?.session_id || "undefined"}`
						: "No messages found in database",
				);

				// Count messages for verified sessions
				const countsArray = [];
				for (const sessionId of userSessionIds) {
					// Get all messages for this session
					const messages = await db
						.select()
						.from(chatMessages)
						.where(eq(chatMessages.session_id, sessionId));

					console.log(
						`[DEBUG] getSessionMessageCounts: Session ${sessionId} has ${messages.length} messages`,
					);

					countsArray.push({
						session_id: sessionId,
						count: messages.length,
					});
				}

				console.log(
					"[DEBUG] getSessionMessageCounts: Returning counts:",
					countsArray,
				);
				return countsArray;
			} catch (error) {
				console.error("[DEBUG] getSessionMessageCounts: Error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to count messages",
					cause: error,
				});
			}
		}),

	// Get a specific session
	getSession: protectedProcedure
		.input(
			z.object({
				session_id: z.string().uuid(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to access chat sessions",
				});
			}

			console.log(
				`[chat.getSession] - Looking up session: ${input.session_id} for user: ${userId}`,
			);

			try {
				// Try to find the actual session in database
				console.log(
					`[chat.getSession] - Trying to find session by ID: ${input.session_id}`,
				);

				// Use a safer approach to query the database
				try {
					const session = await db
						.select()
						.from(chatSessions)
						.where(
							and(
								eq(chatSessions.id, input.session_id),
								eq(chatSessions.user_id, userId),
							),
						)
						.limit(1)
						.execute()
						.then((results) => results[0]);

					if (session) {
						console.log(`[chat.getSession] - Found session: ${session.id}`);
						return session;
					}
				} catch (dbError) {
					console.error("[chat.getSession] - Database error:", dbError);
				}

				// If not found or DB error, throw NOT_FOUND
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat session not found",
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error; // Re-throw TRPCError
				}

				console.error("[chat.getSession] - Error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to get chat session",
					cause: error,
				});
			}
		}),

	// Get a user's chat sessions
	getSessions: protectedProcedure
		// Add optional parameters for filtering and sorting
		.input(
			z
				.object({
					status: z
						.enum(["active", "archived", "deleted"])
						.optional()
						.default("active"),
					limit: z.number().int().positive().optional().default(50),
					includeDeleted: z.boolean().optional().default(false),
					sortBy: z
						.enum(["updated_at", "created_at", "position"])
						.optional()
						.default("updated_at"),
					sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
				})
				.optional()
				.default({}),
		)
		.query(async ({ ctx, input }) => {
			console.log("[chat.getSessions] - Request received with input:", input);
			const userId = ctx.auth.user?.id;

			if (!userId) {
				console.error(
					"[chat.getSessions] - Unauthorized: No user ID found in context",
				);
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to access chat sessions",
				});
			}

			console.log(`[chat.getSessions] - Fetching sessions for user: ${userId}`);
			try {
				// Try to fetch from the database first with the new schema fields
				try {
					console.log(`[chat.getSessions] - Attempting to fetch from database with filters: 
            status=${input.status}, sortBy=${input.sortBy}, sortOrder=${input.sortOrder}`);

					// Build the query differently to avoid chaining issues
					const baseQueryConditions = [eq(chatSessions.user_id, userId)];

					// Add status filter if not including deleted
					if (!input.includeDeleted) {
						if (
							input.status === "active" ||
							input.status === "archived" ||
							input.status === "deleted"
						) {
							baseQueryConditions.push(eq(chatSessions.status, input.status));
						}
					}

					// Execute the query with all conditions applied at once
					let dbSessions = await db
						.select()
						.from(chatSessions)
						.where(and(...baseQueryConditions));

					// Apply sorting in memory since we can't use method chaining
					if (input.sortBy === "updated_at") {
						dbSessions = dbSessions.sort((a, b) => {
							// Handle potential null dates safely
							const aDate =
								a.updated_at instanceof Date
									? a.updated_at
									: new Date(a.updated_at || 0);
							const bDate =
								b.updated_at instanceof Date
									? b.updated_at
									: new Date(b.updated_at || 0);
							return input.sortOrder === "desc"
								? bDate.getTime() - aDate.getTime()
								: aDate.getTime() - bDate.getTime();
						});
					} else if (input.sortBy === "created_at") {
						dbSessions = dbSessions.sort((a, b) => {
							// Handle potential null dates safely
							const aDate =
								a.created_at instanceof Date
									? a.created_at
									: new Date(a.created_at || 0);
							const bDate =
								b.created_at instanceof Date
									? b.created_at
									: new Date(b.created_at || 0);
							return input.sortOrder === "desc"
								? bDate.getTime() - aDate.getTime()
								: aDate.getTime() - bDate.getTime();
						});
					} else {
						// For position, first sort by is_pinned (pinned first), then by position
						dbSessions = dbSessions.sort((a, b) => {
							// First sort by is_pinned (true comes before false)
							if (a.is_pinned && !b.is_pinned) return -1;
							if (!a.is_pinned && b.is_pinned) return 1;

							// Then sort by position
							return input.sortOrder === "desc"
								? b.position - a.position
								: a.position - b.position;
						});
					}

					// Apply limit in memory
					dbSessions = dbSessions.slice(0, input.limit);

					console.log(
						`[chat.getSessions] - Fetched ${dbSessions.length} sessions from database`,
					);
					return dbSessions; // Return database sessions, even if empty
				} catch (dbError) {
					console.error("[chat.getSessions] - Database error:", dbError);
					console.log(
						"[chat.getSessions] - Returning empty array due to database error",
					);
					return []; // Return empty array instead of mock sessions when database fails
				}
			} catch (error) {
				console.error(
					`[chat.getSessions] - Error handling sessions for user ${userId}:`,
					error,
				);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch chat sessions",
					cause: error,
				});
			}
		}),

	// Delete a chat session (with soft delete option)
	deleteSession: protectedProcedure
		.input(
			z.object({
				session_id: z.string().uuid(),
				permanent: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to delete chat sessions",
				});
			}

			// Verify session belongs to user
			const session = await db
				.select()
				.from(chatSessions)
				.where(
					and(
						eq(chatSessions.id, input.session_id),
						eq(chatSessions.user_id, userId),
					),
				)
				.limit(1);

			if (!session.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message:
						"Chat session not found or you don't have permission to delete it",
				});
			}

			try {
				// Use a transaction to ensure consistency
				return await db.transaction(async (tx) => {
					if (input.permanent) {
						// First, delete the messages associated with this session
						await tx
							.delete(chatMessages)
							.where(eq(chatMessages.session_id, input.session_id));

						// Then delete the session itself
						const result = await tx
							.delete(chatSessions)
							.where(eq(chatSessions.id, input.session_id))
							.returning({ id: chatSessions.id });

						if (!result.length) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to permanently delete session",
							});
						}
					} else {
						// Soft delete - update status to 'deleted'
						const result = await tx
							.update(chatSessions)
							.set({
								status: "deleted",
								updated_at: new Date(),
							})
							.where(eq(chatSessions.id, input.session_id))
							.returning({ id: chatSessions.id });

						if (!result.length) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to move session to trash",
							});
						}
					}

					return {
						success: true,
						permanent: input.permanent,
						id: input.session_id,
					};
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error; // Re-throw TRPCError
				}

				console.error("Error deleting session:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete chat session due to a server error",
					cause: error,
				});
			}
		}),

	// Get messages from a specific session
	getMessages: protectedProcedure
		.input(
			z.object({
				session_id: z.string().uuid(),
			}),
		)
		.query(async ({ ctx, input }) => {
			console.log(
				`[chat.getMessages] - Request received for session: ${input.session_id}`,
			);

			const userId = ctx.auth.user?.id;
			if (!userId) {
				console.log(
					"[chat.getMessages] - UNAUTHORIZED: No user ID found in context",
				);
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to access chat messages",
				});
			}

			console.log(`[chat.getMessages] - Authorized for user: ${userId}`);

			try {
				// Verify the session belongs to the user - updated with proper column names
				const session = await db
					.select()
					.from(chatSessions)
					.where(
						and(
							eq(chatSessions.id, input.session_id),
							eq(chatSessions.user_id, userId), // Using snake_case for column names
						),
					)
					.limit(1);

				if (!session.length) {
					console.log(
						`[chat.getMessages] - NOT_FOUND: Session ${input.session_id} not found or doesn't belong to user ${userId}`,
					);
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Chat session not found",
					});
				}

				console.log(
					`[chat.getMessages] - Session verified for user ${userId}, fetching messages`,
				);

				try {
					const messages = await db
						.select()
						.from(chatMessages)
						.where(eq(chatMessages.session_id, input.session_id)) // Using snake_case
						.orderBy(asc(chatMessages.timestamp));

					console.log(
						`[chat.getMessages] - Found ${messages.length} messages for session ${input.session_id}`,
					);
					return messages;
				} catch (dbError) {
					console.error(
						"[chat.getMessages] - Database error while fetching messages:",
						dbError,
					);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to fetch messages due to a database error",
						cause: dbError,
					});
				}
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error; // Re-throw TRPCError
				}

				console.error("[chat.getMessages] - Unhandled error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch chat messages",
					cause: error,
				});
			}
		}),

	// Update session title (original method, kept for backward compatibility)
	updateSessionTitle: protectedProcedure
		.input(
			z.object({
				session_id: z.string().uuid(),
				title: z.string().min(1).max(256),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			console.log("[chat.updateSessionTitle] - Request received:", input);

			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update chat sessions",
				});
			}

			// Verify session belongs to user
			const session = await db
				.select()
				.from(chatSessions)
				.where(
					and(
						eq(chatSessions.id, input.session_id),
						eq(chatSessions.user_id, userId),
					),
				)
				.limit(1);

			if (!session.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat session not found",
				});
			}

			try {
				const updated = await db
					.update(chatSessions)
					.set({
						title: input.title,
						updated_at: new Date(),
					})
					.where(eq(chatSessions.id, input.session_id))
					.returning();

				return updated[0];
			} catch (error) {
				console.error(
					"[chat.updateSessionTitle] - Error updating session title:",
					error,
				);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update chat session title",
					cause: error,
				});
			}
		}),

	// Update session details (comprehensive update for all fields)
	updateSession: protectedProcedure
		.input(
			z.object({
				session_id: z.string().uuid(),
				title: z.string().min(1).max(256).optional(),
				is_pinned: z.boolean().optional(), // Changed from isPinned to is_pinned
				status: z.enum(["active", "archived", "deleted"]).optional(),
				position: z.number().int().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			console.log("[chat.updateSession] - Request received:", input);

			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update chat sessions",
				});
			}

			// Verify session belongs to user
			const session = await db
				.select()
				.from(chatSessions)
				.where(
					and(
						eq(chatSessions.id, input.session_id),
						eq(chatSessions.user_id, userId),
					),
				)
				.limit(1);

			if (!session.length) {
				console.log(
					`[chat.updateSession] - Session not found: ${input.session_id}`,
				);
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat session not found",
				});
			}

			try {
				// Build update object with only provided fields
				const updateData: Record<string, string | boolean | number | Date> = {
					updated_at: new Date(),
				};

				if (input.title !== undefined) updateData.title = input.title;
				if (input.is_pinned !== undefined)
					updateData.is_pinned = input.is_pinned;
				if (input.status !== undefined) updateData.status = input.status;
				if (input.position !== undefined) updateData.position = input.position;

				console.log(
					"[chat.updateSession] - Updating session with data:",
					updateData,
				);

				const updated = await db
					.update(chatSessions)
					.set(updateData)
					.where(eq(chatSessions.id, input.session_id))
					.returning();

				if (updated.length > 0) {
					console.log(
						`[chat.updateSession] - Successfully updated session: ${updated[0]?.id || "unknown"}`,
					);
					return updated[0];
				}
				throw new Error("Update did not return the updated session");
			} catch (error) {
				console.error("[chat.updateSession] - Error updating session:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update chat session",
					cause: error,
				});
			}
		}),

	// Bulk update session positions (for drag and drop reordering)
	updateSessionPositions: protectedProcedure
		.input(
			z.object({
				positions: z.array(
					z.object({
						session_id: z.string().uuid(),
						position: z.number().int(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			console.log(
				"[chat.updateSessionPositions] - Request received with",
				input.positions.length,
				"position updates",
			);

			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update chat sessions",
				});
			}

			// Verify all sessions belong to the user
			const sessionIds = input.positions.map((p) => p.session_id);

			const userSessions = await db
				.select({ id: chatSessions.id })
				.from(chatSessions)
				.where(
					and(
						inArray(chatSessions.id, sessionIds),
						eq(chatSessions.user_id, userId),
					),
				);

			const userSessionIds = new Set(userSessions.map((s) => s.id));

			// Check if any requested sessions don't belong to the user
			const invalidSessions = sessionIds.filter(
				(id) => !userSessionIds.has(id),
			);

			if (invalidSessions.length > 0) {
				console.log(
					"[chat.updateSessionPositions] - Invalid sessions detected:",
					invalidSessions,
				);
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "One or more sessions not found or don't belong to you",
				});
			}

			try {
				console.log("[chat.updateSessionPositions] - Performing batch updates");

				// Use a transaction to update all positions
				const results = await db.transaction(async (tx) => {
					const updates = [];

					for (const { session_id, position } of input.positions) {
						const result = await tx
							.update(chatSessions)
							.set({
								position: position,
								updated_at: new Date(),
							})
							.where(eq(chatSessions.id, session_id))
							.returning({
								id: chatSessions.id,
								position: chatSessions.position,
							});

						updates.push(...result);
					}

					return updates;
				});

				console.log(
					`[chat.updateSessionPositions] - Successfully updated ${results.length} sessions`,
				);

				return {
					success: true,
					updated: results.length,
					positions: results,
				};
			} catch (error) {
				console.error(
					"[chat.updateSessionPositions] - Error updating positions:",
					error,
				);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update session positions",
					cause: error,
				});
			}
		}),

	// Send message and get AI response
	sendMessage: protectedProcedure
		.input(
			z.object({
				session_id: z.string().uuid().optional(),
				content: z.string().min(1),
				provider: z.string().optional(),
				model: z.string().optional(),
				temperature: z.number().min(0).max(1).optional(),
				maxTokens: z.number().int().positive().optional(),
				ragEnabled: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to send messages",
				});
			}

			// Get or create session
			let session_id = input.session_id;
			let isNewSession = false;

			if (!session_id) {
				// Create new session
				const newSession = await db
					.insert(chatSessions)
					.values({
						id: uuidv4(),
						user_id: userId,
						title: generateTitleFromMessage(input.content),
						position: 0,
						is_pinned: false,
						status: "active",
						created_at: new Date(),
						updated_at: new Date(),
					})
					.returning();

				if (newSession && newSession.length > 0 && newSession[0]?.id) {
					session_id = newSession[0].id;
					isNewSession = true;
				} else {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create chat session: no ID returned",
					});
				}
			} else {
				// Verify session belongs to user
				const session = await db
					.select()
					.from(chatSessions)
					.where(
						and(
							eq(chatSessions.id, session_id),
							eq(chatSessions.user_id, userId),
						),
					)
					.limit(1);

				if (!session.length) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Chat session not found",
					});
				}

				// Update session timestamp
				await db
					.update(chatSessions)
					.set({ updated_at: new Date() })
					.where(eq(chatSessions.id, session_id));
			}

			// Get chat history (limit to last 20 messages for context)
			const history = await db
				.select()
				.from(chatMessages)
				.where(eq(chatMessages.session_id, session_id))
				.orderBy(desc(chatMessages.timestamp))
				.limit(20);

			// Format messages for AI
			const systemPrompt =
				"You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately. Provide reliable information based on official Red Cross guidelines.";

			const messages: ChatMessage[] = [
				{ role: "system", content: systemPrompt },
				...history
					.sort(
						(a, b) =>
							new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
					)
					.map((msg) => ({
						role: msg.role as "user" | "assistant" | "system",
						content: msg.content,
					})),
				{ role: "user", content: input.content },
			];

			// Save user message
			const user_msg_id = uuidv4();
			await db.insert(chatMessages).values({
				id: user_msg_id,
				session_id: session_id,
				role: "user",
				content: input.content,
				timestamp: new Date(),
			});

			try {
				// Get API key from environment variables
				const provider = input.provider || "mistral";
				const apiKeyEnvVar = `${provider.toUpperCase()}_API_KEY`;
				const apiKey = process.env[apiKeyEnvVar];

				if (!apiKey) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `API key for ${provider} is not configured`,
					});
				}

				// Create AI service
				const aiService = new AIService(provider, apiKey, input.model);

				// Generate response (non-streaming)
				const response = await aiService.generateResponse(messages, {
					temperature: input.temperature,
					maxTokens: input.maxTokens,
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
						model: response.model,
					},
				});

				// If this is a new session, update the title based on the first exchange
				if (isNewSession) {
					await db
						.update(chatSessions)
						.set({
							title: generateTitleFromMessage(input.content),
							// No need to update updated_at as it's handled by the onUpdate trigger in the schema
						})
						.where(eq(chatSessions.id, session_id));
				}

				return {
					session_id,
					user_message_id: user_msg_id,
					assistant_message_id: assistant_msg_id,
					response: response.content,
				};
			} catch (error) {
				console.error("Error generating AI response:", error);

				// Don't leave orphaned sessions on error
				if (isNewSession) {
					await db.delete(chatSessions).where(eq(chatSessions.id, session_id));
				}

				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	// Submit feedback for a message
	submitFeedback: protectedProcedure
		.input(
			z.object({
				message_id: z.string().uuid(),
				rating: z.number().int().min(1).max(5),
				comments: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to submit feedback",
				});
			}

			// Verify the message exists and belongs to user's session
			const message = await db
				.select({
					id: chatMessages.id,
					session_id: chatMessages.session_id,
				})
				.from(chatMessages)
				.where(eq(chatMessages.id, input.message_id))
				.limit(1);

			if (!message.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			}

			// Verify session belongs to user
			const sessionId = message[0]?.session_id;
			if (!sessionId) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Message is missing session ID",
				});
			}

			const session = await db
				.select()
				.from(chatSessions)
				.where(
					and(eq(chatSessions.id, sessionId), eq(chatSessions.user_id, userId)),
				)
				.limit(1);

			if (!session.length) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to submit feedback for this message",
				});
			}

			// Insert feedback
			await db.insert(feedback).values({
				message_id: input.message_id,
				rating: input.rating,
				comments: input.comments,
				created_at: new Date(),
			});

			return { success: true };
		}),

	// Test authentication and database connection
	testConnection: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.auth.user?.id;
		if (!userId) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Not authenticated",
			});
		}

		// Test database connection
		let dbStatus = "unknown";
		let dbError = null;
		try {
			// Simple test query
			const result = await db
				.select({ count: sql`COUNT(*)` })
				.from(chatSessions)
				.limit(1);

			dbStatus = "connected";
			console.log("[testConnection] Database connection successful:", result);
		} catch (error) {
			dbStatus = "error";
			dbError =
				error instanceof Error ? error.message : "Unknown database error";
			console.error("[testConnection] Database error:", error);
		}

		// Test auth status
		return {
			authenticated: true,
			userId,
			dbStatus,
			dbError,
			timestamp: new Date().toISOString(),
		};
	}),
});
