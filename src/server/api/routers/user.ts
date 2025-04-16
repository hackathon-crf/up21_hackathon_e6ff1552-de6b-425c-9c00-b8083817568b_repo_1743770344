import { sql, eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
	// Get the current user's profile
	getProfile: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db
			.select()
			.from(users)
			.where(eq(users.id, ctx.auth.user.id))
			.limit(1)
			.then(rows => rows[0] || null);

		return user;
	}),

	// Check if a user exists in our database (not just Supabase Auth)
	userExists: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const user = await ctx.db
				.select()
				.from(users)
				.where(eq(users.id, input.userId))
				.limit(1)
				.then(rows => rows[0] || null);

			return !!user;
		}),

	// Create or update a user in our database (synchronize with Supabase Auth)
	syncUser: protectedProcedure.mutation(async ({ ctx }) => {
		const { user } = ctx.auth;

		// Check if user exists in our database
		const existingUser = await ctx.db
			.select()
			.from(users)
			.where(eq(users.id, user.id))
			.limit(1)
			.then(rows => rows[0] || null);

		if (existingUser) {
			// Update user if needed
			if (existingUser.email !== user.email) {
				await ctx.db
					.update(users)
					.set({ email: user.email ?? existingUser.email })
					.where(eq(users.id, user.id));
			}
			return existingUser;
		}

		// Create new user
		const newUser = await ctx.db
			.insert(users)
			.values({
				id: user.id,
				email: user.email ?? "",
			})
			.returning();

		return newUser[0];
	}),
});
