import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { flashcards, flashcardDecks } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, lte, sql, or, desc, asc } from "drizzle-orm";

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
      const userDecks = await ctx.db.query.flashcardDecks.findMany({
        where: eq(flashcardDecks.userId, ctx.user.id),
        orderBy: [desc(flashcardDecks.updatedAt)],
        with: {
          flashcards: {
            columns: {
              id: true,
            },
          },
        },
      });

      // Transform the result to include card count
      return userDecks.map(deck => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
        cardCount: deck.flashcards.length,
      }));
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const newDeck = await ctx.db
          .insert(flashcardDecks)
          .values({
            userId: ctx.user.id,
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
        const deck = await ctx.db.query.flashcardDecks.findFirst({
          where: and(
            eq(flashcardDecks.id, input.id),
            eq(flashcardDecks.userId, ctx.user.id)
          ),
        });

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
      })
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
        const existing = await ctx.db.query.flashcardDecks.findFirst({
          where: and(
            eq(flashcardDecks.id, id),
            eq(flashcardDecks.userId, ctx.user.id)
          ),
          columns: { id: true },
        });

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
        const existing = await ctx.db.query.flashcardDecks.findFirst({
          where: and(
            eq(flashcardDecks.id, input.id),
            eq(flashcardDecks.userId, ctx.user.id)
          ),
          columns: { id: true },
        });

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
              eq(flashcards.userId, ctx.user.id)
            )
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

        return { success: true, deletedId: deleted[0].deletedId };
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
   * 
   * Takes validated input for the flashcard fields and creates a new flashcard
   * in the database associated with the current user
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // If deckId is provided, verify it belongs to the user
        if (input.deckId) {
          const deck = await ctx.db.query.flashcardDecks.findFirst({
            where: and(
              eq(flashcardDecks.id, input.deckId),
              eq(flashcardDecks.userId, ctx.user.id)
            ),
            columns: { id: true },
          });

          if (!deck) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Deck not found or you don't have permission to add cards to it",
            });
          }
        }

        // Create the flashcard with the user ID from the context
        const newFlashcard = await ctx.db
          .insert(flashcards)
          .values({
            userId: ctx.user.id,
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
   * 
   * Retrieves flashcards from the database filtered by the current user ID
   */
  getFlashcards: protectedProcedure
    .input(
      z.object({
        deckId: z.string().uuid("Invalid deck ID").optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        let whereClause;
        
        if (input?.deckId) {
          // Filter by deck ID and user ID
          whereClause = and(
            eq(flashcards.userId, ctx.user.id),
            eq(flashcards.deckId, input.deckId)
          );
        } else {
          // Just filter by user ID
          whereClause = eq(flashcards.userId, ctx.user.id);
        }
        
        const userFlashcards = await ctx.db.query.flashcards.findMany({
          where: whereClause,
          orderBy: [desc(flashcards.createdAt)],
          with: {
            deck: {
              columns: {
                name: true,
              },
            },
          },
        });

        return userFlashcards;
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
   * 
   * Takes the flashcard ID and fields to update. Ensures the flashcard
   * belongs to the current user before updating.
   */
  updateFlashcard: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid("Invalid flashcard ID"),
        question: z.string().min(1, "Question cannot be empty").optional(),
        answer: z.string().min(1, "Answer cannot be empty").optional(),
        title: z.string().optional(),
        imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
        tags: z.array(z.string()).optional(),
      })
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
        const existingFlashcard = await ctx.db.query.flashcards.findFirst({
          where: and(eq(flashcards.id, id), eq(flashcards.userId, ctx.user.id)),
          columns: { id: true }, // Only need the ID to confirm existence and ownership
        });

        if (!existingFlashcard) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Flashcard not found or you do not have permission to update it.",
          });
        }

        // Perform the update
        const updatedFlashcards = await ctx.db
          .update(flashcards)
          .set({
            ...updateData,
            // Ensure optional fields that are explicitly set to undefined are handled correctly
            // Drizzle's .set should handle undefined values by not updating those fields
          })
          .where(eq(flashcards.id, id))
          .returning();

        if (updatedFlashcards.length === 0) {
          // This case should ideally not happen if the findFirst check passed, but good for safety
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update flashcard after verification.",
          });
        }

        return updatedFlashcards[0];
      } catch (error) {
        // Handle known TRPC errors
        if (error instanceof TRPCError) {
          throw error;
        }
        // Handle potential database or other errors
        console.error("Error updating flashcard:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update flashcard.",
        });
      }
    }),

  /**
   * Delete a flashcard
   * 
   * Takes the flashcard ID and deletes it, ensuring it belongs to the current user.
   */
  deleteFlashcard: protectedProcedure
    .input(z.object({ id: z.string().uuid("Invalid flashcard ID") }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      try {
        // Verify ownership and existence before deleting
        const existingFlashcard = await ctx.db.query.flashcards.findFirst({
          where: and(eq(flashcards.id, id), eq(flashcards.userId, ctx.user.id)),
          columns: { id: true },
        });

        if (!existingFlashcard) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Flashcard not found or you do not have permission to delete it.",
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

        return { success: true, deletedId: deletedResult[0]?.deletedId };
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

  /**
   * Get flashcards due for review
   * 
   * Retrieves flashcards for the current user where the next review date
   * is in the past or is today.
   */
  getDueCards: protectedProcedure.query(async ({ ctx }) => {
    try {
      const now = new Date();
      const dueFlashcards = await ctx.db.query.flashcards.findMany({
        where: and(
          eq(flashcards.userId, ctx.user.id),
          // Card is due if nextReview is null (new card) or <= now
          lte(flashcards.nextReview, now) // Using lte directly with Date object
          // Alternatively, for explicit SQL NOW(): lte(flashcards.nextReview, sql`CURRENT_TIMESTAMP`)
        ),
        orderBy: (flashcards, { asc }) => [asc(flashcards.nextReview)], // Show oldest due cards first
      });

      return dueFlashcards;
    } catch (error) {
      console.error("Error fetching due flashcards:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch due flashcards.",
      });
    }
  }),

  /**
   * Record the result of a study session for a single flashcard
   * 
   * Updates the SRS (Spaced Repetition System) fields based on user performance (quality rating).
   * Uses a simplified SM-2 algorithm.
   */
  recordStudyResult: protectedProcedure
    .input(
      z.object({
        flashcardId: z.string().uuid("Invalid flashcard ID"),
        // Quality rating: 0 (worst) to 5 (best)
        // 0-2: Incorrect, reset interval
        // 3-5: Correct, adjust interval based on ease
        quality: z.number().min(0).max(5, "Quality must be between 0 and 5"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { flashcardId, quality } = input;

      try {
        // Fetch the flashcard with its current SRS state
        const flashcard = await ctx.db.query.flashcards.findFirst({
          where: and(eq(flashcards.id, flashcardId), eq(flashcards.userId, ctx.user.id)),
        });

        if (!flashcard) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Flashcard not found" });
        }

        // Initialize SRS values from the fetched card or use defaults
        let { repetitions, easeFactor, interval } = flashcard;
        repetitions = repetitions ?? 0;
        easeFactor = easeFactor ?? 2.5; // Default ease factor
        interval = interval ?? 1; // Default interval in days

        const now = new Date();
        let nextReviewDate: Date;

        if (quality < 3) {
          // Incorrect recall (quality 0, 1, 2)
          repetitions = 0; // Reset repetitions count
          interval = 1; // Reset interval to 1 day
        } else {
          // Correct recall (quality 3, 4, 5)
          repetitions += 1;

          // Update ease factor
          easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
          if (easeFactor < 1.3) {
            easeFactor = 1.3; // Minimum ease factor
          }

          // Update interval based on repetitions
          if (repetitions === 1) {
            interval = 1;
          } else if (repetitions === 2) {
            interval = 6;
          } else {
            // Calculate next interval, rounding up
            interval = Math.ceil(interval * easeFactor);
          }
        }

        // Calculate the next review date by adding the interval (in days)
        nextReviewDate = new Date(now);
        nextReviewDate.setDate(now.getDate() + interval);
        // Set time to beginning of the day for consistency? Or keep the current time?
        // Let's keep the current time for now. Could adjust to midnight:
        // nextReviewDate.setHours(0, 0, 0, 0); 

        // Update the flashcard in the database
        const updatedFlashcards = await ctx.db
          .update(flashcards)
          .set({
            repetitions,
            easeFactor,
            interval,
            lastReview: now,
            nextReview: nextReviewDate,
          })
          .where(eq(flashcards.id, flashcardId))
          .returning();
        
        if (updatedFlashcards.length === 0) {
           throw new TRPCError({
             code: "INTERNAL_SERVER_ERROR",
             message: "Failed to update flashcard SRS data after calculation.",
           });
         }

        // Return the updated flashcard data
        return updatedFlashcards[0];

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error recording study result:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record study result.",
        });
      }
    }),
  // The updated version for getDueCards with limit and proper null handling
  getDueCards: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const now = new Date();
        const limit = input?.limit ?? 20;

        const dueCards = await ctx.db.query.flashcards.findMany({
          where: and(
            eq(flashcards.userId, ctx.user.id),
            or(
              flashcards.nextReview.isNull(),
              lte(flashcards.nextReview, now)
            )
          ),
          orderBy: (flashcards, { asc }) => [
            asc(flashcards.nextReview),
          ],
          limit,
        });

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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { flashcardId, rating } = input;

      try {
        const card = await ctx.db.query.flashcards.findFirst({
          where: and(eq(flashcards.id, flashcardId), eq(flashcards.userId, ctx.user.id)),
        });

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
});
