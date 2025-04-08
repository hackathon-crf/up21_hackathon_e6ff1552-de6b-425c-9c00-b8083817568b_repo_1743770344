import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Create a simple example posts router without database integration for now
export const postRouter = createTRPCRouter({
	hello: publicProcedure
		.input(z.object({ text: z.string() }))
		.query(({ input }) => {
			return {
				greeting: `Hello ${input.text}`,
			};
		}),

	// Simplified version without database operations
	create: publicProcedure
		.input(z.object({ name: z.string().min(1) }))
		.mutation(async ({ input }) => {
			// Return success message instead of database operation
			return {
				success: true,
				message: `Post "${input.name}" would be created here`,
			};
		}),

	// Simplified version without database operations
	getLatest: publicProcedure.query(() => {
		// Return mock data instead of database query
		return {
			id: 1,
			name: "Example Post",
			createdAt: new Date(),
		};
	}),
});
