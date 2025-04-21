"use client";
import {
	ArrowLeft,
	Award,
	Download,
	Heart,
	Medal,
	Share2,
	Shield,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

export default function GameResultsPage() {
	const { id } = useParams() as { id: string };
	// Mock data for game results
	const results = {
		gameTitle: "CPR & AED Challenge",
		score: 85,
		correctAnswers: 17,
		totalQuestions: 20,
		timeTaken: "8:24",
		rank: 2,
		totalParticipants: 5,
		participants: [
			{ name: "Sarah Johnson", score: 90, rank: 1 },
			{ name: "John Doe", score: 85, rank: 2 },
			{ name: "Michael Smith", score: 80, rank: 3 },
			{ name: "Emily Davis", score: 75, rank: 4 },
			{ name: "Robert Wilson", score: 70, rank: 5 },
		],
		categories: [
			{ name: "CPR Technique", score: 90, total: 100 },
			{ name: "AED Usage", score: 80, total: 100 },
			{ name: "Patient Assessment", score: 85, total: 100 },
		],
	};

	return (
		<div className="flex min-h-screen flex-col">
			<div className="border-b">
				<div className="flex h-16 items-center px-6">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/game">
							<ArrowLeft className="h-4 w-4" />
							<span className="sr-only">Back to games</span>
						</Link>
					</Button>
					<div className="ml-4 flex-1">
						<h1 className="font-bold text-2xl">{results.gameTitle} Results</h1>
						<p className="text-muted-foreground text-sm">
							Completed on May 17, 2023
						</p>
					</div>
				</div>
			</div>

			<main className="flex-1 p-6">
				<div className="mx-auto max-w-4xl space-y-6">
					<div className="grid gap-6 md:grid-cols-3">
						<Card className="text-center">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Your Score</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="relative mx-auto my-4 h-36 w-36">
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="font-bold text-4xl">{results.score}%</div>
									</div>
									<svg className="h-full w-full" viewBox="0 0 100 100">
										<title>Your Score Progress</title>
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

						<Card className="text-center">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Your Rank</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex h-36 flex-col items-center justify-center">
									<Award className="mb-2 h-12 w-12 text-primary" />
									<div className="font-bold text-4xl">#{results.rank}</div>
									<p className="text-muted-foreground text-sm">
										of {results.totalParticipants} participants
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="text-center">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">Time Taken</CardTitle>
							</CardHeader>
							<CardContent>
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
						<TabsList>
							<TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
							<TabsTrigger value="categories">Categories</TabsTrigger>
							<TabsTrigger value="answers">Your Answers</TabsTrigger>
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
												key={participant.name}
												className={`flex items-center justify-between rounded-lg p-4 ${
													participant.rank === 1
														? "bg-yellow-100 dark:bg-yellow-900/30"
														: participant.rank === 2
															? "bg-slate-100 dark:bg-slate-800/30"
															: participant.rank === 3
																? "bg-amber-100 dark:bg-amber-900/30"
																: "bg-muted/50"
												} ${participant.name === "John Doe" ? "border-2 border-primary" : ""}`}
											>
												<div className="flex items-center gap-4">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
														{participant.rank}
													</div>
													<div>
														<p className="font-medium">{participant.name}</p>
														<p className="text-muted-foreground text-xs">
															{participant.score}% score
														</p>
													</div>
												</div>
												{participant.rank <= 3 && (
													<Medal
														className={`h-5 w-5 ${
															participant.rank === 1
																? "text-yellow-500"
																: participant.rank === 2
																	? "text-slate-400"
																	: "text-amber-600"
														}`}
													/>
												)}
											</div>
										))}
									</div>
								</CardContent>
								<CardFooter className="flex justify-between">
									<Button variant="outline">
										<Share2 className="mr-2 h-4 w-4" />
										Share Results
									</Button>
									<Button>
										<Download className="mr-2 h-4 w-4" />
										Download Results
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
										{results.categories.map((category) => (
											<div key={category.name} className="space-y-2">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														{category.name === "CPR Technique" ? (
															<Heart className="h-4 w-4 text-primary" />
														) : (
															<Shield className="h-4 w-4 text-primary" />
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
										<div className="space-y-4">
											<div className="rounded-lg border p-4">
												<p className="font-medium">
													1. What is the correct compression rate for adult CPR?
												</p>
												<div className="mt-2 flex items-center text-green-600 text-sm dark:text-green-400">
													<div className="mr-2 h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
													Your answer: 100-120 compressions per minute (Correct)
												</div>
											</div>

											<div className="rounded-lg border p-4">
												<p className="font-medium">
													2. How deep should chest compressions be for an adult?
												</p>
												<div className="mt-2 flex items-center text-green-600 text-sm dark:text-green-400">
													<div className="mr-2 h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
													Your answer: At least 2 inches (5 cm) but not more
													than 2.4 inches (6 cm) (Correct)
												</div>
											</div>

											<div className="rounded-lg border p-4">
												<p className="font-medium">
													3. When using an AED, what should you do before
													applying the pads?
												</p>
												<div className="mt-2 flex items-center text-red-600 text-sm dark:text-red-400">
													<div className="mr-2 h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
													Your answer: Ensure the patient is breathing
													(Incorrect)
												</div>
												<div className="mt-1 text-muted-foreground text-sm">
													Correct answer: Ensure the patient's chest is dry and
													exposed
												</div>
											</div>
										</div>
									</div>
								</CardContent>
								<CardFooter>
									<Button className="w-full">Review All Answers</Button>
								</CardFooter>
							</Card>
						</TabsContent>
					</Tabs>

					<div className="flex justify-between">
						<Button variant="outline" asChild>
							<Link href="/game">Return to Games</Link>
						</Button>
						<Button asChild>
							<Link href="/game/game/new">Start New Game</Link>
						</Button>
					</div>
				</div>
			</main>
		</div>
	);
}
