import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { studyStats, users } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
	// Get the current user's profile
	getProfile: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db
			.select()
			.from(users)
			.where(eq(users.id, ctx.auth.user.id))
			.limit(1)
			.then((rows) => rows[0] || null);

		return user;
	}),

	// Get detailed profile information including stats and achievements
	getDetailedProfile: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.auth.user.id;

		// Get user base info
		const user = await ctx.db
			.select({
				id: users.id,
				email: users.email,
				emailVerified: users.emailVerified,
				createdAt: users.createdAt,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1)
			.then((rows) => rows[0]);

		if (!user) {
			throw new Error("User not found");
		}

		// Get study stats for training hours and course completion
		const stats = await ctx.db
			.select({
				totalStudied: studyStats.totalStudied,
				studiedToday: studyStats.studiedToday,
				streak: studyStats.streak,
				lastStudyDate: studyStats.lastStudyDate,
			})
			.from(studyStats)
			.where(eq(studyStats.userId, userId))
			.limit(1)
			.then((rows) => rows[0]);

		// Calculate training hours (assuming each study session is 30 minutes)
		const trainingHours = Math.floor((stats?.totalStudied || 0) * 0.5);

		// Format the data for the profile page
		return {
			id: user.id,
			email: user.email,
			emailVerified: user.emailVerified,
			joinDate: user.createdAt,
			stats: {
				coursesCompleted: stats?.totalStudied || 0,
				trainingHours,
				badgesEarned: 0, // TODO: Implement badges system
				streak: stats?.streak || 0,
				studiedToday: stats?.studiedToday || 0,
				lastStudyDate: stats?.lastStudyDate,
			},
		};
	}),

	// Update user profile
	updateProfile: protectedProcedure
		.input(
			z.object({
				email: z.string().email().optional(),
				emailVerified: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.auth.user.id;

			try {
				const updated = await ctx.db
					.update(users)
					.set({
						...input,
						updatedAt: new Date(),
					})
					.where(eq(users.id, userId))
					.returning();

				if (!updated.length) {
					throw new Error("Failed to update profile");
				}

				return updated[0];
			} catch (error) {
				throw new Error(
					`Failed to update profile: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}),

	// Check if user exists by ID
	userExists: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const user = await ctx.db
				.select()
				.from(users)
				.where(eq(users.id, input.userId))
				.limit(1)
				.then((rows) => rows[0] || null);

			return !!user;
		}),
});
