import { aiRouter } from "./routers/ai";
import { chatRouter } from "./routers/chat";
import { preferencesRouter } from "./routers/preferences";
import { createTRPCRouter, publicProcedure } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	chat: chatRouter,
	ai: aiRouter,
	preferences: preferencesRouter,

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
