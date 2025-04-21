import { aiRouter } from "./routers/ai"; // Added import for aiRouter
import { chatRouter } from "./routers/chat";
import { flashcardRouter } from "./routers/flashcard"; // Import flashcard router
import { postRouter } from "./routers/post"; // Import post router
import { createTRPCRouter, publicProcedure } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	chat: chatRouter,
	ai: aiRouter, // Registered aiRouter
	flashcard: flashcardRouter, // Register flashcard router
	post: postRouter, // Register post router

	// Simple healthcheck procedure for server health monitoring
	healthcheck: publicProcedure.query(() => {
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			version: "1.0.0",
		};
	}),
});

// export type definition of API
export type AppRouter = typeof appRouter;
