import { createTRPCRouter, publicProcedure } from "./trpc";
import { chatRouter } from "./routers/chat";
import { aiRouter } from "./routers/ai"; // Added import for aiRouter

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chat: chatRouter,
  ai: aiRouter, // Registered aiRouter
  
  // Simple healthcheck procedure
  healthcheck: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    };
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;