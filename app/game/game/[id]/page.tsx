"use client";

import { Clock, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react"; // Added useCallback

import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { useToast } from "~/hooks/use-toast";

export default function GameGamePage({ params }: { params: { id: string } }) {
	const router = useRouter();
	const { toast, promise } = useToast(); // Destructure promise from useToast
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [timeLeft, setTimeLeft] = useState(30);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [score, setScore] = useState(0);
	const [streakCount, setStreakCount] = useState(0);

	// Mock data for the game - Ensure questions exist
	const game = {
		title: "CPR & AED Challenge",
		questions: [
			{
				question: "What is the correct compression rate for adult CPR?",
				options: [
					"60-80 compressions per minute",
					"100-120 compressions per minute",
					"140-160 compressions per minute",
					"As fast as possible",
				],
				correctAnswer: 1,
			},
			{
				question: "How deep should chest compressions be for an adult?",
				options: [
					"1-2 inches (2.5-5 cm)",
					"At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
					"3-4 inches (7.5-10 cm)",
					"As deep as possible",
				],
				correctAnswer: 1,
			},
			{
				question:
					"When using an AED, what should you do before applying the pads?",
				options: [
					"Ensure the patient is wet",
					"Ensure the patient is breathing",
					"Ensure the patient's chest is dry and exposed",
					"Ensure the patient is conscious",
				],
				correctAnswer: 2,
			},
		],
	};

	// Get the current question object safely
	const currentQuestionData = game.questions[currentQuestion];
	const totalQuestions = game.questions.length;

	// --- Moved handleNextQuestion definition earlier --- (and wrapped in useCallback)
	const handleNextQuestion = useCallback(() => {
		if (currentQuestion < totalQuestions - 1) {
			setCurrentQuestion(currentQuestion + 1);
			setSelectedAnswer(null);
			setTimeLeft(30);

			// Show progress toast at halfway point
			if (currentQuestion === Math.floor(totalQuestions / 2) - 1) {
				toast({
					title: "Halfway there!",
					description: `You've completed ${Math.floor(totalQuestions / 2)} of ${totalQuestions} questions.`,
					variant: "info",
				});
			}
		} else {
			// Game completed, show completion toast and navigate to results
			promise(
				// Simulate saving results
				new Promise((resolve) => setTimeout(resolve, 1500)),
				{
					loading: {
						title: "Saving your results",
						description: "Please wait while we calculate your score...",
					},
					success: (data) => ({
						title: "Game completed!",
						description: `Great job! Final score: ${score} points.`,
					}),
					// --- Corrected error handler to be a function ---
					error: (err) => ({
						title: "Error saving results",
						description: "There was an issue saving your game results.",
					}),
					// -------------------------------------------------
				},
			)
				.then(() => {
					router.push(`/game/results/${params.id}?score=${score}`);
				})
				.catch((err) => {
					console.error("Error after game completion promise:", err);
				});
		}
	}, [
		currentQuestion,
		totalQuestions,
		toast,
		promise,
		score,
		router,
		params.id,
	]);
	// ----------------------------------------------------

	// Display a welcome toast when the game starts
	useEffect(() => {
		toast({
			title: `Starting: ${game.title}`,
			description: `Get ready! You'll be answering ${game.questions.length} questions.`,
			variant: "info",
		});
	}, [toast]);

	const progress = ((currentQuestion + 1) / totalQuestions) * 100;

	// Timer and auto-next logic
	useEffect(() => {
		if (timeLeft > 0 && selectedAnswer === null) {
			const timer = setTimeout(() => {
				setTimeLeft(timeLeft - 1);
			}, 1000);

			// Show time warning toast when 5 seconds remain
			if (timeLeft === 5) {
				toast({
					title: "Time is running out!",
					description: "Only 5 seconds remaining to answer.",
					variant: "warning",
				});
			}

			return () => clearTimeout(timer);
		}
		if (timeLeft === 0 && selectedAnswer === null) {
			// Time's up, auto-select wrong answer
			setSelectedAnswer(-1);
			setStreakCount(0);

			// Show time's up toast
			toast({
				title: "Time's up!",
				description: "You ran out of time for this question.",
				variant: "destructive",
			});

			// Move to next question after delay
			const timer = setTimeout(() => {
				handleNextQuestion(); // Call the defined function
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [timeLeft, selectedAnswer, toast, handleNextQuestion]); // handleNextQuestion is now stable

	const handleSelectAnswer = (index: number) => {
		if (selectedAnswer === null && currentQuestionData) {
			// Check currentQuestionData
			setSelectedAnswer(index);

			const isCorrect = index === currentQuestionData.correctAnswer; // Use currentQuestionData

			if (isCorrect) {
				// Increase score and streak
				setScore((prev) => prev + 100 + timeLeft * 5);
				setStreakCount((prev) => prev + 1);

				// Show success toast with different messages based on streak
				if (streakCount >= 2) {
					toast({
						title: `${streakCount + 1} in a row! 🔥`,
						description: "You're on fire! Keep the streak going!",
						variant: "success",
					});
				} else {
					toast({
						title: "Correct answer! ✅",
						description: `+${100 + timeLeft * 5} points added to your score.`,
						variant: "success",
					});
				}
			} else {
				// Reset streak on wrong answer
				setStreakCount(0);

				toast({
					title: "Wrong answer ❌",
					description: "The correct answer is highlighted in green.",
					variant: "destructive",
				});
			}

			// Move to next question after delay
			setTimeout(() => {
				handleNextQuestion();
			}, 1500);
		}
	};

	// --- Corrected getButtonVariant function syntax and wrapped in useCallback ---
	const getButtonVariant = useCallback(
		(index: number): "default" | "destructive" | "outline" => {
			if (selectedAnswer === null || !currentQuestionData) return "outline";

			if (index === currentQuestionData.correctAnswer) {
				return "default"; // Use "default" for correct, assuming styling handles it
			}

			if (selectedAnswer === index) {
				return "destructive";
			}

			return "outline";
		},
		[selectedAnswer, currentQuestionData],
	); // Added dependencies
	// -------------------------------------------------

	// Add a loading/error state if currentQuestionData is somehow undefined
	if (!currentQuestionData) {
		return <div>Loading question or question not found...</div>; // Or a better loading/error UI
	}

	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/10 to-accent/10">
			<div className="border-b bg-background p-3 sm:p-4">
				<div className="mx-auto flex max-w-3xl flex-col justify-between sm:flex-row sm:items-center">
					<h1 className="mb-2 font-bold text-lg sm:mb-0 sm:text-xl">
						{game.title}
					</h1>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4 text-muted-foreground" />
							<span className="text-xs sm:text-sm">5 participants</span>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<span
								className={`text-xs sm:text-sm ${timeLeft <= 5 ? "animate-pulse font-bold text-red-500" : ""}`}
							>
								{timeLeft}s
							</span>
						</div>
						<div className="font-semibold">Score: {score}</div>
					</div>
				</div>
			</div>

			<main className="flex flex-1 flex-col items-center justify-center p-6">
				<div className="w-full max-w-3xl space-y-6">
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>
								Question {currentQuestion + 1} of {totalQuestions}
							</span>
							<span
								className={`font-medium ${timeLeft <= 5 ? "animate-pulse font-bold text-red-500" : ""}`}
							>
								{timeLeft} seconds left
							</span>
						</div>
						<Progress value={progress} className="h-2" />
					</div>

					<Card className="w-full">
						<CardHeader>
							<CardTitle className="text-xl">
								{currentQuestionData.question} {/* Use currentQuestionData */}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
								{currentQuestionData.options.map((option, index) => (
									<Button
										key={`option-${index}-${option.substring(0, 10)}`}
										variant={getButtonVariant(index)}
										className="h-auto w-full justify-start px-4 py-3 text-left sm:px-6 sm:py-4"
										onClick={() => handleSelectAnswer(index)}
										disabled={selectedAnswer !== null}
									>
										<div className="flex items-center gap-3 sm:gap-4">
											<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border sm:h-8 sm:w-8">
												{String.fromCharCode(65 + index)}
											</div>
											<span className="text-sm sm:text-base">{option}</span>
										</div>
									</Button>
								))}
							</div>
						</CardContent>
						<CardFooter className="flex justify-between">
							<div className="text-muted-foreground text-sm">
								{streakCount > 1 ? (
									<span className="font-semibold text-amber-500">
										🔥 {streakCount} correct in a row!
									</span>
								) : (
									"Select the correct answer"
								)}
							</div>
							{selectedAnswer !== null && (
								<Button onClick={handleNextQuestion}>
									{currentQuestion < totalQuestions - 1
										? "Next Question"
										: "Finish Game"}
								</Button>
							)}
						</CardFooter>
					</Card>

					<div className="grid grid-cols-5 gap-2">
						{Array.from({ length: totalQuestions }).map((_, index) => (
							<div
								key={`progress-indicator-question-${index}-${currentQuestion}`}
								className={`h-2 rounded-full ${
									index < currentQuestion
										? "bg-primary"
										: index === currentQuestion
											? "animate-pulse bg-primary"
											: "bg-muted"
								}`}
							/>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
