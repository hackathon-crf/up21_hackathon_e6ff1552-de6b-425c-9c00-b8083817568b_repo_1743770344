import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
	chatSessions,
	flashcardDecks,
	flashcards,
	gameAnswers,
	gameLobbies,
	gamePlayers,
	gameRounds,
	studyStats,
} from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Define types for dashboard data
interface SummaryCard {
	value: number;
	changeText: string;
}

interface WeeklyProgressData {
	day: string;
	cards: number;
	games: number;
	chat: number;
	[key: string]: string | number;
}

interface LearningProgress {
	id: number;
	title: string;
	progress: number;
	dueCards: number;
}

interface UpcomingReview {
	period: string;
	dueCards: number;
	actionText: string;
	actionVariant:
		| "default"
		| "outline"
		| "secondary"
		| "destructive"
		| "ghost"
		| "link";
}

interface Activity {
	activity: string;
	timestamp: string;
	icon: string;
}

interface Recommendation {
	title: string;
	description: string;
	icon: string;
}

interface DashboardData {
	summaryCards: {
		trainingStreak: SummaryCard;
		cardsReviewed: SummaryCard;
		gameScore: SummaryCard;
		aiChats: SummaryCard;
	};
	weeklyProgress: WeeklyProgressData[];
	learningProgress: LearningProgress[];
	upcomingReviews: UpcomingReview[];
	recentActivity: Activity[];
	trainingRecommendations: Recommendation[];
}

export const dashboardRouter = createTRPCRouter({
	// Get training streak data
	getTrainingStreak: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.auth.user.id;

			// Get streak data from the study_stat table
			const stats = await ctx.db
				.select({ streak: studyStats.streak })
				.from(studyStats)
				.where(eq(studyStats.userId, userId))
				.limit(1);

			// If no data or empty array, return default values
			if (!stats || stats.length === 0) {
				return {
					value: 0,
					changeText: "Start your first streak!",
				};
			}

			// Use the streak value from the query
			const streak = stats[0]?.streak || 0;

			return {
				value: streak,
				changeText: "Current streak",
			};
		} catch (e) {
			console.error("Error in getTrainingStreak:", e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch training streak data",
			});
		}
	}),

	// Get cards reviewed data
	getCardsReviewed: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.auth.user.id;
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			// Get total flashcards that have been reviewed (have a last_review date)
			const totalReviewed = await ctx.db
				.select({ id: flashcards.id })
				.from(flashcards)
				.where(
					and(eq(flashcards.userId, userId), isNotNull(flashcards.lastReview)),
				);

			// Get flashcards reviewed today
			const todayReviewed = await ctx.db
				.select({ id: flashcards.id })
				.from(flashcards)
				.where(
					and(eq(flashcards.userId, userId), gte(flashcards.lastReview, today)),
				);

			const totalCount = totalReviewed.length;
			const todayCount = todayReviewed.length;

			return {
				value: totalCount,
				changeText: `+${todayCount} today`,
			};
		} catch (e) {
			console.error("Error in getCardsReviewed:", e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch cards reviewed data",
			});
		}
	}),

	// Get game score data
	getGameScore: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.auth.user.id;

			// Get scores from the game_player table
			const scores = await ctx.db
				.select({
					score: gamePlayers.score,
					joinedAt: gamePlayers.joinedAt,
				})
				.from(gamePlayers)
				.where(eq(gamePlayers.userId, userId))
				.orderBy(desc(gamePlayers.joinedAt))
				.limit(10);

			// Handle case with no game data
			if (!scores || scores.length === 0) {
				return {
					value: 0,
					changeText: "No games played",
				};
			}

			// Calculate average score
			const scoreValues = scores.map((player) => player.score);
			const averageScore = Math.round(
				scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length,
			);

			// Calculate improvement (difference between latest game and average of previous games)
			const latestScore = scoreValues[0] || 0;
			const previousAverage =
				scoreValues.length > 1
					? Math.round(
							scoreValues.slice(1).reduce((sum, score) => sum + score, 0) /
								(scoreValues.length - 1),
						)
					: latestScore;

			const improvement =
				previousAverage > 0
					? Math.round(
							((latestScore - previousAverage) / previousAverage) * 100,
						)
					: 0;

			const changePrefix = improvement >= 0 ? "+" : "";

			return {
				value: averageScore,
				changeText: `${changePrefix}${improvement}% improvement`,
			};
		} catch (e) {
			console.error("Error in getGameScore:", e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch game score data",
			});
		}
	}),

	// Get AI chat data
	getAiChats: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.auth.user.id;

			// Get total chat sessions
			const totalChats = await ctx.db
				.select({ id: chatSessions.id })
				.from(chatSessions)
				.where(eq(chatSessions.user_id, userId));

			// Get new chat sessions in the last 24 hours
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const newChats = await ctx.db
				.select({ id: chatSessions.id })
				.from(chatSessions)
				.where(
					and(
						eq(chatSessions.user_id, userId),
						gte(chatSessions.created_at, yesterday),
					),
				);

			return {
				value: totalChats.length,
				changeText: `+${newChats.length} in 24h`,
			};
		} catch (e) {
			console.error("Error in getAiChats:", e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch AI chat data",
			});
		}
	}),

	// Get weekly progress data
	getWeeklyProgress: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.auth.user.id;
			const days = 7;
			const results: WeeklyProgressData[] = [];

			// Generate dates for the last 7 days
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - (days - 1));
			startDate.setHours(0, 0, 0, 0);

			// Get card review data from the flashcard table
			const cardsData = await ctx.db
				.select({ lastReview: flashcards.lastReview })
				.from(flashcards)
				.where(
					and(
						eq(flashcards.userId, userId),
						gte(flashcards.lastReview, startDate),
					),
				);

			// Get game data from game_player table
			const gamesData = await ctx.db
				.select({ joinedAt: gamePlayers.joinedAt })
				.from(gamePlayers)
				.where(
					and(
						eq(gamePlayers.userId, userId),
						gte(gamePlayers.joinedAt, startDate),
					),
				);

			// Get chat session data
			const chatsData = await ctx.db
				.select({ createdAt: chatSessions.created_at })
				.from(chatSessions)
				.where(
					and(
						eq(chatSessions.user_id, userId),
						gte(chatSessions.created_at, startDate),
					),
				);

			// Process data for each day
			for (let i = 0; i < days; i++) {
				const date = new Date(startDate);
				date.setDate(startDate.getDate() + i);

				const nextDate = new Date(date);
				nextDate.setDate(date.getDate() + 1);

				// Count cards reviewed on this day
				const dayCards = cardsData.filter((card) => {
					// Skip cards with null lastReview
					if (!card.lastReview) return false;
					const reviewDate = new Date(card.lastReview);
					return reviewDate >= date && reviewDate < nextDate;
				}).length;

				// Count games played on this day
				const dayGames = gamesData.filter((game) => {
					const gameDate = new Date(game.joinedAt);
					return gameDate >= date && gameDate < nextDate;
				}).length;

				// Count chat sessions on this day
				const dayChats = chatsData.filter((chat) => {
					const chatDate = new Date(chat.createdAt);
					return chatDate >= date && chatDate < nextDate;
				}).length;

				results.push({
					day: date.toLocaleDateString("en-US", { weekday: "short" }),
					cards: dayCards,
					games: dayGames,
					chat: dayChats,
				});
			}

			return results;
		} catch (e) {
			console.error("Error in getWeeklyProgress:", e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch weekly progress data",
			});
		}
	}),

	// Get learning progress
	getLearningProgress: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.auth.user.id;

			// Get flashcard decks and cards counts
			const decks = await ctx.db
				.select({
					id: flashcardDecks.id,
					name: flashcardDecks.name,
				})
				.from(flashcardDecks)
				.where(eq(flashcardDecks.userId, userId));

			// Process data for each deck
			const learningProgress: LearningProgress[] = await Promise.all(
				decks.map(async (deck, index) => {
					// Get all cards for this deck
					const cards = await ctx.db
						.select({
							id: flashcards.id,
							nextReview: flashcards.nextReview,
						})
						.from(flashcards)
						.where(
							and(
								eq(flashcards.userId, userId),
								eq(flashcards.deckId, deck.id),
							),
						);

					const totalCards = cards.length;

					// Count cards due for review
					const dueCards = cards.filter((card) => {
						if (!card.nextReview) return false;
						const reviewDate = new Date(card.nextReview);
						return reviewDate <= new Date();
					}).length;

					// Calculate progress percentage
					const reviewedCards = cards.filter((card) => card.nextReview).length;
					const progress =
						totalCards > 0 ? Math.round((reviewedCards / totalCards) * 100) : 0;

					return {
						id: index + 1,
						title: deck.name || `Deck ${index + 1}`,
						progress,
						dueCards,
					};
				}),
			);

			return learningProgress;
		} catch (e) {
			console.error("Error in getLearningProgress:", e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch learning progress data",
			});
		}
	}),

	// Get upcoming reviews
	getUpcomingReviews: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.auth.user.id;
			const now = new Date();

			// End of today (11:59:59 PM)
			const endOfToday = new Date();
			endOfToday.setHours(23, 59, 59, 999);

			// End of tomorrow
			const endOfTomorrow = new Date();
			endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
			endOfTomorrow.setHours(23, 59, 59, 999);

			// End of week
			const endOfWeek = new Date();
			endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
			endOfWeek.setHours(23, 59, 59, 999);

			// Get cards due today (up until now)
			const todayCards = await ctx.db
				.select({ id: flashcards.id })
				.from(flashcards)
				.where(
					and(
						eq(flashcards.userId, userId),
						isNotNull(flashcards.nextReview),
						gte(flashcards.nextReview, now),
					),
				);

			// Get cards due by end of day
			const remainingTodayCards = await ctx.db
				.select({ id: flashcards.id })
				.from(flashcards)
				.where(
					and(
						eq(flashcards.userId, userId),
						isNotNull(flashcards.nextReview),
						gte(flashcards.nextReview, now),
						lte(flashcards.nextReview, endOfToday),
					),
				);

			// Get cards due tomorrow
			const tomorrowCards = await ctx.db
				.select({ id: flashcards.id })
				.from(flashcards)
				.where(
					and(
						eq(flashcards.userId, userId),
						isNotNull(flashcards.nextReview),
						gte(flashcards.nextReview, endOfToday),
						lte(flashcards.nextReview, endOfTomorrow),
					),
				);

			// Get cards due this week
			const weekCards = await ctx.db
				.select({ id: flashcards.id })
				.from(flashcards)
				.where(
					and(
						eq(flashcards.userId, userId),
						gte(flashcards.nextReview, endOfTomorrow),
						lte(flashcards.nextReview, endOfWeek),
					),
				);

			const reviews: UpcomingReview[] = [
				{
					period: "Due Now",
					dueCards: todayCards.length,
					actionText: "Review Now",
					actionVariant: "default",
				},
				{
					period: "Later Today",
					dueCards: remainingTodayCards.length,
					actionText: "Review",
					actionVariant: "secondary",
				},
				{
					period: "Tomorrow",
					dueCards: tomorrowCards.length,
					actionText: "Preview",
					actionVariant: "outline",
				},
				{
					period: "This Week",
					dueCards: weekCards.length,
					actionText: "Plan",
					actionVariant: "ghost",
				},
			];

			return reviews;
		} catch (e) {
			console.error("Error in getUpcomingReviews:", e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch upcoming reviews data",
			});
		}
	}),

	// Get recent activity
	getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.auth.user.id;
			const activities: Activity[] = [];

			// Get recent game activities from game_player table
			const gamesData = await ctx.db
				.select({
					joinedAt: gamePlayers.joinedAt,
					score: gamePlayers.score,
				})
				.from(gamePlayers)
				.where(eq(gamePlayers.userId, userId))
				.orderBy(desc(gamePlayers.joinedAt))
				.limit(3);

			// Get recent flashcard study activities
			const flashcardData = await ctx.db
				.select({
					lastReview: flashcards.lastReview,
					deckId: flashcards.deckId,
					title: flashcards.title,
				})
				.from(flashcards)
				.where(
					and(eq(flashcards.userId, userId), isNotNull(flashcards.lastReview)),
				)
				.orderBy(desc(flashcards.lastReview))
				.limit(3);

			// Get flashcard decks for reference
			const deckNamesMap = new Map();

			if (flashcardData.length > 0) {
				const deckIds = flashcardData
					.map((card) => card.deckId)
					.filter((id) => id !== null) as string[];

				if (deckIds.length > 0) {
					const decksData = await ctx.db
						.select({
							id: flashcardDecks.id,
							name: flashcardDecks.name,
						})
						.from(flashcardDecks)
						.where(eq(flashcardDecks.userId, userId));

					for (const deck of decksData) {
						deckNamesMap.set(deck.id, deck.name);
					}
				}
			}

			// Get recent chat activities
			const chatData = await ctx.db
				.select({
					createdAt: chatSessions.created_at,
					title: chatSessions.title,
				})
				.from(chatSessions)
				.where(eq(chatSessions.user_id, userId))
				.orderBy(desc(chatSessions.created_at))
				.limit(2);

			// Process game activities
			for (const game of gamesData) {
				activities.push({
					activity: `Completed game with score: ${game.score}`,
					timestamp: game.joinedAt.toISOString(),
					icon: "gamepad-2",
				});
			}

			// Process flashcard activities
			for (const card of flashcardData) {
				if (!card.lastReview) continue;
				const deckName = card.deckId
					? deckNamesMap.get(card.deckId) || "Unnamed deck"
					: "Unassigned cards";
				activities.push({
					activity: `Studied flashcard: ${card.title || "Untitled"} (${deckName})`,
					timestamp: card.lastReview.toISOString(),
					icon: "layers",
				});
			}

			// Process chat activities
			for (const chat of chatData) {
				activities.push({
					activity: `Chat session: ${chat.title || "New Chat"}`,
					timestamp: chat.createdAt.toISOString(),
					icon: "message-square",
				});
			}

			// Sort by timestamp (most recent first) and return top 5
			return activities
				.sort(
					(a, b) =>
						new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
				)
				.slice(0, 5);
		} catch (e) {
			console.error("Error in getRecentActivity:", e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch recent activity data",
			});
		}
	}),

	// Get training recommendations
	getTrainingRecommendations: protectedProcedure.query(async () => {
		// These are static for now, but could be made dynamic based on user data
		const recommendations: Recommendation[] = [
			{
				title: "First Aid Basics",
				description:
					"Review fundamental first aid techniques for common emergencies",
				icon: "heart",
			},
			{
				title: "CPR Refresher",
				description: "Update your CPR knowledge with the latest guidelines",
				icon: "activity",
			},
			{
				title: "Injury Assessment",
				description: "Learn how to quickly and accurately assess injuries",
				icon: "stethoscope",
			},
			{
				title: "Emergency Response",
				description: "Practice responding to different emergency scenarios",
				icon: "shield",
			},
			{
				title: "Disaster Preparedness",
				description:
					"Be ready for major incidents with this preparedness training",
				icon: "alert-triangle",
			},
			{
				title: "Mental Health First Aid",
				description:
					"Learn to recognize and respond to mental health emergencies",
				icon: "brain",
			},
		];

		return recommendations;
	}),

	// Get all dashboard data in one query
	getDashboardData: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.auth.user.id;

			// Create a tRPC caller to make internal calls
			const caller = dashboardRouter.createCaller(ctx);

			// Call all data functions in parallel
			const [
				trainingStreak,
				cardsReviewed,
				gameScore,
				aiChats,
				weeklyProgress,
				learningProgress,
				upcomingReviews,
				recentActivity,
				trainingRecommendations,
			] = await Promise.all([
				caller.getTrainingStreak(),
				caller.getCardsReviewed(),
				caller.getGameScore(),
				caller.getAiChats(),
				caller.getWeeklyProgress(),
				caller.getLearningProgress(),
				caller.getUpcomingReviews(),
				caller.getRecentActivity(),
				caller.getTrainingRecommendations(),
			]);

			// Combine all data into a single dashboard data object
			const dashboardData: DashboardData = {
				summaryCards: {
					trainingStreak,
					cardsReviewed,
					gameScore,
					aiChats,
				},
				weeklyProgress,
				learningProgress,
				upcomingReviews,
				recentActivity,
				trainingRecommendations,
			};

			return dashboardData;
		} catch (e) {
			console.error("Error in getDashboardData:", e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch dashboard data",
			});
		}
	}),
});
