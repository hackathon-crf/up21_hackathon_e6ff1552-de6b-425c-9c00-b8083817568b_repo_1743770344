import { createTRPCRouter } from "./trpc";
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
});

// export type definition of API
export type AppRouter = typeof appRouter;