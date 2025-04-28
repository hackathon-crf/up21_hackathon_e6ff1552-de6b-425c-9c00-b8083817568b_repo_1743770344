import { aiRouter } from "./routers/ai";
import { chatRouter } from "./routers/chat";
import { dashboardRouter } from "./routers/dashboard";
import { flashcardRouter } from "./routers/flashcard";
import { postRouter } from "./routers/post";
import { userRouter } from "./routers/user";
import { createTRPCRouter, publicProcedure } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	chat: chatRouter,
	ai: aiRouter,
	flashcard: flashcardRouter,
	post: postRouter,
	user: userRouter,
	dashboard: dashboardRouter,

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
