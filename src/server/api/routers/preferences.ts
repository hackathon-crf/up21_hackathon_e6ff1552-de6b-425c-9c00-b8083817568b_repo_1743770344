import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { userPreferences } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Zod schema for user preferences
const UserPreferencesSchema = z.object({
	// Learning preferences
	study_reminder_time: z.number().int().min(0).max(23).default(18),
	cards_per_day: z.number().int().min(1).max(1000).default(20),
	weekend_reminders: z.boolean().default(true),
	// Theme preferences
	theme: z.enum(["light", "dark", "system"]).default("system"),
	// Notification preferences
	study_notifications: z.boolean().default(true),
	achievement_notifications: z.boolean().default(true),
	email_notifications: z.boolean().default(false),
	// Privacy preferences
	share_activity: z.boolean().default(true),
	data_collection: z.boolean().default(true),
});

type UserPreferencesType = z.infer<typeof UserPreferencesSchema>;

export const preferencesRouter = createTRPCRouter({
	// Get user preferences (with defaults if none exist)
	get: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.auth.user?.id;
		if (!userId) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to access preferences",
			});
		}

		try {
			const userPrefs = await ctx.db
				.select()
				.from(userPreferences)
				.where(eq(userPreferences.user_id, userId))
				.limit(1)
				.then((rows) => rows[0] || null);

			if (!userPrefs) {
				// Return default preferences if none exist
				const defaultPrefs = UserPreferencesSchema.parse({});
				console.log(
					"[preferences.get] - No preferences found, returning defaults",
				);
				return defaultPrefs;
			}

			console.log("[preferences.get] - Retrieved user preferences");
			return {
				study_reminder_time: userPrefs.study_reminder_time,
				cards_per_day: userPrefs.cards_per_day,
				weekend_reminders: userPrefs.weekend_reminders,
				theme: userPrefs.theme,
				study_notifications: userPrefs.study_notifications,
				achievement_notifications: userPrefs.achievement_notifications,
				email_notifications: userPrefs.email_notifications,
				share_activity: userPrefs.share_activity,
				data_collection: userPrefs.data_collection,
			} as UserPreferencesType;
		} catch (error) {
			console.error("[preferences.get] - Error retrieving preferences:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to retrieve user preferences",
				cause: error,
			});
		}
	}),

	// Update user preferences (create if doesn't exist, update if exists)
	update: protectedProcedure
		.input(UserPreferencesSchema.partial())
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.auth.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to update preferences",
				});
			}

			try {
				console.log(
					"[preferences.update] - Updating preferences for user:",
					userId,
				);
				console.log("[preferences.update] - Input:", input);

				// Check if preferences already exist
				const existingPrefs = await ctx.db
					.select()
					.from(userPreferences)
					.where(eq(userPreferences.user_id, userId))
					.limit(1)
					.then((rows) => rows[0] || null);

				if (existingPrefs) {
					// Update existing preferences
					const updatedPrefs = await ctx.db
						.update(userPreferences)
						.set({
							...input,
							updated_at: new Date(),
						})
						.where(eq(userPreferences.user_id, userId))
						.returning();

					console.log("[preferences.update] - Updated existing preferences");
					return updatedPrefs[0];
				}
				// Create new preferences with defaults merged with input
				const defaultPrefs = UserPreferencesSchema.parse({});
				const newPrefs = { ...defaultPrefs, ...input };

				const createdPrefs = await ctx.db
					.insert(userPreferences)
					.values({
						user_id: userId,
						...newPrefs,
					})
					.returning();

				console.log("[preferences.update] - Created new preferences");
				return createdPrefs[0];
			} catch (error) {
				console.error(
					"[preferences.update] - Error updating preferences:",
					error,
				);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update user preferences",
					cause: error,
				});
			}
		}),

	// Reset preferences to defaults
	reset: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.auth.user?.id;
		if (!userId) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to reset preferences",
			});
		}

		try {
			console.log(
				"[preferences.reset] - Resetting preferences for user:",
				userId,
			);

			const defaultPrefs = UserPreferencesSchema.parse({});

			// Check if preferences exist
			const existingPrefs = await ctx.db
				.select()
				.from(userPreferences)
				.where(eq(userPreferences.user_id, userId))
				.limit(1)
				.then((rows) => rows[0] || null);

			if (existingPrefs) {
				// Update with defaults
				const resetPrefs = await ctx.db
					.update(userPreferences)
					.set({
						...defaultPrefs,
						updated_at: new Date(),
					})
					.where(eq(userPreferences.user_id, userId))
					.returning();

				console.log(
					"[preferences.reset] - Reset existing preferences to defaults",
				);
				return resetPrefs[0];
			}
			// Create with defaults
			const createdPrefs = await ctx.db
				.insert(userPreferences)
				.values({
					user_id: userId,
					...defaultPrefs,
				})
				.returning();

			console.log("[preferences.reset] - Created preferences with defaults");
			return createdPrefs[0];
		} catch (error) {
			console.error(
				"[preferences.reset] - Error resetting preferences:",
				error,
			);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to reset user preferences",
				cause: error,
			});
		}
	}),
});

export type UserPreferences = UserPreferencesType;
