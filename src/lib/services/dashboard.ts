import { createBrowserClient } from "~/lib/supabase";

// Types for dashboard data
export interface SummaryCard {
	value: number;
	changeText: string;
}

export interface WeeklyProgressData {
	day: string;
	cards: number;
	games: number;
	chat: number;
	[key: string]: string | number;
}

export interface LearningProgress {
	id: number;
	title: string;
	progress: number;
	dueCards: number;
}

export interface UpcomingReview {
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

export interface Activity {
	activity: string;
	timestamp: string;
	icon: string;
}

export interface Recommendation {
	title: string;
	description: string;
	icon: string;
}

export interface DashboardData {
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

/**
 * Fetch user training streak data from the database
 * @returns Summary card data for training streak
 */
export async function fetchTrainingStreak(
	userId: string,
): Promise<SummaryCard> {
	const supabase = createBrowserClient();

	try {
		// Get streak data from the study_stat table
		// Don't use .single() or .maybeSingle() to avoid PGRST116 errors
		const { data, error } = await supabase
			.from("study_stat")
			.select("streak")
			.eq("user_id", userId);

		// Handle database errors
		if (error) {
			console.error("Error fetching training streak:", error);
			return {
				value: 0,
				changeText: "No data available",
			};
		}

		// If no data or empty array, return default values
		if (!data || data.length === 0) {
			return {
				value: 0,
				changeText: "Start your first streak!",
			};
		}

		// Use the first record if multiple exist (shouldn't happen, but just in case)
		// Add a check to ensure data[0] exists before accessing the streak property
		const streak = data[0] && data[0].streak !== undefined ? data[0].streak : 0;

		// Since we don't have a last_week_streak field in study_stat,
		// we'll just show the current streak without change
		return {
			value: streak,
			changeText: "Current streak",
		};
	} catch (e) {
		// Catch any unexpected errors
		console.error("Unexpected error in fetchTrainingStreak:", e);
		return {
			value: 0,
			changeText: "Error retrieving streak",
		};
	}
}

/**
 * Fetch cards reviewed data from the database
 * @returns Summary card data for cards reviewed
 */
export async function fetchCardsReviewed(userId: string): Promise<SummaryCard> {
	const supabase = createBrowserClient();
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Get total flashcards that have been reviewed (have a last_review date)
	const { data: totalData, error: totalError } = await supabase
		.from("flashcard")
		.select("id")
		.eq("user_id", userId)
		.not("last_review", "is", null);

	// Get flashcards reviewed today
	const { data: todayData, error: todayError } = await supabase
		.from("flashcard")
		.select("id")
		.eq("user_id", userId)
		.gte("last_review", today.toISOString());

	if (totalError || todayError) {
		console.error("Error fetching cards reviewed:", totalError || todayError);
		return {
			value: 0,
			changeText: "No data available",
		};
	}

	const totalCount = totalData?.length || 0;
	const todayCount = todayData?.length || 0;

	return {
		value: totalCount,
		changeText: `+${todayCount} today`,
	};
}

/**
 * Fetch game score data from the database
 * @returns Summary card data for game score
 */
export async function fetchGameScore(userId: string): Promise<SummaryCard> {
	const supabase = createBrowserClient();

	// Get scores from the game_player table
	const { data, error } = await supabase
		.from("game_player")
		.select("score, joined_at")
		.eq("user_id", userId)
		.order("joined_at", { ascending: false })
		.limit(10);

	// Handle database error case separately from no-data case
	if (error) {
		console.error("Error fetching game score:", error);
		return {
			value: 0,
			changeText: "Error fetching data",
		};
	}

	// Handle case with no game data
	if (!data || data.length === 0) {
		return {
			value: 0,
			changeText: "No games played",
		};
	}

	// Calculate average score and improvement
	const scores = data.map((player) => player.score || 0);
	const averageScore = Math.round(
		scores.reduce((sum, score) => sum + score, 0) / scores.length,
	);

	// Calculate improvement (difference between latest game and average of previous games)
	const latestScore = scores[0];
	const previousAverage =
		scores.length > 1
			? Math.round(
					scores.slice(1).reduce((sum, score) => sum + score, 0) /
						(scores.length - 1),
				)
			: latestScore;

	const improvement =
		previousAverage > 0
			? Math.round(((latestScore - previousAverage) / previousAverage) * 100)
			: 0;
	const changePrefix = improvement >= 0 ? "+" : "";

	return {
		value: averageScore,
		changeText: `${changePrefix}${improvement}% improvement`,
	};
}

/**
 * Fetch AI chat data from the database
 * @returns Summary card data for AI chats
 */
export async function fetchAiChats(userId: string): Promise<SummaryCard> {
	const supabase = createBrowserClient();

	// Get total chat sessions
	const { data: totalData, error: totalError } = await supabase
		.from("chat_session")
		.select("id")
		.eq("user_id", userId);

	// Get new chat sessions in the last 24 hours
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	const { data: newData, error: newError } = await supabase
		.from("chat_session")
		.select("id")
		.eq("user_id", userId)
		.gte("created_at", yesterday.toISOString());

	if (totalError || newError) {
		console.error("Error fetching AI chats:", totalError || newError);
		return {
			value: 0,
			changeText: "No data available",
		};
	}

	return {
		value: totalData?.length || 0,
		changeText: `+${newData?.length || 0} in 24h`,
	};
}

/**
 * Fetch weekly progress data from the database
 * @returns Weekly progress data
 */
export async function fetchWeeklyProgress(
	userId: string,
): Promise<WeeklyProgressData[]> {
	const supabase = createBrowserClient();
	const days = 7;
	const results: WeeklyProgressData[] = [];

	// Generate dates for the last 7 days
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - (days - 1));
	startDate.setHours(0, 0, 0, 0);

	// Get card review data from the flashcard table
	const { data: cardsData, error: cardsError } = await supabase
		.from("flashcard")
		.select("last_review")
		.eq("user_id", userId)
		.gte("last_review", startDate.toISOString());

	// Get game data from game_player table
	const { data: gamesData, error: gamesError } = await supabase
		.from("game_player")
		.select("joined_at")
		.eq("user_id", userId)
		.gte("joined_at", startDate.toISOString());

	// Get chat session data
	const { data: chatsData, error: chatsError } = await supabase
		.from("chat_session")
		.select("created_at")
		.eq("user_id", userId)
		.gte("created_at", startDate.toISOString());

	if (cardsError || gamesError || chatsError) {
		console.error(
			"Error fetching weekly progress:",
			cardsError || gamesError || chatsError,
		);
		// Return empty data with dates for the last 7 days
		for (let i = 0; i < days; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			results.push({
				day: date.toLocaleDateString("en-US", { weekday: "short" }),
				cards: 0,
				games: 0,
				chat: 0,
			});
		}
		return results;
	}

	// Process data for each day
	for (let i = 0; i < days; i++) {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);

		const nextDate = new Date(date);
		nextDate.setDate(date.getDate() + 1);

		// Count cards reviewed on this day
		const dayCards =
			cardsData?.filter((card) => {
				const reviewDate = new Date(card.last_review);
				return reviewDate >= date && reviewDate < nextDate;
			}).length || 0;

		// Count games played on this day
		const dayGames =
			gamesData?.filter((game) => {
				const gameDate = new Date(game.joined_at);
				return gameDate >= date && gameDate < nextDate;
			}).length || 0;

		// Count chat sessions on this day
		const dayChats =
			chatsData?.filter((chat) => {
				const chatDate = new Date(chat.created_at);
				return chatDate >= date && chatDate < nextDate;
			}).length || 0;

		results.push({
			day: date.toLocaleDateString("en-US", { weekday: "short" }),
			cards: dayCards,
			games: dayGames,
			chat: dayChats,
		});
	}

	return results;
}

/**
 * Fetch learning progress data from the database
 * @returns Learning progress data
 */
export async function fetchLearningProgress(
	userId: string,
): Promise<LearningProgress[]> {
	const supabase = createBrowserClient();

	// Get flashcard decks and their cards
	const { data, error } = await supabase
		.from("flashcard_deck")
		.select(`
      id,
      name,
      flashcards:flashcard(id, next_review)
    `)
		.eq("user_id", userId);

	if (error || !data) {
		console.error("Error fetching learning progress:", error);
		return [];
	}

	// Process data for each deck
	const learningProgress: LearningProgress[] = data.map((deck, index) => {
		const totalCards = deck.flashcards?.length || 0;

		// Count cards due for review
		const dueCards =
			deck.flashcards?.filter((card) => {
				if (!card.next_review) return false;
				const reviewDate = new Date(card.next_review);
				return reviewDate <= new Date();
			}).length || 0;

		// Calculate progress percentage
		const reviewedCards =
			deck.flashcards?.filter((card) => card.next_review).length || 0;
		const progress =
			totalCards > 0 ? Math.round((reviewedCards / totalCards) * 100) : 0;

		return {
			id: index + 1,
			title: deck.name || `Deck ${index + 1}`,
			progress,
			dueCards,
		};
	});

	return learningProgress;
}

/**
 * Fetch upcoming flashcard review data from the database
 * @returns Upcoming reviews data
 */
export async function fetchUpcomingReviews(
	userId: string,
): Promise<UpcomingReview[]> {
	const supabase = createBrowserClient();
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
	const { data: todayData, error: todayError } = await supabase
		.from("flashcard")
		.select("id")
		.eq("user_id", userId)
		.lte("next_review", now.toISOString());

	// Get cards due by end of day
	const { data: remainingTodayData, error: remainingTodayError } =
		await supabase
			.from("flashcard")
			.select("id")
			.eq("user_id", userId)
			.gt("next_review", now.toISOString())
			.lte("next_review", endOfToday.toISOString());

	// Get cards due tomorrow
	const { data: tomorrowData, error: tomorrowError } = await supabase
		.from("flashcard")
		.select("id")
		.eq("user_id", userId)
		.gt("next_review", endOfToday.toISOString())
		.lte("next_review", endOfTomorrow.toISOString());

	// Get cards due this week
	const { data: weekData, error: weekError } = await supabase
		.from("flashcard")
		.select("id")
		.eq("user_id", userId)
		.gt("next_review", endOfTomorrow.toISOString())
		.lte("next_review", endOfWeek.toISOString());

	if (todayError || remainingTodayError || tomorrowError || weekError) {
		console.error(
			"Error fetching upcoming reviews:",
			todayError || remainingTodayError || tomorrowError || weekError,
		);
		return [];
	}

	const reviews: UpcomingReview[] = [
		{
			period: "Due Now",
			dueCards: todayData?.length || 0,
			actionText: "Review Now",
			actionVariant: "default",
		},
		{
			period: "Later Today",
			dueCards: remainingTodayData?.length || 0,
			actionText: "Review",
			actionVariant: "secondary",
		},
		{
			period: "Tomorrow",
			dueCards: tomorrowData?.length || 0,
			actionText: "Preview",
			actionVariant: "outline",
		},
		{
			period: "This Week",
			dueCards: weekData?.length || 0,
			actionText: "Plan",
			actionVariant: "ghost",
		},
	];

	return reviews;
}

/**
 * Fetch recent activity data from the database
 * @returns Recent activity data
 */
export async function fetchRecentActivity(userId: string): Promise<Activity[]> {
	const supabase = createBrowserClient();
	const activities: Activity[] = [];

	// Get recent game activities from game_player table
	const { data: gamesData, error: gamesError } = await supabase
		.from("game_player")
		.select("joined_at, score")
		.eq("user_id", userId)
		.order("joined_at", { ascending: false })
		.limit(3);

	// Get recent flashcard study activities
	const { data: flashcardData, error: flashcardError } = await supabase
		.from("flashcard")
		.select("last_review, deck_id, title")
		.eq("user_id", userId)
		.not("last_review", "is", null)
		.order("last_review", { ascending: false })
		.limit(3);

	// Get flashcard decks for reference
	const { data: decksData } = await supabase
		.from("flashcard_deck")
		.select("id, name")
		.eq("user_id", userId);

	// Create a map of deck IDs to names for easy lookup
	const deckNames = new Map();
	decksData?.forEach((deck) => {
		deckNames.set(deck.id, deck.name);
	});

	// Get recent chat activities
	const { data: chatData, error: chatError } = await supabase
		.from("chat_session")
		.select("created_at, title")
		.eq("user_id", userId)
		.order("created_at", { ascending: false })
		.limit(2);

	if (gamesError || flashcardError || chatError) {
		console.error(
			"Error fetching recent activity:",
			gamesError || flashcardError || chatError,
		);
		return activities;
	}

	// Process game activities
	gamesData?.forEach((game) => {
		activities.push({
			activity: `Completed game with score: ${game.score}`,
			timestamp: new Date(game.joined_at).toISOString(),
			icon: "gamepad",
		});
	});

	// Process flashcard activities
	flashcardData?.forEach((card) => {
		const deckName = card.deck_id
			? deckNames.get(card.deck_id) || "Unnamed deck"
			: "Unassigned cards";
		activities.push({
			activity: `Studied flashcard: ${card.title || "Untitled"} (${deckName})`,
			timestamp: new Date(card.last_review).toISOString(),
			icon: "layers",
		});
	});

	// Process chat activities
	chatData?.forEach((chat) => {
		activities.push({
			activity: `Chat session: ${chat.title || "New Chat"}`,
			timestamp: new Date(chat.created_at).toISOString(),
			icon: "message-square",
		});
	});

	// Sort by timestamp (most recent first)
	return activities
		.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		)
		.slice(0, 5); // Return the 5 most recent activities
}

/**
 * Fetch training recommendations based on user data
 * @returns Training recommendations data
 */
export async function fetchTrainingRecommendations(
	userId: string,
): Promise<Recommendation[]> {
	const supabase = createBrowserClient();

	// Note: In the actual schema, we don't have training_interests and skill_level fields
	// So we'll just generate static recommendations for now
	// This would be replaced with actual user preference data in a real implementation

	// This query will fail because we don't have these fields in the table
	// But we handle the error and provide fallback recommendations
	const { data: userData, error: userError } = await supabase
		.from("user")
		.select("id, email")
		.eq("id", userId)
		.maybeSingle();

	if (userError) {
		console.error("Error fetching training recommendations:", userError);
	}

	// Get flashcard study stats
	const { data: flashcardStats } = await supabase
		.from("flashcard")
		.select("id")
		.eq("user_id", userId);

	// Get game activity stats
	const { data: gameStats } = await supabase
		.from("game_player")
		.select("id")
		.eq("user_id", userId);

	// Generate recommendations based on activity or lack thereof
	const recommendations: Recommendation[] = [];

	// If user has few or no flashcards, recommend creating some
	if (!flashcardStats || flashcardStats.length < 5) {
		recommendations.push({
			title: "Create Your First Flashcards",
			description:
				"Start by creating a deck of flashcards on a topic you want to learn.",
			icon: "plus-circle",
		});
	}

	// If user has flashcards but hasn't played games, recommend games
	if (flashcardStats?.length && (!gameStats || gameStats.length === 0)) {
		recommendations.push({
			title: "Try a Learning Game",
			description:
				"Put your knowledge to the test with our interactive learning games.",
			icon: "gamepad-2",
		});
	}

	// Add some standard recommendations to fill out the list
	recommendations.push({
		title: "Daily Study Streak",
		description: "Study at least 10 cards daily to build a learning habit.",
		icon: "flame",
	});

	recommendations.push({
		title: "Challenge Yourself",
		description: "Try our advanced quiz modes to deepen your understanding.",
		icon: "zap",
	});

	recommendations.push({
		title: "Review Your Progress",
		description:
			"Check your learning stats to see how you're improving over time.",
		icon: "line-chart",
	});

	return recommendations;
}

/**
 * Fetch all dashboard data
 * @returns All dashboard data
 */
export async function fetchDashboardData(
	userId: string,
): Promise<DashboardData> {
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
		fetchTrainingStreak(userId),
		fetchCardsReviewed(userId),
		fetchGameScore(userId),
		fetchAiChats(userId),
		fetchWeeklyProgress(userId),
		fetchLearningProgress(userId),
		fetchUpcomingReviews(userId),
		fetchRecentActivity(userId),
		fetchTrainingRecommendations(userId),
	]);

	return {
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
}
