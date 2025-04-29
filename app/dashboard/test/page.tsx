"use client";

import { useEffect } from "react";
import { api } from "~/trpc/react";

export default function DashboardTest() {
	const { data, error, isLoading } = api.dashboard.getDashboardData.useQuery();

	useEffect(() => {
		console.log("Dashboard data:", data);

		if (error) {
			console.error("Error fetching dashboard data:", error);
		}
	}, [data, error]);

	if (isLoading) {
		return <div>Loading dashboard data...</div>;
	}

	if (error) {
		return <div>Error: {error.message}</div>;
	}

	if (!data) {
		return <div>No dashboard data found</div>;
	}

	return (
		<div>
			<h1>Dashboard Test</h1>
			<h2>Training Streak: {data.summaryCards.trainingStreak.value} days</h2>
			<h2>Cards Reviewed: {data.summaryCards.cardsReviewed.value}</h2>
			<h2>Game Score: {data.summaryCards.gameScore.value}%</h2>
			<h2>AI Chats: {data.summaryCards.aiChats.value}</h2>

			<h3>Weekly Progress</h3>
			<ul>
				{data.weeklyProgress.map((day) => (
					<li key={day.day}>
						{day.day}: {day.cards} cards, {day.games} games, {day.chat} chats
					</li>
				))}
			</ul>

			<h3>Recent Activity</h3>
			<ul>
				{data.recentActivity.map((activity) => (
					<li key={`${activity.activity}-${activity.timestamp}`}>
						{activity.activity} - {activity.timestamp}
					</li>
				))}
			</ul>
		</div>
	);
}
