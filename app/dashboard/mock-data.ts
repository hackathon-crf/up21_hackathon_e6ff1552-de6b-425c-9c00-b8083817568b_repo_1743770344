// TypeScript interfaces for dashboard data
export interface SummaryCard {
	value: number;
	changeText: string;
}

export interface WeeklyProgressData {
	day: string;
	cards: number;
	games: number;
	chat: number;
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

export interface Certification {
	id: number;
	title: string;
	validUntil: string;
	status: "valid" | "expiring" | "expired";
	color: "green" | "yellow" | "red";
	icon: "heart" | "shield" | "stethoscope";
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
	certifications: Certification[];
	recentActivity: Activity[];
	trainingRecommendations: Recommendation[];
}

// This file contains mock data for the dashboard
export const dashboardData: DashboardData = {
	// Summary cards at the top of the dashboard
	summaryCards: {
		trainingStreak: {
			value: 12,
			changeText: "+3 from last week",
		},
		cardsReviewed: {
			value: 246,
			changeText: "+42 today",
		},
		gameScore: {
			value: 89,
			changeText: "+5% improvement",
		},
		aiChats: {
			value: 8,
			changeText: "2 new conversations",
		},
	},

	// Data for the weekly progress chart
	weeklyProgress: [
		{ day: "Mon", cards: 32, games: 2, chat: 1 },
		{ day: "Tue", cards: 45, games: 1, chat: 2 },
		{ day: "Wed", cards: 29, games: 0, chat: 1 },
		{ day: "Thu", cards: 38, games: 2, chat: 0 },
		{ day: "Fri", cards: 52, games: 3, chat: 1 },
		{ day: "Sat", cards: 27, games: 1, chat: 2 },
		{ day: "Sun", cards: 23, games: 0, chat: 1 },
	],

	// Learning progress cards data
	learningProgress: [
		{
			id: 1,
			title: "First Aid Basics",
			progress: 78,
			dueCards: 5,
		},
		{
			id: 2,
			title: "CPR Procedures",
			progress: 92,
			dueCards: 2,
		},
		{
			id: 3,
			title: "Emergency Response",
			progress: 45,
			dueCards: 12,
		},
	],

	// Upcoming reviews data
	upcomingReviews: [
		{
			period: "Today",
			dueCards: 19,
			actionText: "Review Now",
			actionVariant: "default",
		},
		{
			period: "Tomorrow",
			dueCards: 24,
			actionText: "Preview",
			actionVariant: "outline",
		},
		{
			period: "Next 7 days",
			dueCards: 57,
			actionText: "Schedule",
			actionVariant: "outline",
		},
	],

	// Certifications data
	certifications: [
		{
			title: "Basic Life Support",
			validUntil: "Valid until Apr 2026",
			status: "valid",
			color: "green",
			icon: "heart",
		},
		{
			title: "First Aid",
			validUntil: "Valid until Jun 2025",
			status: "valid",
			color: "green",
			icon: "shield",
		},
		{
			title: "Emergency Medical Response",
			validUntil: "Expires in 45 days",
			status: "expiring",
			color: "yellow",
			icon: "stethoscope",
		},
		{
			title: "Wilderness First Aid",
			validUntil: "Expired Jan 2025",
			status: "expired",
			color: "red",
			icon: "shield",
		},
	],

	// Recent activity data
	recentActivity: [
		{
			activity: "Completed CPR game with score 92%",
			timestamp: "Today at 10:23 AM",
			icon: "gamepad-2",
		},
		{
			activity: "Reviewed First Aid flashcards",
			timestamp: "Yesterday at 3:45 PM",
			icon: "book-open",
		},
		{
			activity: "Chat session about triage protocols",
			timestamp: "Apr 6 at 11:30 AM",
			icon: "message-square",
		},
		{
			activity: "Completed Bandaging Techniques deck",
			timestamp: "Apr 5 at 2:15 PM",
			icon: "book-open",
		},
	],

	// Training recommendations data
	trainingRecommendations: [
		{
			title: "Advanced Cardiac Life Support",
			description: "Recommended based on your profile and interests",
			icon: "heart",
		},
		{
			title: "Mass Casualty Incident Training",
			description: "Popular among users with similar certifications",
			icon: "shield",
		},
		{
			title: "Pediatric Emergency Assessment",
			description: "Complete your emergency response knowledge",
			icon: "stethoscope",
		},
	],
};
