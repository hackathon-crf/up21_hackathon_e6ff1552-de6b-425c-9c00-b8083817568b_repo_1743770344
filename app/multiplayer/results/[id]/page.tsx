"use client";
import {
	ArrowLeft,
	Award,
	Heart,
	Medal,
	Share2,
	Shield,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";
import { PlayerAvatar } from "../../components/player-avatar";

export default function ResultsPage({ params }: { params: { id: string } }) {
	return <ResultsContent params={params} />;
}

function ResultsContent({ params }: { params: { id: string } }) {
	const router = useRouter();
	const toast = useToast();
	const [showShareOptions, setShowShareOptions] = useState(false);

	// Mock data for session results
	const results = {
		sessionTitle: "CPR & AED Challenge",
		mode: "Rapid Response", // or "Card Clash"
		score: 85,
		correctAnswers: 17,
		totalQuestions: 20,
		timeTaken: "8:24",
		rank: 2,
		totalParticipants: 5,
		participants: [
			{
				id: 1,
				name: "Sarah Johnson",
				avatar: "/avatar.svg?height=40&width=40",
				score: 3450,
				rank: 1,
				streak: 3,
			},
			{
				id: 2,
				name: "John Doe",
				avatar: "/avatar.svg?height=40&width=40",
				score: 3200,
				rank: 2,
				streak: 2,
				isCurrentUser: true,
			},
			{
				id: 3,
				name: "Michael Smith",
				avatar: "/avatar.svg?height=40&width=40",
				score: 2800,
				rank: 3,
				streak: 0,
			},
			{
				id: 4,
				name: "Emily Davis",
				avatar: "/avatar.svg?height=40&width=40",
				score: 2350,
				rank: 4,
				streak: 0,
			},
			{
				id: 5,
				name: "Robert Wilson",
				avatar: "/avatar.svg?height=40&width=40",
				score: 1900,
				rank: 5,
				streak: 0,
			},
		],
		categories: [
			{ name: "CPR Technique", score: 90, total: 100 },
			{ name: "AED Usage", score: 80, total: 100 },
			{ name: "Patient Assessment", score: 85, total: 100 },
		],
		answers: [
			{
				question: "What is the correct compression rate for adult CPR?",
				userAnswer: "100-120 compressions per minute",
				correctAnswer: "100-120 compressions per minute",
				isCorrect: true,
				explanation:
					"The American Heart Association recommends a compression rate of 100-120 compressions per minute for adult CPR.",
			},
			{
				question: "How deep should chest compressions be for an adult?",
				userAnswer:
					"At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
				correctAnswer:
					"At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
				isCorrect: true,
				explanation:
					"Proper compression depth ensures adequate blood circulation without causing injury.",
			},
			{
				question:
					"When using an AED, what should you do before applying the pads?",
				userAnswer: "Ensure the patient is breathing",
				correctAnswer: "Ensure the patient's chest is dry and exposed",
				isCorrect: false,
				explanation:
					"Moisture can interfere with the electrical current and clothing can prevent proper pad contact.",
			},
		],
		achievements: [
			{
				name: "First Blood",
				description: "First to answer a question correctly",
				icon: "Award",
			},
			{
				name: "Streak Master",
				description: "Achieved a 3x answer streak",
				icon: "Flame",
			},
			{
				name: "Speed Demon",
				description: "Answered 5 questions in under 10 seconds each",
				icon: "Zap",
			},
		],
	};

	const handleShareResults = () => {
		setShowShareOptions(!showShareOptions);

		toast.info({
			title: "Share your results",
			description: "Copy the link or share directly to social media",
			duration: 3000,
		});
	};

	const handlePlayAgain = () => {
		toast.info({
			title: "Starting new game",
			description: "Redirecting to multiplayer lobby...",
			duration: 2000,
		});

		setTimeout(() => {
			if (router) {
				router.push("/multiplayer");
			}
		}, 1000);
	};

	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 to-accent/5">
			<div className="border-b bg-background">
				<div className="mx-auto flex h-auto max-w-5xl flex-col px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:px-6 sm:py-0">
					<Button variant="ghost" size="sm" asChild className="mb-2 sm:mb-0">
						<Link href="/multiplayer">
							<ArrowLeft className="mr-2 h-4 w-4" />
							<span>Back</span>
						</Link>
					</Button>
					<div className="flex-1 sm:ml-4">
						<h1 className="font-bold text-xl sm:text-2xl">
							{results.sessionTitle} Results
						</h1>
						<p className="text-muted-foreground text-xs sm:text-sm">
							{results.mode} • Completed just now
						</p>
					</div>
				</div>
			</div>

			<main className="flex-1 p-6">
				<div className="mx-auto max-w-5xl space-y-6">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
						<Card className="overflow-hidden text-center">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Your Score</CardTitle>
							</CardHeader>
							<CardContent className="p-4">
								<div className="relative mx-auto my-4 h-36 w-36">
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="font-bold text-4xl">{results.score}%</div>
									</div>
									<svg className="h-full w-full" viewBox="0 0 100 100">
										<circle
											className="fill-none stroke-muted"
											strokeWidth="10"
											cx="50"
											cy="50"
											r="40"
										/>
										<circle
											className="fill-none stroke-primary"
											strokeWidth="10"
											strokeLinecap="round"
											cx="50"
											cy="50"
											r="40"
											strokeDasharray={`${results.score * 2.51} 251`}
											strokeDashoffset="0"
											transform="rotate(-90 50 50)"
										/>
									</svg>
								</div>
								<p className="text-muted-foreground text-sm">
									{results.correctAnswers} of {results.totalQuestions} questions
									correct
								</p>
							</CardContent>
						</Card>

						<Card className="overflow-hidden text-center">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Your Rank</CardTitle>
							</CardHeader>
							<CardContent className="p-4">
								<div className="flex h-36 flex-col items-center justify-center">
									<Award className="mb-2 h-12 w-12 text-primary" />
									<div className="font-bold text-4xl">#{results.rank}</div>
									<p className="text-muted-foreground text-sm">
										of {results.totalParticipants} participants
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="overflow-hidden text-center">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Time Taken</CardTitle>
							</CardHeader>
							<CardContent className="p-4">
								<div className="flex h-36 flex-col items-center justify-center">
									<div className="font-bold text-4xl">{results.timeTaken}</div>
									<p className="text-muted-foreground text-sm">
										minutes:seconds
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					<Tabs defaultValue="leaderboard" className="space-y-4">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
							<TabsTrigger value="categories">Categories</TabsTrigger>
							<TabsTrigger value="answers">Your Answers</TabsTrigger>
							<TabsTrigger value="achievements">Achievements</TabsTrigger>
						</TabsList>

						<TabsContent value="leaderboard" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Leaderboard</CardTitle>
									<CardDescription>
										See how you ranked against other participants
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{results.participants.map((participant) => (
											<div
												key={participant.id}
												className={cn(
													"flex items-center justify-between rounded-lg p-4 transition-all",
													participant.isCurrentUser
														? "border border-primary/20 bg-primary/10"
														: "bg-muted/50",
													participant.rank <= 3
														? `border-l-4 ${
																participant.rank === 1
																	? "border-l-yellow-500"
																	: participant.rank === 2
																		? "border-l-slate-400"
																		: "border-l-amber-600"
															}`
														: "",
												)}
											>
												<div className="flex items-center gap-4">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
														{participant.rank}
													</div>
													<PlayerAvatar
														player={participant}
														showStatus={false}
														showBadge={false}
														size="sm"
													/>
													<div>
														<div className="flex items-center gap-2">
															<p className="font-medium">{participant.name}</p>
															{participant.isCurrentUser && (
																<Badge variant="outline" className="text-xs">
																	You
																</Badge>
															)}
														</div>
														<div className="flex items-center gap-2">
															<p className="text-muted-foreground text-xs">
																{participant.score} points
															</p>
															{participant.streak > 1 && (
																<Badge
																	variant="outline"
																	className="border-orange-500 text-orange-500 text-xs"
																>
																	{participant.streak}x streak
																</Badge>
															)}
														</div>
													</div>
												</div>
												{participant.rank <= 3 && (
													<Medal
														className={cn(
															"h-5 w-5",
															participant.rank === 1
																? "text-yellow-500"
																: participant.rank === 2
																	? "text-slate-400"
																	: "text-amber-600",
														)}
													/>
												)}
											</div>
										))}
									</div>
								</CardContent>
								<CardFooter className="flex flex-col justify-between gap-3 sm:flex-row">
									<Button
										variant="outline"
										onClick={handleShareResults}
										className="w-full sm:w-auto"
									>
										<Share2 className="mr-2 h-4 w-4" />
										Share Results
									</Button>
								</CardFooter>
							</Card>
						</TabsContent>

						<TabsContent value="categories" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Performance by Category</CardTitle>
									<CardDescription>
										See how well you performed in each category
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-6">
										{results.categories.map((category, index) => (
											<div key={index} className="space-y-2">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														{index === 0 ? (
															<Heart className="h-4 w-4 text-primary" />
														) : index === 1 ? (
															<Shield className="h-4 w-4 text-primary" />
														) : (
															<Users className="h-4 w-4 text-primary" />
														)}
														<span className="font-medium">{category.name}</span>
													</div>
													<span className="text-sm">
														{category.score}/{category.total}
													</span>
												</div>
												<Progress
													value={(category.score / category.total) * 100}
													className="h-2"
												/>
												<p className="text-muted-foreground text-xs">
													{category.score >= 90
														? "Excellent! You've mastered this category."
														: category.score >= 70
															? "Good job! You have a solid understanding of this category."
															: "Keep practicing this category to improve your knowledge."}
												</p>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="answers" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Your Answers</CardTitle>
									<CardDescription>
										Review your answers and see the correct solutions
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-6">
										{results.answers.map((answer, index) => (
											<div key={index} className="rounded-lg border p-4">
												<p className="font-medium">
													{index + 1}. {answer.question}
												</p>
												<div
													className={cn(
														"mt-2 flex items-center text-sm",
														answer.isCorrect
															? "text-green-600 dark:text-green-400"
															: "text-red-600 dark:text-red-400",
													)}
												>
													<div
														className={cn(
															"mr-2 h-2 w-2 rounded-full",
															answer.isCorrect
																? "bg-green-600 dark:bg-green-400"
																: "bg-red-600 dark:bg-red-400",
														)}
													/>
													Your answer: {answer.userAnswer} (
													{answer.isCorrect ? "Correct" : "Incorrect"})
												</div>
												{!answer.isCorrect && (
													<div className="mt-1 text-muted-foreground text-sm">
														Correct answer: {answer.correctAnswer}
													</div>
												)}
												<div className="mt-2 rounded bg-muted/50 p-2 text-muted-foreground text-xs">
													<span className="font-medium">Explanation:</span>{" "}
													{answer.explanation}
												</div>
											</div>
										))}
									</div>
								</CardContent>
								<CardFooter>
									<Button className="w-full">Review All Answers</Button>
								</CardFooter>
							</Card>
						</TabsContent>

						<TabsContent value="achievements" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Achievements Unlocked</CardTitle>
									<CardDescription>
										Special accomplishments from this session
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
										{results.achievements.map((achievement, index) => (
											<Card
												key={index}
												className="border-primary/20 bg-primary/5"
											>
												<CardHeader className="p-4 pb-2">
													<div className="flex justify-center">
														{achievement.icon === "Award" ? (
															<Award className="h-12 w-12 text-primary" />
														) : achievement.icon === "Flame" ? (
															<div className="flex h-12 w-12 items-center justify-center text-2xl">
																🔥
															</div>
														) : (
															<div className="flex h-12 w-12 items-center justify-center text-2xl">
																⚡
															</div>
														)}
													</div>
												</CardHeader>
												<CardContent className="p-4 pt-2 text-center">
													<h3 className="font-bold">{achievement.name}</h3>
													<p className="text-muted-foreground text-xs">
														{achievement.description}
													</p>
												</CardContent>
											</Card>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>

					<div className="flex flex-col justify-between gap-3 sm:flex-row sm:gap-0">
						<Button variant="outline" asChild className="w-full sm:w-auto">
							<Link href="/multiplayer">Return to Multiplayer</Link>
						</Button>
						<Button onClick={handlePlayAgain} className="w-full sm:w-auto">
							Start New Game
						</Button>
					</div>
				</div>
			</main>
		</div>
	);
}
