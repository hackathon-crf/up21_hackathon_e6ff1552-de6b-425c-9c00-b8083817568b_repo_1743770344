"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Activity,
	BookOpen,
	Clock,
	Gamepad2,
	Heart,
	Loader2,
	MessageSquare,
	Shield,
	Stethoscope,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "~/components/auth/AuthProvider";
import { DashboardHeader } from "~/components/dashboard-header";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

// Define necessary types for the dashboard data
type ActivityType = {
	activity: string;
	timestamp: string;
	icon: string;
};

type LearningProgress = {
	id: number;
	title: string;
	progress: number;
	dueCards: number;
};

type Recommendation = {
	title: string;
	description: string;
	icon: string;
};

type UpcomingReview = {
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
};

type WeeklyProgressData = {
	day: string;
	cards: number;
	games: number;
	chat: number;
	[key: string]: string | number;
};
// Dynamically import the DashboardChart with no SSR to prevent hydration issues
const DynamicDashboardChart = dynamic(
	() =>
		import("~/components/dashboard-chart").then((mod) => ({
			default: mod.DashboardChart,
		})),
	{ ssr: false },
);

export default function DashboardPage() {
	// State for client-side rendering
	const [isClient, setIsClient] = useState(false);

	// Use the AuthProvider's context
	const { user, isLoading: authLoading } = useAuth();

	// Use tRPC to fetch dashboard data
	const { data: dashboardData, isLoading: dataLoading } =
		api.dashboard.getDashboardData.useQuery(
			undefined, // No input needed as the server gets userId from auth context
			{
				enabled: !!user?.id, // Only run query if user id exists
				staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
				gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes (renamed from cacheTime in React Query v4+)
				refetchOnWindowFocus: false, // Don't refetch when window regains focus
				refetchOnReconnect: false, // Don't refetch on network reconnection
				refetchOnMount: false, // Don't refetch when component remounts
				retry: false, // Don't retry on error
			},
		);

	// Set client-side rendering flag
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Helper function to render the appropriate icon
	const renderIcon = (iconName: string) => {
		switch (iconName) {
			case "heart":
				return <Heart className="h-4 w-4 text-accent" />;
			case "shield":
				return <Shield className="h-4 w-4 text-accent" />;
			case "stethoscope":
				return <Stethoscope className="h-4 w-4 text-accent" />;
			case "book-open":
				return <BookOpen className="h-4 w-4 text-primary" />;
			case "gamepad-2":
				return <Gamepad2 className="h-4 w-4 text-primary" />;
			case "message-square":
				return <MessageSquare className="h-4 w-4 text-primary" />;
			default:
				return <Activity className="h-4 w-4 text-muted-foreground" />;
		}
	};

	// If user is not logged in
	if (isClient && !authLoading && !user) {
		return (
			<div className="container">
				<DashboardHeader
					title="Dashboard"
					description="Welcome to your Red Cross Training dashboard. Please log in to view your personalized dashboard."
				/>
				<div className="flex h-[50vh] items-center justify-center">
					<Card className="w-full max-w-md">
						<CardHeader>
							<CardTitle>Authentication Required</CardTitle>
							<CardDescription>
								Please log in to access your dashboard
							</CardDescription>
						</CardHeader>
						<CardFooter>
							<Button asChild className="w-full">
								<a href="/auth/login">Log In</a>
							</Button>
						</CardFooter>
					</Card>
				</div>
			</div>
		);
	}

	// Store previous dashboard data in a ref to prevent showing loading spinner when switching tabs
	const previousDashboardData = useRef(dashboardData);

	// Update the ref when we have new data
	useEffect(() => {
		if (dashboardData) {
			previousDashboardData.current = dashboardData;
		}
	}, [dashboardData]);

	// Use previous data or current data
	const displayData = dashboardData || previousDashboardData.current;

	// Only show loading state on initial load, not when switching tabs
	if (!isClient || (authLoading && !displayData)) {
		return (
			<div className="container">
				<DashboardHeader
					title="Dashboard"
					description="Your Red Cross Training dashboard is loading..."
				/>
				<div className="flex flex-col items-center justify-center space-y-4 py-6">
					<Loader2 className="h-12 w-12 animate-spin text-primary" />
					<p>Loading your dashboard data...</p>
				</div>
			</div>
		);
	}

	// Destructure the data with safe fallbacks from displayData (which includes previous data)
	const {
		summaryCards = {
			trainingStreak: { value: 0, changeText: "No streak yet" },
			cardsReviewed: { value: 0, changeText: "No cards reviewed" },
			gameScore: { value: 0, changeText: "No games played" },
			aiChats: { value: 0, changeText: "No chat sessions" },
		},
		weeklyProgress = [],
		learningProgress = [],
		upcomingReviews = [],
		recentActivity = [],
		trainingRecommendations = [],
	} = displayData || {};

	return (
		<div className="container">
			<DashboardHeader
				title="Welcome to Your Dashboard"
				description="Track your progress and get personalized training recommendations"
			/>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="activity">Activity</TabsTrigger>
					<TabsTrigger value="recommendations">Recommendations</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Training Streak
								</CardTitle>
								<Clock className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{summaryCards.trainingStreak.value} days
								</div>
								<p className="text-muted-foreground text-xs">
									{summaryCards.trainingStreak.changeText}
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Cards Reviewed
								</CardTitle>
								<BookOpen className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{summaryCards.cardsReviewed.value}
								</div>
								<p className="text-muted-foreground text-xs">
									{summaryCards.cardsReviewed.changeText}
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Game Score Average
								</CardTitle>
								<Gamepad2 className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{summaryCards.gameScore.value}%
								</div>
								<p className="text-muted-foreground text-xs">
									{summaryCards.gameScore.changeText}
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									AI Chat Sessions
								</CardTitle>
								<MessageSquare className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{summaryCards.aiChats.value}
								</div>
								<p className="text-muted-foreground text-xs">
									{summaryCards.aiChats.changeText}
								</p>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
						<Card className="col-span-4">
							<CardHeader>
								<div>
									<CardTitle>Weekly Training Progress</CardTitle>
									<CardDescription>
										Your training activity over the past 7 days
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="h-64 sm:h-80">
								{isClient && weeklyProgress?.length > 0 && (
									<DynamicDashboardChart data={weeklyProgress} />
								)}
							</CardContent>
						</Card>

						<div className="col-span-3 grid grid-cols-1 gap-4">
							{learningProgress.length > 0 ? (
								learningProgress.map((course: LearningProgress) => (
									<Card key={course.id}>
										<CardHeader className="pb-2">
											<CardTitle className="font-medium text-sm">
												{course.title}
											</CardTitle>
										</CardHeader>
										<CardContent className="pb-2">
											<div className="flex items-center justify-between">
												<Progress value={course.progress} className="h-2" />
												<span className="ml-2 text-muted-foreground text-sm">
													{course.progress}%
												</span>
											</div>
										</CardContent>
										<CardFooter className="pt-0">
											<div className="flex w-full items-center justify-between">
												<p className="text-muted-foreground text-xs">
													{course.dueCards} cards due for review
												</p>
												<Button variant="outline" size="sm">
													Study
												</Button>
											</div>
										</CardFooter>
									</Card>
								))
							) : (
								<Card>
									<CardHeader>
										<CardTitle className="font-medium text-sm">
											No Learning Progress Yet
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground text-sm">
											Start your first flashcard deck to track progress here
										</p>
									</CardContent>
									<CardFooter>
										<Button asChild variant="outline" size="sm">
											<a href="/flashcards">Get Started</a>
										</Button>
									</CardFooter>
								</Card>
							)}
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
						<Card className="col-span-3">
							<CardHeader>
								<CardTitle>Upcoming Reviews</CardTitle>
								<CardDescription>
									Spaced repetition schedule for optimal learning
								</CardDescription>
							</CardHeader>
							<CardContent className="pb-2">
								{upcomingReviews.length > 0 ? (
									<div className="space-y-4">
										{upcomingReviews.map((review: UpcomingReview) => (
											<div
												className="flex items-center justify-between"
												key={`review-${review.period}-${review.dueCards}`}
											>
												<div>
													<p className="font-medium">{review.period}</p>
													<p className="text-muted-foreground text-sm">
														{review.dueCards} cards due
													</p>
												</div>
												<Button
													variant={
														review.actionVariant as
															| "default"
															| "destructive"
															| "outline"
															| "secondary"
															| "ghost"
															| "link"
													}
													size="sm"
												>
													{review.actionText}
												</Button>
											</div>
										))}
									</div>
								) : (
									<div className="py-4 text-center text-muted-foreground text-sm">
										No upcoming reviews scheduled
									</div>
								)}
							</CardContent>
						</Card>

						<Card className="col-span-4">
							<CardHeader>
								<CardTitle>Recent Activity</CardTitle>
								<CardDescription>
									Your latest training sessions and interactions
								</CardDescription>
							</CardHeader>
							<CardContent>
								{recentActivity.length > 0 ? (
									<div className="space-y-5">
										{recentActivity.map((activity: ActivityType) => (
											<div
												className="flex items-start space-x-3"
												key={`activity-${activity.timestamp}-${activity.activity}`}
											>
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
													{renderIcon(activity.icon)}
												</div>
												<div>
													<p className="text-sm leading-snug">
														{activity.activity}
													</p>
													<p className="text-muted-foreground text-xs">
														{activity.timestamp}
													</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="py-4 text-center text-muted-foreground text-sm">
										No recent activity to display
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="activity" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>All Activity</CardTitle>
							<CardDescription>
								A comprehensive view of your training history
							</CardDescription>
						</CardHeader>
						<CardContent>
							{recentActivity.length > 0 ? (
								<div className="space-y-6">
									{recentActivity.map((activity: ActivityType) => (
										<div
											className="flex items-start space-x-4"
											key={`full-activity-${activity.timestamp || activity.activity}`}
										>
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
												{renderIcon(activity.icon)}
											</div>
											<div className="flex-1 space-y-1">
												<p className="font-medium text-sm leading-none">
													{activity.activity}
												</p>
												<p className="text-muted-foreground text-sm">
													{activity.timestamp}
												</p>
											</div>
											<Button variant="ghost" size="sm">
												Details
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className="py-8 text-center">
									<MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
									<h3 className="mt-4 font-medium text-lg">No activity yet</h3>
									<p className="text-muted-foreground text-sm">
										Start using the app to see your activity history here
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="recommendations" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{trainingRecommendations.map((recommendation: Recommendation) => (
							<Card
								key={`rec-${recommendation.title}`}
								className="flex flex-col"
							>
								<CardHeader>
									<div className="flex items-center space-x-2">
										{renderIcon(recommendation.icon)}
										<CardTitle className="text-lg">
											{recommendation.title}
										</CardTitle>
									</div>
									<CardDescription>
										{recommendation.description}
									</CardDescription>
								</CardHeader>
								<CardFooter className="mt-auto">
									<Button className="w-full">Begin Training</Button>
								</CardFooter>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
