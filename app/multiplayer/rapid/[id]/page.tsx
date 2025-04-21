"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Trophy,
	User,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";
import { ConnectionStatus } from "../../components/connection-status";
import { GameChat } from "../../components/game-chat";
import { PlayerAvatar } from "../../components/player-avatar";

// Define types for better type safety
interface Player {
	id: number;
	name: string;
	avatar: string;
	score: number;
	rank: number;
	streak: number;
	isCurrentUser: boolean;
	status?: "idle" | "typing" | "answered" | "thinking" | "away"; // Ensure status matches this type
}

interface Question {
	id: number;
	question: string;
	options: string[];
	correctAnswer: number;
	category: string;
	difficulty: "easy" | "medium" | "hard";
	timeLimit: number;
	explanation?: string;
}

export default function RapidResponsePage() {
	const params = useParams();
	return <RapidResponseContent gameId={params.id as string} />;
}

function RapidResponseContent({ gameId }: { gameId: string }) {
	const router = useRouter();
	const { toast } = useToast();
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [timeLeft, setTimeLeft] = useState(30);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [score, setScore] = useState(0);
	const [streak, setStreak] = useState(0);
	const [showFeedback, setShowFeedback] = useState(false);
	const [feedbackType, setFeedbackType] = useState<
		"correct" | "incorrect" | "timeout" | null
	>(null);
	const [showLeaderboard, setShowLeaderboard] = useState(false);
	const [gameStarted, setGameStarted] = useState(false);
	const [gameEnded, setGameEnded] = useState(false);
	const [pointsEarned, setPointsEarned] = useState(0);
	const [chatCollapsed, setChatCollapsed] = useState(true);
	const [countdownValue, setCountdownValue] = useState(3);
	const [showCountdown, setShowCountdown] = useState(true);
	const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

	// Start countdown before game begins
	useEffect(() => {
		const countdownInterval = setInterval(() => {
			setCountdownValue((prev) => {
				if (prev <= 1) {
					clearInterval(countdownInterval);
					setShowCountdown(false);
					setGameStarted(true);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(countdownInterval);
	}, []);

	// Mock data for the challenge
	const challenge = {
		id: gameId,
		title: "CPR & AED Challenge",
		totalQuestions: 5,
		category: "Emergency Response",
		difficulty: "Intermediate",
		questions: [
			{
				id: 1,
				question: "What is the correct compression rate for adult CPR?",
				options: [
					"60-80 compressions per minute",
					"100-120 compressions per minute",
					"140-160 compressions per minute",
					"As fast as possible",
				],
				correctAnswer: 1,
				category: "CPR Technique",
				difficulty: "medium",
				timeLimit: 30,
				explanation:
					"The American Heart Association recommends a compression rate of 100-120 compressions per minute for adult CPR to ensure adequate blood circulation.",
			},
			{
				id: 2,
				question: "How deep should chest compressions be for an adult?",
				options: [
					"1-2 inches (2.5-5 cm)",
					"At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
					"3-4 inches (7.5-10 cm)",
					"As deep as possible",
				],
				correctAnswer: 1,
				category: "CPR Technique",
				difficulty: "medium",
				timeLimit: 30,
				explanation:
					"Proper compression depth is at least 2 inches (5 cm) but not more than 2.4 inches (6 cm) for adults. This ensures adequate blood circulation without causing injury.",
			},
			{
				id: 3,
				question:
					"When using an AED, what should you do before applying the pads?",
				options: [
					"Ensure the patient is wet",
					"Ensure the patient is breathing",
					"Ensure the patient's chest is dry and exposed",
					"Ensure the patient is conscious",
				],
				correctAnswer: 2,
				category: "AED Usage",
				difficulty: "hard",
				timeLimit: 30,
				explanation:
					"Before applying AED pads, ensure the patient's chest is dry and exposed. Moisture can interfere with the electrical current and clothing can prevent proper pad contact.",
			},
			{
				id: 4,
				question: "What is the proper hand placement for adult CPR?",
				options: [
					"Two hands on the lower half of the sternum",
					"Two hands on the upper half of the sternum",
					"One hand in the center of the chest",
					"Two hands, one on top of the other, on the center of the chest",
				],
				correctAnswer: 3,
				category: "CPR Technique",
				difficulty: "easy",
				timeLimit: 30,
				explanation:
					"Proper hand placement for adult CPR is two hands, one on top of the other, on the center of the chest (middle of the sternum). This position allows for the most effective compressions.",
			},
			{
				id: 5,
				question:
					"What is the recommended ratio of compressions to breaths in adult CPR?",
				options: ["15:2", "30:2", "15:1", "30:1"],
				correctAnswer: 1,
				category: "CPR Technique",
				difficulty: "medium",
				timeLimit: 30,
				explanation:
					"The recommended ratio is 30 compressions followed by 2 rescue breaths for adult CPR. This ratio maximizes blood circulation while providing necessary ventilation.",
			},
		],
	};

	// Mock players data
	const [players, setPlayers] = useState<Player[]>([
		{
			id: 1,
			name: "You",
			avatar: "/avatar.svg?height=40&width=40",
			score: 0,
			rank: 1,
			streak: 0,
			isCurrentUser: true,
			status: "idle",
		},
		{
			id: 2,
			name: "Sarah Johnson",
			avatar: "/avatar.svg?height=40&width=40",
			score: 0,
			rank: 2,
			streak: 0,
			isCurrentUser: false,
			status: "idle",
		},
		{
			id: 3,
			name: "Michael Smith",
			avatar: "/avatar.svg?height=40&width=40",
			score: 0,
			rank: 3,
			streak: 0,
			isCurrentUser: false,
			status: "idle",
		},
		{
			id: 4,
			name: "Emily Davis",
			avatar: "/avatar.svg?height=40&width=40",
			score: 0,
			rank: 4,
			streak: 0,
			isCurrentUser: false,
			status: "idle",
		},
		{
			id: 5,
			name: "Robert Wilson",
			avatar: "/avatar.svg?height=40&width=40",
			score: 0,
			rank: 5,
			streak: 0,
			isCurrentUser: false,
			status: "idle",
		},
	]);

	const totalQuestions = challenge.questions.length;
	const currentQuestionData = challenge.questions[currentQuestion];
	const progress = currentQuestionData
		? ((currentQuestion + 1) / totalQuestions) * 100
		: 0;

	// Define callbacks before useEffect hooks that use them
	const simulateOtherPlayersAnswers = useCallback(() => {
		setPlayers((prevPlayers) => {
			// Ensure the returned array matches Player[] type
			const updatedPlayers: Player[] = prevPlayers
				.map((player) => {
					if (!player.isCurrentUser) {
						// 70% chance of getting it right for AI players
						const gotItRight = Math.random() > 0.3;
						const basePoints = gotItRight ? 1000 : 0;
						const timeBonus = Math.floor(Math.random() * 200);
						const streakBonus = player.streak > 0 ? player.streak * 100 : 0;
						const pointsToAdd = basePoints + timeBonus + streakBonus;

						return {
							...player,
							score: player.score + pointsToAdd,
							streak: gotItRight ? player.streak + 1 : 0,
							status: "answered" as Player["status"], // Explicit cast
						};
					}
					return player;
				})
				.sort((a, b) => b.score - a.score)
				.map((player, index) => ({
					...player,
					rank: index + 1,
				}));
			return updatedPlayers;
		});
	}, []);

	const handleNextQuestion = useCallback(() => {
		setShowFeedback(false);
		setShowLeaderboard(false);
		setSelectedAnswer(null);
		setPointsEarned(0);

		// Reset player statuses
		setPlayers((prevPlayers) => {
			// Ensure the returned array matches Player[] type
			const updatedPlayers: Player[] = prevPlayers.map((player) => ({
				...player,
				status: "idle" as Player["status"], // Explicit cast
			}));
			return updatedPlayers;
		});

		if (currentQuestion < totalQuestions - 1) {
			setCurrentQuestion((prev) => prev + 1);
			const nextQuestionData = challenge.questions[currentQuestion + 1];
			setTimeLeft(nextQuestionData?.timeLimit || 30);
		} else {
			// Game completed, navigate to results
			setGameEnded(true);

			toast({
				title: "Game completed!",
				description: "Redirecting to results page...",
				duration: 3000,
			});

			setTimeout(() => {
				if (router) {
					router.push(`/multiplayer/results/${gameId}`);
				}
			}, 3000);
		}
	}, [
		currentQuestion,
		totalQuestions,
		challenge.questions,
		router,
		gameId,
		toast,
	]);

	// Show welcome notification when game starts
	useEffect(() => {
		if (gameStarted && currentQuestion === 0) {
			toast({
				title: "Game started!",
				description:
					"Answer quickly for bonus points. Consecutive correct answers build your streak!",
				duration: 5000,
			});
		}
	}, [gameStarted, currentQuestion, toast]);

	// Update player scores randomly to simulate real-time competition
	useEffect(() => {
		if (!gameStarted || gameEnded) return;

		const interval = setInterval(() => {
			setPlayers((prevPlayers) => {
				// Ensure the returned array matches Player[] type
				const updatedPlayers: Player[] = prevPlayers
					.map((player) => {
						if (!player.isCurrentUser && Math.random() > 0.7) {
							// Randomly increase other players' scores
							const pointsToAdd = Math.floor(Math.random() * 300) + 100;
							// Explicitly cast status to satisfy stricter type checking if needed,
							// although "thinking" is already a valid status.
							const newStatus: Player["status"] =
								Math.random() > 0.7 ? "thinking" : player.status;
							return {
								...player,
								score: player.score + pointsToAdd,
								streak: Math.random() > 0.8 ? player.streak + 1 : player.streak,
								status: newStatus,
							};
						}
						return player;
					})
					.sort((a, b) => b.score - a.score)
					.map((player, index) => ({
						...player,
						rank: index + 1,
					}));
				return updatedPlayers;
			});
		}, 3000);

		return () => clearInterval(interval);
	}, [gameStarted, gameEnded]);

	// Timer effect
	useEffect(() => {
		// Add check for currentQuestionData
		if (
			!gameStarted ||
			gameEnded ||
			showFeedback ||
			showCountdown ||
			!currentQuestionData
		)
			return;

		if (timeLeft > 0 && selectedAnswer === null) {
			const timer = setTimeout(() => {
				setTimeLeft((prev) => prev - 1);
			}, 1000);
			return () => clearTimeout(timer);
		}
		if (timeLeft === 0 && selectedAnswer === null) {
			// Time's up
			setFeedbackType("timeout");
			setShowFeedback(true);
			setStreak(0); // Reset streak on timeout

			toast({
				title: "Time's up!",
				// Add nullish coalescing for safety
				description: `The correct answer was: ${
					currentQuestionData.options[currentQuestionData.correctAnswer] ??
					"N/A"
				}`,
				duration: 3000,
			});

			// Update other players
			simulateOtherPlayersAnswers();

			// Move to next question after delay
			const timer = setTimeout(() => {
				handleNextQuestion();
			}, 4000);
			return () => clearTimeout(timer);
		}
	}, [
		timeLeft,
		selectedAnswer,
		gameStarted,
		gameEnded,
		showFeedback,
		showCountdown,
		currentQuestionData,
		toast,
		handleNextQuestion, // Now defined before this hook
		simulateOtherPlayersAnswers, // Now defined before this hook
	]);

	const handleSelectAnswer = (index: number) => {
		// Add check for currentQuestionData
		if (selectedAnswer !== null || showFeedback || !currentQuestionData) return;

		setSelectedAnswer(index);

		// Update player status
		setPlayers((prevPlayers) => {
			return prevPlayers.map((player) => {
				if (player.isCurrentUser) {
					return {
						...player,
						status: "answered",
					};
				}
				return player;
			});
		});

		// Check if answer is correct
		const isCorrect = index === currentQuestionData.correctAnswer;

		// Set feedback type
		setFeedbackType(isCorrect ? "correct" : "incorrect");
		setShowFeedback(true);

		// Show notification
		if (isCorrect) {
			toast({
				title: "Correct answer!",
				description:
					currentQuestionData.explanation ?? "No explanation available.", // Add nullish coalescing
				duration: 4000,
			});
		} else {
			toast({
				title: "Incorrect answer",
				// Add nullish coalescing
				description: `The correct answer was: ${
					currentQuestionData.options[currentQuestionData.correctAnswer] ??
					"N/A"
				}. ${currentQuestionData.explanation ?? ""}`,
				duration: 4000,
			});
		}

		// Update streak
		if (isCorrect) {
			const newStreak = streak + 1;
			setStreak(newStreak);

			if (newStreak > 1) {
				toast({
					title: `${newStreak}x Streak!`,
					description: "Keep it up for bonus points!",
					duration: 2000,
				});
			}
		} else {
			setStreak(0);
		}

		// Calculate score based on correctness, time left, and streak
		if (isCorrect) {
			// Correct answer: base points + time bonus + streak bonus
			const basePoints = 1000;
			const timeBonus = timeLeft * 10;
			const streakBonus = streak * 100;
			const questionScore = basePoints + timeBonus + streakBonus;

			setPointsEarned(questionScore);
			setScore((prev) => prev + questionScore);

			// Update player score
			setPlayers((prevPlayers) => {
				const updatedPlayers = prevPlayers
					.map((player) => {
						if (player.isCurrentUser) {
							return {
								...player,
								score: player.score + questionScore,
								streak: player.streak + 1,
							};
						}
						return player;
					})
					.sort((a, b) => b.score - a.score)
					.map((player, index) => ({
						...player,
						rank: index + 1,
					}));
				return updatedPlayers;
			});
		} else {
			setPointsEarned(0);
		}

		// Simulate other players answering
		simulateOtherPlayersAnswers();

		// Show leaderboard after feedback
		setTimeout(() => {
			setShowLeaderboard(true);
		}, 2000);

		// Move to next question after delay
		setTimeout(() => {
			handleNextQuestion();
		}, 5000);
	};

	const getButtonVariant = (index: number) => {
		// Add check for currentQuestionData
		if (!showFeedback || !currentQuestionData) return "outline";

		if (index === currentQuestionData.correctAnswer) {
			// Return a valid variant, e.g., 'default'. The green ring provides success feedback.
			return "default";
		}

		if (selectedAnswer === index) {
			return "destructive";
		}

		return "outline";
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "easy":
				return "text-green-500";
			case "medium":
				return "text-yellow-500";
			case "hard":
				return "text-red-500";
			default:
				return "text-blue-500";
		}
	};

	// Get current user's rank
	const currentUserRank =
		players.find((player) => player.isCurrentUser)?.rank || 0;

	// Add a check for currentQuestionData before rendering the main content
	if (!currentQuestionData) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
				<p>Loading question data or question not found...</p>
				{/* Optionally add a button to go back or retry */}
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/10 to-accent/10">
			{/* Countdown overlay */}
			{showCountdown && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
					<div className="text-center">
						<h2 className="mb-4 font-bold text-2xl text-white">Get Ready!</h2>
						<div className="animate-pulse font-bold text-7xl text-primary">
							{countdownValue}
						</div>
					</div>
				</div>
			)}

			<div className="sticky top-0 z-10 border-b bg-background p-3 sm:p-4">
				<div className="mx-auto flex max-w-4xl flex-col justify-between sm:flex-row sm:items-center">
					<div className="mb-2 sm:mb-0">
						<h1 className="font-bold text-lg sm:text-xl">{challenge.title}</h1>
						<div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
							<Badge variant="outline">{challenge.category}</Badge>
							<span>•</span>
							<Badge variant="outline">{challenge.difficulty}</Badge>
							<ConnectionStatus />
						</div>
					</div>
					<div className="flex items-center gap-3 sm:gap-4">
						<div className="flex items-center gap-1 sm:gap-2">
							<Users className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
							<span className="text-xs sm:text-sm">
								{players.length} players
							</span>
						</div>
						<div className="flex items-center gap-1 sm:gap-2">
							<Clock className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
							<span className="font-medium text-xs sm:text-sm">
								{timeLeft}s
							</span>
						</div>
						<div className="flex items-center gap-1 sm:gap-2">
							<Trophy className="h-3 w-3 text-primary sm:h-4 sm:w-4" />
							<span className="font-bold text-xs sm:text-sm">{score}</span>
						</div>
					</div>
				</div>
			</div>

			<main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
				<div className="w-full max-w-4xl space-y-6">
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<div className="flex items-center gap-2">
								<span>
									Question {currentQuestion + 1} of {totalQuestions}
								</span>
								<Badge
									variant="outline"
									className={getDifficultyColor(currentQuestionData.difficulty)}
								>
									{currentQuestionData.difficulty}
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span className="font-medium">{timeLeft} seconds left</span>
								{streak > 1 && (
									<Badge variant="default" className="bg-orange-500">
										{streak}x Streak!
									</Badge>
								)}
							</div>
						</div>
						<Progress value={progress} className="h-2" />
					</div>

					<Card className="relative w-full overflow-hidden">
						{showFeedback && ( // No need to check currentQuestionData here as it's checked before rendering Card
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">
								<div className="max-w-md rounded-lg bg-card p-6 text-center shadow-lg">
									{feedbackType === "correct" && (
										<>
											<CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
											<h2 className="mb-2 font-bold text-2xl">Correct!</h2>
											<p className="mb-4 text-lg">+{pointsEarned} points</p>
											{streak > 1 && (
												<Badge className="bg-orange-500 text-white">
													Streak: {streak}x
												</Badge>
											)}
											<p className="mt-4 text-muted-foreground text-sm">
												{currentQuestionData.explanation ?? ""}
											</p>
										</>
									)}
									{feedbackType === "incorrect" && (
										<>
											<XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
											<h2 className="mb-2 font-bold text-2xl">Incorrect</h2>
											<p className="mb-4 text-muted-foreground">
												The correct answer was:{" "}
												{currentQuestionData.options[
													currentQuestionData.correctAnswer
												] ?? "N/A"}
											</p>
											<p className="text-muted-foreground text-sm">
												{currentQuestionData.explanation ?? ""}
											</p>
										</>
									)}
									{feedbackType === "timeout" && (
										<>
											<AlertCircle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
											<h2 className="mb-2 font-bold text-2xl">Time's Up!</h2>
											<p className="mb-4 text-muted-foreground">
												The correct answer was:{" "}
												{currentQuestionData.options[
													currentQuestionData.correctAnswer
												] ?? "N/A"}
											</p>
											<p className="text-muted-foreground text-sm">
												{currentQuestionData.explanation ?? ""}
											</p>
										</>
									)}
								</div>
							</div>
						)}

						<CardHeader>
							<div className="mb-2 flex items-center gap-2">
								<Badge variant="outline">
									{currentQuestionData.category ?? "N/A"}
								</Badge>
							</div>
							<CardTitle className="text-xl md:text-2xl">
								{currentQuestionData.question ?? "Question text missing"}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
								{/* Add nullish coalescing for options array */}
								{(currentQuestionData.options ?? []).map((option, index) => (
									<Button
										key={option} // Use option string as key instead of index
										// Correct the ref callback signature
										ref={(el) => {
											optionsRef.current[index] = el;
										}}
										variant={getButtonVariant(index)} // Remove 'as any' cast
										className={cn(
											"relative h-auto overflow-hidden px-4 py-4 text-sm transition-all sm:px-6 sm:py-6 sm:text-lg",
											showFeedback &&
												index === currentQuestionData.correctAnswer &&
												"ring-2 ring-green-500 ring-offset-2",
											showFeedback &&
												selectedAnswer === index &&
												index !== currentQuestionData.correctAnswer &&
												"ring-2 ring-red-500 ring-offset-2",
										)}
										onClick={() => handleSelectAnswer(index)}
										disabled={selectedAnswer !== null || showFeedback}
									>
										<div className="flex items-center gap-3 sm:gap-4">
											<div
												className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
													index === 0
														? "bg-red-500"
														: index === 1
															? "bg-blue-500"
															: index === 2
																? "bg-yellow-500"
																: "bg-green-500"
												} text-white`}
											>
												{String.fromCharCode(65 + index)}
											</div>
											<span>{option}</span>
										</div>

										{/* Show checkmark or x for correct/incorrect answers during feedback */}
										{showFeedback &&
											index === currentQuestionData.correctAnswer && (
												<CheckCircle2 className="absolute right-4 h-5 w-5 text-green-500 sm:h-6 sm:w-6" />
											)}
										{showFeedback &&
											selectedAnswer === index &&
											index !== currentQuestionData.correctAnswer && (
												<XCircle className="absolute right-4 h-5 w-5 text-red-500 sm:h-6 sm:w-6" />
											)}
									</Button>
								))}
							</div>
						</CardContent>
						<CardFooter className="flex justify-between">
							<div className="text-muted-foreground text-sm">
								Select the correct answer
							</div>
							{selectedAnswer !== null && !showLeaderboard && (
								<Button onClick={handleNextQuestion}>
									{currentQuestion < totalQuestions - 1
										? "Next Question"
										: "Finish Challenge"}
								</Button>
							)}
						</CardFooter>
					</Card>

					{/* Player avatars with status */}
					<div className="flex flex-wrap justify-center gap-4">
						{players.map((player) => (
							<PlayerAvatar
								key={player.id}
								player={player}
								showStatus={true}
								showName={true}
							/>
						))}
					</div>

					{showLeaderboard && (
						<Card className="fade-in slide-in-from-bottom-4 w-full animate-in duration-300">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Trophy className="h-5 w-5 text-primary" />
									Current Standings
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{players
										.sort((a, b) => a.rank - b.rank)
										.map((player) => (
											<div
												key={player.id}
												className={cn(
													"flex items-center justify-between rounded-lg p-3 transition-all",
													player.isCurrentUser
														? "border border-primary/20 bg-primary/10"
														: "bg-muted/50",
													player.rank <= 3
														? `border-l-4 ${
																player.rank === 1
																	? "border-l-yellow-500"
																	: player.rank === 2
																		? "border-l-slate-400"
																		: "border-l-amber-600"
															}`
														: "",
												)}
											>
												<div className="flex items-center gap-3">
													<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
														{player.rank}
													</div>
													<Avatar className="h-8 w-8">
														<AvatarImage
															src={player.avatar}
															alt={player.name}
														/>
														<AvatarFallback>{player.name[0]}</AvatarFallback>
													</Avatar>
													<div>
														<div className="flex items-center gap-2">
															<span className="font-medium">{player.name}</span>
															{player.isCurrentUser && (
																<Badge variant="outline" className="text-xs">
																	You
																</Badge>
															)}
														</div>
														{player.streak > 1 && (
															<div className="font-medium text-orange-500 text-xs">
																{player.streak}x streak
															</div>
														)}
													</div>
												</div>
												<div className="font-bold">{player.score}</div>
											</div>
										))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Player rank indicator (always visible) */}
					<div className="-translate-x-1/2 fixed bottom-4 left-1/2 z-20 flex transform items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs shadow-lg sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
						<User className="h-3 w-3 text-primary sm:h-4 sm:w-4" />
						<span className="font-medium">Rank: #{currentUserRank}</span>
						<Separator orientation="vertical" className="h-4 sm:h-6" />
						<Trophy className="h-3 w-3 text-primary sm:h-4 sm:w-4" />
						<span className="font-medium">{score} pts</span>
					</div>
				</div>
			</main>

			{/* Floating chat */}
			<div className="fixed right-4 bottom-16 z-20">
				{!chatCollapsed ? (
					<div className="h-96 w-80">
						<GameChat
							sessionId={gameId}
							onToggleCollapse={() => setChatCollapsed(true)}
						/>
					</div>
				) : (
					<Button
						variant="outline"
						className="flex items-center gap-2"
						onClick={() => setChatCollapsed(false)}
					>
						<span>Chat</span>
					</Button>
				)}
			</div>
		</div>
	);
}
