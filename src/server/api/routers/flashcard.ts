import { TRPCError } from "@trpc/server";
import {
	type SQL,
	and,
	asc,
	desc,
	eq,
	isNull,
	lte,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { flashcardDecks, flashcards, studyStats } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Flashcard router for managing flashcard CRUD operations
 * Based on the migration plan for the Python-to-TypeScript project
 */
export const flashcardRouter = createTRPCRouter({
	/**
	 * Get all decks for the current user
	 */
	getDecks: protectedProcedure.query(async ({ ctx }) => {
		try {
			// Use direct query methods instead of prepared statements
			const userDecks = await ctx.db
				.select()
				.from(flashcardDecks)
				.where(eq(flashcardDecks.userId, ctx.auth.user.id))
				.orderBy(desc(flashcardDecks.updatedAt));

			// Get card counts for each deck
			const decksWithCardCounts = await Promise.all(
				userDecks.map(async (deck) => {
					const cards = await ctx.db
						.select({ id: flashcards.id })
						.from(flashcards)
						.where(eq(flashcards.deckId, deck.id));

					return {
						id: deck.id,
						name: deck.name,
						description: deck.description,
						createdAt: deck.createdAt,
						updatedAt: deck.updatedAt,
						cardCount: cards.length,
					};
				}),
			);

			return decksWithCardCounts;
		} catch (error) {
			console.error("Error fetching flashcard decks:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch flashcard decks",
			});
		}
	}),

	/**
	 * Create a new deck
	 */
	createDeck: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Deck name is required"),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const newDeck = await ctx.db
					.insert(flashcardDecks)
					.values({
						userId: ctx.auth.user.id,
						name: input.name,
						description: input.description || "",
					})
					.returning();

				return newDeck[0];
			} catch (error) {
				console.error("Error creating flashcard deck:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create flashcard deck",
				});
			}
		}),

	/**
	 * Get a specific deck by ID
	 */
	getDeckById: protectedProcedure
		.input(z.object({ id: z.string().uuid("Invalid deck ID") }))
		.query(async ({ ctx, input }) => {
			try {
				const deck = await ctx.db
					.select()
					.from(flashcardDecks)
					.where(
						and(
							eq(flashcardDecks.id, input.id),
							eq(flashcardDecks.userId, ctx.auth.user.id),
						),
					)
					.limit(1)
					.then((rows) => rows[0] || null);

				if (!deck) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Deck not found or you don't have permission to view it",
					});
				}

				return deck;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Error fetching deck:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch deck",
				});
			}
		}),

	/**
	 * Update a deck
	 */
	updateDeck: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid("Invalid deck ID"),
				name: z.string().min(1, "Deck name is required").optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;

			if (Object.keys(updateData).length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No fields provided for update",
				});
			}

			try {
				const existing = await ctx.db
					.select({ id: flashcardDecks.id })
					.from(flashcardDecks)
					.where(
						and(
							eq(flashcardDecks.id, id),
							eq(flashcardDecks.userId, ctx.auth.user.id),
						),
					)
					.limit(1)
					.then((rows) => rows[0] || null);

				if (!existing) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Deck not found or you don't have permission to update it",
					});
				}

				const updated = await ctx.db
					.update(flashcardDecks)
					.set({
						...updateData,
						updatedAt: new Date(),
					})
					.where(eq(flashcardDecks.id, id))
					.returning();

				if (updated.length === 0) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to update deck",
					});
				}

				return updated[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Error updating deck:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update deck",
				});
			}
		}),

	/**
	 * Delete a deck
	 */
	deleteDeck: protectedProcedure
		.input(z.object({ id: z.string().uuid("Invalid deck ID") }))
		.mutation(async ({ ctx, input }) => {
			try {
				const existing = await ctx.db
					.select({ id: flashcardDecks.id })
					.from(flashcardDecks)
					.where(
						and(
							eq(flashcardDecks.id, input.id),
							eq(flashcardDecks.userId, ctx.auth.user.id),
						),
					)
					.limit(1)
					.then((rows) => rows[0] || null);

				if (!existing) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Deck not found or you don't have permission to delete it",
					});
				}

				// Delete all flashcards in the deck first
				await ctx.db
					.delete(flashcards)
					.where(
						and(
							eq(flashcards.deckId, input.id),
							eq(flashcards.userId, ctx.auth.user.id),
						),
					);

				// Then delete the deck
				const deleted = await ctx.db
					.delete(flashcardDecks)
					.where(eq(flashcardDecks.id, input.id))
					.returning({ deletedId: flashcardDecks.id });

				if (deleted.length === 0) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to delete deck",
					});
				}

				// Safely access the result with optional chaining
				const deletedId = deleted[0]?.deletedId;
				return { success: true, deletedId };
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Error deleting deck:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete deck",
				});
			}
		}),
	/**
	 * Create a new flashcard
	 */
	createFlashcard: protectedProcedure
		.input(
			z.object({
				question: z.string().min(1, "Question is required"),
				answer: z.string().min(1, "Answer is required"),
				title: z.string().optional(),
				imageUrl: z.string().url("Invalid URL").optional().nullable(),
				tags: z.array(z.string()).optional(),
				deckId: z.string().uuid("Invalid deck ID").optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				// If deckId is provided, verify it belongs to the user
				if (input.deckId) {
					const deck = await ctx.db
						.select({ id: flashcardDecks.id })
						.from(flashcardDecks)
						.where(
							and(
								eq(flashcardDecks.id, input.deckId),
								eq(flashcardDecks.userId, ctx.auth.user.id),
							),
						)
						.limit(1)
						.then((rows) => rows[0] || null);

					if (!deck) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message:
								"Deck not found or you don't have permission to add cards to it",
						});
					}
				}

				// Create the flashcard with the user ID from the context
				const newFlashcard = await ctx.db
					.insert(flashcards)
					.values({
						userId: ctx.auth.user.id,
						deckId: input.deckId,
						question: input.question,
						answer: input.answer,
						title: input.title || "",
						imageUrl: input.imageUrl || "",
						tags: input.tags || [],
						// SRS fields will use their default values
						aiGenerated: false,
					})
					.returning();

				return newFlashcard[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Error creating flashcard:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create flashcard",
				});
			}
		}),

	/**
	 * Get all flashcards for the current user
	 */
	getFlashcards: protectedProcedure
		.input(
			z
				.object({
					deckId: z.string().uuid("Invalid deck ID").optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			try {
				let whereClause: SQL<unknown> | undefined;

				if (input?.deckId) {
					// Filter by deck ID and user ID
					whereClause = and(
						eq(flashcards.userId, ctx.auth.user.id),
						eq(flashcards.deckId, input.deckId),
					);
				} else {
					// Just filter by user ID
					whereClause = eq(flashcards.userId, ctx.auth.user.id);
				}

				// Use direct query instead of prepared statement with explicit column selection
				const userFlashcards = await ctx.db
					.select({
						id: flashcards.id,
						userId: flashcards.userId,
						deckId: flashcards.deckId,
						question: flashcards.question,
						answer: flashcards.answer,
						title: flashcards.title,
						imageUrl: flashcards.imageUrl,
						createdAt: flashcards.createdAt,
						tags: flashcards.tags,
						repetitions: flashcards.repetitions,
						easeFactor: flashcards.easeFactor,
						interval: flashcards.interval,
						nextReview: flashcards.nextReview,
						lastReview: flashcards.lastReview,
						aiGenerated: flashcards.aiGenerated,
						deckName: flashcardDecks.name,
					})
					.from(flashcards)
					.leftJoin(flashcardDecks, eq(flashcards.deckId, flashcardDecks.id))
					.where(whereClause)
					.orderBy(desc(flashcards.createdAt));

				// Transform result to match the expected format with deck property
				return userFlashcards.map((card) => ({
					...card,
					deck: card.deckName ? { name: card.deckName } : null,
					deckName: undefined, // Remove the extra property
				}));
			} catch (error) {
				console.error("Error fetching flashcards:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch flashcards",
				});
			}
		}),

	/**
	 * Update an existing flashcard
	 */
	updateFlashcard: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid("Invalid flashcard ID"),
				question: z.string().min(1, "Question cannot be empty").optional(),
				answer: z.string().min(1, "Answer cannot be empty").optional(),
				title: z.string().optional(),
				imageUrl: z
					.string()
					.url("Invalid image URL")
					.optional()
					.or(z.literal("")),
				tags: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;

			// Ensure there's something to update
			if (Object.keys(updateData).length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No fields provided for update.",
				});
			}

			try {
				// Find the flashcard first to ensure it belongs to the user
				const existingFlashcard = await ctx.db
					.select({ id: flashcards.id })
					.from(flashcards)
					.where(
						and(eq(flashcards.id, id), eq(flashcards.userId, ctx.auth.user.id)),
					)
					.limit(1)
					.then((rows) => rows[0] || null);

				if (!existingFlashcard) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message:
							"Flashcard not found or you do not have permission to update it.",
					});
				}

				// Perform the update
				const updatedFlashcards = await ctx.db
					.update(flashcards)
					.set({
						...updateData,
					})
					.where(eq(flashcards.id, id))
					.returning();

				if (updatedFlashcards.length === 0) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to update flashcard after verification.",
					});
				}

				return updatedFlashcards[0];
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error updating flashcard:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update flashcard.",
				});
			}
		}),

	/**
	 * Delete a flashcard
	 */
	deleteFlashcard: protectedProcedure
		.input(z.object({ id: z.string().uuid("Invalid flashcard ID") }))
		.mutation(async ({ ctx, input }) => {
			const { id } = input;

			try {
				// Verify ownership and existence before deleting
				const existingFlashcard = await ctx.db
					.select({ id: flashcards.id })
					.from(flashcards)
					.where(
						and(eq(flashcards.id, id), eq(flashcards.userId, ctx.auth.user.id)),
					)
					.limit(1)
					.then((rows) => rows[0] || null);

				if (!existingFlashcard) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message:
							"Flashcard not found or you do not have permission to delete it.",
					});
				}

				// Perform the deletion
				const deletedResult = await ctx.db
					.delete(flashcards)
					.where(eq(flashcards.id, id))
					.returning({ deletedId: flashcards.id });

				if (deletedResult.length === 0) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to delete flashcard after verification.",
					});
				}

				// Use optional chaining for safety
				const deletedId = deletedResult[0]?.deletedId;
				return { success: true, deletedId };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("Error deleting flashcard:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete flashcard.",
				});
			}
		}),

	// The updated version for getDueCards with limit and proper null handling
	getDueCards: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			try {
				const now = new Date();
				const limit = input?.limit ?? 20;

				const dueCards = await ctx.db
					.select()
					.from(flashcards)
					.where(
						and(
							eq(flashcards.userId, ctx.auth.user.id),
							or(
								isNull(flashcards.nextReview),
								lte(flashcards.nextReview, now),
							),
						),
					)
					.orderBy(asc(flashcards.nextReview))
					.limit(limit);

				return dueCards;
			} catch (error) {
				console.error("Error fetching due cards:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch due cards.",
				});
			}
		}),

	// The updated version for recordStudyResult with the correct SM-2 algorithm
	recordStudyResult: protectedProcedure
		.input(
			z.object({
				flashcardId: z.string().uuid("Invalid flashcard ID"),
				rating: z.number().int().min(1).max(4),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { flashcardId, rating } = input;

			try {
				const card = await ctx.db
					.select()
					.from(flashcards)
					.where(
						and(
							eq(flashcards.id, flashcardId),
							eq(flashcards.userId, ctx.auth.user.id),
						),
					)
					.limit(1)
					.then((rows) => rows[0] || null);

				if (!card) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Flashcard not found.",
					});
				}

				let repetitions = card.repetitions ?? 0;
				let easeFactor = card.easeFactor ?? 2.5;
				let interval = card.interval ?? 1;

				const now = new Date();

				if (rating === 1) {
					repetitions = 0;
					interval = 1;
					// easeFactor unchanged
				} else if (rating === 2) {
					easeFactor = Math.max(1.3, easeFactor - 0.15);
					repetitions += 1;
					if (repetitions === 1) interval = 1;
					else if (repetitions === 2) interval = 6;
					else interval = Math.ceil(interval * easeFactor);
				} else if (rating === 3) {
					repetitions += 1;
					if (repetitions === 1) interval = 1;
					else if (repetitions === 2) interval = 6;
					else interval = Math.ceil(interval * easeFactor);
				} else if (rating === 4) {
					easeFactor = easeFactor + 0.15;
					repetitions += 1;
					if (repetitions === 1) interval = 1;
					else if (repetitions === 2) interval = 6;
					else interval = Math.ceil(interval * easeFactor * 1.2);
				}

				const nextReview = new Date(now);
				nextReview.setDate(now.getDate() + interval);

				const updated = await ctx.db
					.update(flashcards)
					.set({
						repetitions,
						easeFactor,
						interval,
						lastReview: now,
						nextReview,
					})
					.where(eq(flashcards.id, flashcardId))
					.returning();

				if (updated.length === 0) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to update flashcard after study.",
					});
				}

				return updated[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Error recording study result:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to record study result.",
				});
			}
		}),

	/**
	 * Update study statistics
	 */
	updateStudyStats: protectedProcedure
		.input(
			z.object({
				totalReviewed: z.number().int().min(1),
				isCorrect: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { totalReviewed, isCorrect } = input;
			const now = new Date();
			const today = now.toISOString().split("T")[0]; // Get YYYY-MM-DD format

			try {
				// Get or create study stats for today
				const existingStats = await ctx.db
					.select()
					.from(studyStats)
					.where(
						and(
							eq(studyStats.userId, ctx.auth.user.id),
							sql`DATE(last_study_date) = ${today}`,
						),
					)
					.limit(1)
					.then((rows) => rows[0]);

				if (existingStats) {
					// Update existing stats for today
					return await ctx.db
						.update(studyStats)
						.set({
							studiedToday: existingStats.studiedToday + 1,
							totalStudied: existingStats.totalStudied + 1,
							correctToday: isCorrect
								? existingStats.correctToday + 1
								: existingStats.correctToday,
							totalCorrect: isCorrect
								? existingStats.totalCorrect + 1
								: existingStats.totalCorrect,
							lastStudyDate: now,
						})
						.where(eq(studyStats.id, existingStats.id))
						.returning();
				} else {
					// Create new stats entry
					// Create new stats entry for today
					return await ctx.db
						.insert(studyStats)
						.values({
							userId: ctx.auth.user.id,
							studiedToday: 1,
							totalStudied: 1,
							correctToday: isCorrect ? 1 : 0,
							totalCorrect: isCorrect ? 1 : 0,
							streak: 1,
							lastStudyDate: sql`CURRENT_TIMESTAMP`,
						})
						.returning();
				}
			} catch (error) {
				console.error("Error updating study stats:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update study statistics",
				});
			}
		}),

	/**
	 * Get study statistics for the current user
	 */
	getStudyStats: protectedProcedure.query(async ({ ctx }) => {
		try {
			const stats = await ctx.db
				.select()
				.from(studyStats)
				.where(eq(studyStats.userId, ctx.auth.user.id))
				.orderBy(desc(studyStats.lastStudyDate))
				.limit(1)
				.then((rows) => rows[0] || null);

			return stats;
		} catch (error) {
			console.error("Error fetching study stats:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch study statistics",
			});
		}
	}),
});
