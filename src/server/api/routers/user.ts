import { sql } from "drizzle-orm";
import { z } from "zod";
import { users } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
	// Get the current user's profile
	getProfile: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.query.users.findFirst({
			where: (users, { eq }) => eq(users.id, ctx.user.id),
		});

		return user;
	}),

	// Check if a user exists in our database (not just Supabase Auth)
	userExists: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const user = await ctx.db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, input.userId),
			});

			return !!user;
		}),

	// Create or update a user in our database (synchronize with Supabase Auth)
	syncUser: protectedProcedure.mutation(async ({ ctx }) => {
		const { user } = ctx;

		// Check if user exists in our database
		const existingUser = await ctx.db.query.users.findFirst({
			where: (users, { eq }) => eq(users.id, user.id),
		});

		if (existingUser) {
			// Update user if needed
			if (existingUser.email !== user.email) {
				await ctx.db
					.update(users)
					.set({ email: user.email ?? existingUser.email })
					.where(sql`id = ${user.id}`);
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
