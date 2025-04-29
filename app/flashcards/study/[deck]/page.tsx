"use client";

import {
	ArrowLeft,
	Award,
	Brain,
	ChevronLeft,
	ChevronRight,
	Clock,
	Dices,
	Hourglass,
	Info,
	ListTodo,
	Sparkles,
	ThumbsDown,
	ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";

// Define the full flashcard interface with all properties we need
interface Flashcard {
	// Core properties
	id: string;
	question: string;
	answer: string;
	deckId: string | null;
	userId: string;
	title: string | null;
	imageUrl: string | null;
	createdAt: Date;

	// Optional API properties
	tags?: string[];
	repetitions?: number;
	easeFactor?: number;
	interval: number;
	nextReview: Date | null;
	lastReview: Date | null; // This matches the DB schema
	aiGenerated: boolean;
	deck?: { name: string } | null;

	// Additional fields for our application
	updatedAt: Date;
	difficulty: number;

	// For backward compatibility
	front: string;
	back: string;
}

import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

export default function StudyDeckPage({
	params,
}: { params: Promise<{ deck: string }> }) {
	const resolvedParams = React.use(params);
	const deckId = resolvedParams.deck;
	const { toast } = useToast();

	// State declarations
	const [flipped, setFlipped] = useState(false);
	const [currentCard, setCurrentCard] = useState(0);
	const [cards, setCards] = useState<Flashcard[]>([]);
	const [progress, setProgress] = useState(0);
	const [studyStats, setStudyStats] = useState({
		easyCards: 0,
		hardCards: 0,
		totalReviewed: 0, // unique cards reviewed
		totalReviewsCount: 0, // total number of reviews (including repeats)
		studyStartTime: Date.now(),
	});
	const [showConfetti, setShowConfetti] = useState(false);
	const [studyDuration, setStudyDuration] = useState(0);
	const [showCompletionDialog, setShowCompletionDialog] = useState(false);

	// Derived state
	const totalCards = cards.length;

	// Utility function to calculate mastery
	const calculateMasteryProgress = useCallback((cards: Flashcard[]) => {
		const masteredCards = cards.filter(
			(card) =>
				card.repetitions &&
				card.repetitions > 1 &&
				card.easeFactor &&
				card.easeFactor >= 2.5,
		).length;

		const learningCards = cards.filter(
			(card) =>
				card.repetitions &&
				card.repetitions > 0 &&
				card.easeFactor &&
				card.easeFactor < 2.5,
		).length;

		return cards.length
			? Math.round(((masteredCards + learningCards * 0.5) / cards.length) * 100)
			: 0;
	}, []);

	// Fetch deck information
	const { data: deck, isLoading: deckLoading } =
		api.flashcard.getDeckById.useQuery({
			id: deckId,
		});

	// Fetch due cards or all cards from this deck
	const { data: dueCards, isLoading: cardsLoading } =
		api.flashcard.getFlashcards.useQuery({
			deckId: deckId,
		});

	// Fetch current study stats
	const { data: dbStudyStats } = api.flashcard.getStudyStats.useQuery();

	// Record study results
	const recordStudyResult = api.flashcard.recordStudyResult.useMutation({
		onSuccess: () => {
			// Success handled in the card rating function
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message || "Failed to save your progress",
				variant: "destructive",
			});
		},
	});

	// Update study statistics in the database
	const utils = api.useUtils();
	const updateStudyStats = api.flashcard.updateStudyStats.useMutation({
		onSuccess: () => {
			// Invalidate the study stats query to refresh the UI
			utils.flashcard.getStudyStats.invalidate();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: "Failed to update study statistics",
				variant: "destructive",
			});
		},
	});

	// Set up cards once data is loaded
	useEffect(() => {
		if (dueCards && dueCards.length > 0) {
			// Remove debug console log
			// Initialize cards with proper SRS data

			// Map the data and ensure all required properties are present with default values
			const mappedCards = dueCards.map((card) => {
				// Use a type assertion to declare the card object type we expect
				// This helps TypeScript understand that these properties exist (or will be added)
				type APICard = typeof card & {
					updatedAt?: Date;
					difficulty?: number;
				};

				const cardData = card as APICard;

				// Create a properly typed object that matches our Flashcard interface
				const typedCard: Flashcard = {
					// Core properties
					id: cardData.id,
					question: cardData.question,
					answer: cardData.answer,
					deckId: cardData.deckId,
					userId: cardData.userId,
					title: cardData.title,
					imageUrl: cardData.imageUrl,
					createdAt: cardData.createdAt,

					// Optional API properties
					tags: Array.isArray(cardData.tags) ? cardData.tags : [],
					repetitions:
						typeof cardData.repetitions === "number" ? cardData.repetitions : 0,
					easeFactor:
						typeof cardData.easeFactor === "number" ? cardData.easeFactor : 2.5,
					interval:
						typeof cardData.interval === "number" ? cardData.interval : 1,
					nextReview:
						cardData.nextReview instanceof Date
							? cardData.nextReview
							: new Date(),
					lastReview:
						cardData.lastReview instanceof Date ? cardData.lastReview : null,
					aiGenerated: Boolean(cardData.aiGenerated),
					deck: cardData.deck || null,

					// Additional fields for our application
					updatedAt:
						cardData.updatedAt instanceof Date
							? cardData.updatedAt
							: new Date(),
					difficulty:
						typeof cardData.difficulty === "number" ? cardData.difficulty : 0,

					// For backward compatibility
					front: cardData.question,
					back: cardData.answer,
				};

				return typedCard;
			});

			setCards(mappedCards);
			// Initialize progress when cards are first loaded
			const initialProgress = calculateMasteryProgress(mappedCards);
			setProgress(initialProgress);
		}
	}, [dueCards, calculateMasteryProgress]);

	// Update the duration and progress
	useEffect(() => {
		// Don't start/continue the timer if the completion dialog is shown
		if (showCompletionDialog) {
			return;
		}

		const timer = setInterval(() => {
			setStudyDuration(
				Math.floor((Date.now() - studyStats.studyStartTime) / 1000),
			);
		}, 1000);

		// Calculate and update progress whenever cards change
		if (cards.length > 0) {
			const masteredCount = cards.filter(
				(card) =>
					card.repetitions &&
					card.repetitions > 1 &&
					card.easeFactor &&
					card.easeFactor >= 2.5,
			).length;
			const learningCount = cards.filter(
				(card) =>
					card.repetitions &&
					card.repetitions > 0 &&
					card.easeFactor &&
					card.easeFactor < 2.5,
			).length;
			const newProgress = Math.round(
				((masteredCount + learningCount * 0.5) / cards.length) * 100,
			);
			setProgress(newProgress);
		}

		return () => clearInterval(timer);
	}, [studyStats.studyStartTime, cards, showCompletionDialog]);

	// Add keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === " " || e.key === "Enter") {
				e.preventDefault();
				setFlipped(!flipped);
			} else if (
				e.key === "ArrowRight" &&
				!flipped &&
				currentCard < totalCards - 1
			) {
				handleNext();
			} else if (e.key === "ArrowLeft" && !flipped && currentCard > 0) {
				handlePrevious();
			} else if (e.key === "1" && flipped) {
				handleCardRating(1);
			} else if (e.key === "2" && flipped) {
				handleCardRating(2);
			} else if (e.key === "3" && flipped) {
				handleCardRating(3);
			} else if (e.key === "4" && flipped) {
				handleCardRating(4);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [flipped, currentCard, totalCards]);

	// Show confetti effect on deck completion
	useEffect(() => {
		if (showConfetti) {
			const timer = setTimeout(() => {
				setShowConfetti(false);
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [showConfetti]);

	// Calculate study statistics
	const accuracy =
		studyStats.totalReviewed > 0
			? Math.round((studyStats.easyCards / studyStats.totalReviewed) * 100)
			: 0;

	// Format study duration
	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleFlip = () => {
		setFlipped(!flipped);

		if (!flipped) {
			// Only show toast when revealing the answer
			toast({
				title: "Card flipped",
				description: "Take your time to review the answer",
				variant: "info",
			});
		}
	};

	const handleCardRating = (rating: 1 | 2 | 3 | 4) => {
		if (!cards[currentCard]) return; // Update study statistics
		const isEasy = rating >= 3;
		const newStats = {
			...studyStats,
			easyCards: isEasy ? studyStats.easyCards + 1 : studyStats.easyCards,
			hardCards: !isEasy ? studyStats.hardCards + 1 : studyStats.hardCards,
			totalReviewed: studyStats.totalReviewed + 1,
			totalReviewsCount: studyStats.totalReviewsCount + 1,
		};
		setStudyStats(newStats);

		// Update the card's SRS data immediately in state
		const updatedCard = { ...cards[currentCard] };
		updatedCard.repetitions = (updatedCard.repetitions || 0) + 1;
		updatedCard.easeFactor =
			rating >= 3
				? (updatedCard.easeFactor || 2.5) + 0.15
				: Math.max(1.3, (updatedCard.easeFactor || 2.5) - 0.15);

		// Update the cards array and recalculate progress
		const updatedCards = [...cards];
		updatedCards[currentCard] = updatedCard;
		setCards(updatedCards);

		// Update progress immediately
		const newProgress = calculateMasteryProgress(updatedCards);
		setProgress(newProgress);

		// Record the study result in the database and update progress
		// Record both the study result and update stats
		recordStudyResult.mutate(
			{
				flashcardId: cards[currentCard].id,
				rating: rating,
			},
			{
				onSuccess: () => {
					// Calculate and update progress after successful rating
					const masteredCount = updatedCards.filter(
						(card) =>
							card.repetitions &&
							card.repetitions > 1 &&
							card.easeFactor &&
							card.easeFactor >= 2.5,
					).length;
					const learningCount = updatedCards.filter(
						(card) =>
							card.repetitions &&
							card.repetitions > 0 &&
							card.easeFactor &&
							card.easeFactor < 2.5,
					).length;
					const newProgress = Math.round(
						((masteredCount + learningCount * 0.5) / updatedCards.length) * 100,
					);
					setProgress(newProgress);

					// Update study statistics in the database
					updateStudyStats.mutate({
						totalReviewed: studyStats.totalReviewsCount + 1,
						isCorrect: rating >= 3,
					});
				},
			},
		);

		// Show rating toast with different messages based on rating
		const messages = {
			1: "This was hard! We'll show it more often.",
			2: "Got it, but needs more review.",
			3: "Good job! Getting better at this one.",
			4: "Perfect! You've mastered this card.",
		};

		toast({
			title: isEasy ? "Marked as Known" : "Marked for Review",
			description: messages[rating],
			variant: isEasy ? "success" : "warning",
		});

		// Automatically move to the next card if available
		if (currentCard < totalCards - 1) {
			handleNext();
		} else {
			// Show completion celebration and dialog
			setShowConfetti(true);
			setShowCompletionDialog(true);
			// Record the final duration
			const finalDuration = Math.floor(
				(Date.now() - studyStats.studyStartTime) / 1000,
			);
			setStudyDuration(finalDuration);
		}
	};

	const handleNext = () => {
		if (currentCard < totalCards - 1) {
			setCurrentCard(currentCard + 1);
			setFlipped(false);

			// If we're at the second-to-last card, show approaching end toast
			if (currentCard === totalCards - 2) {
				toast({
					title: "Last card approaching",
					description: "You're about to review the final card in this deck",
					variant: "info",
				});
			}
		}
	};

	const handlePrevious = () => {
		if (currentCard > 0) {
			setCurrentCard(currentCard - 1);
			setFlipped(false);
		}
	};

	// Show a milestone toast when reaching halfway
	const checkMilestone = (cardIndex: number) => {
		if (cardIndex === Math.floor(totalCards / 2) - 1) {
			toast({
				title: "Halfway there!",
				description: `You've completed ${Math.round(50)}% of this deck. Keep going!`,
				variant: "success",
			});
		}
	};

	// Get difficulty badge based on card ease factor
	const getDifficultyBadge = () => {
		if (!deck)
			return (
				<Badge
					variant="outline"
					className="border-green-300 bg-green-500/20 text-green-600 dark:bg-green-700/30 dark:text-green-400"
				>
					Loading...
				</Badge>
			);

		const cardCount = cards.length;
		if (cardCount > 30) {
			return (
				<Badge
					variant="outline"
					className="border-amber-300 bg-amber-500/20 text-amber-700 dark:bg-amber-700/30 dark:text-amber-400"
				>
					Large Deck
				</Badge>
			);
		}
		if (cardCount > 10) {
			return (
				<Badge
					variant="outline"
					className="border-amber-300 bg-amber-500/20 text-amber-700 dark:bg-amber-700/30 dark:text-amber-400"
				>
					Medium
				</Badge>
			);
		}
		return (
			<Badge
				variant="outline"
				className="border-green-300 bg-green-500/20 text-green-600 dark:bg-green-700/30 dark:text-green-400"
			>
				Small Deck
			</Badge>
		);
	};

	// Show loading state when data is being fetched
	if (deckLoading || cardsLoading) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="font-medium text-lg">Loading flashcards...</p>
				</div>
			</div>
		);
	}

	// Show empty state if there are no cards
	if (!cards.length) {
		return (
			<div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-secondary/10">
				<header className="border-b bg-gradient-to-r from-primary/10 via-background to-primary/10">
					<div className="container mx-auto py-4">
						<div className="flex items-center">
							<Button variant="ghost" size="icon" asChild className="mr-3">
								<Link href="/flashcards">
									<ArrowLeft className="h-5 w-5" />
									<span className="sr-only">Back to decks</span>
								</Link>
							</Button>
							<h1 className="font-bold text-2xl">{deck?.name || "Deck"}</h1>
						</div>
					</div>
				</header>
				<main className="container mx-auto flex flex-1 flex-col items-center justify-center p-6">
					<Card className="w-full max-w-md">
						<CardHeader>
							<h2 className="text-center font-bold text-xl">
								No Cards to Study
							</h2>
						</CardHeader>
						<CardContent className="text-center">
							<p className="mb-6">
								There are no cards in this deck yet, or all cards have been
								reviewed.
							</p>
						</CardContent>
						<CardFooter className="flex flex-col gap-4">
							<Button asChild className="w-full">
								<Link href={`/flashcards/manage/${deckId}`}>Manage Deck</Link>
							</Button>
							<Button variant="outline" asChild className="w-full">
								<Link href="/flashcards">Back to Decks</Link>
							</Button>
						</CardFooter>
					</Card>
				</main>
			</div>
		);
	}

	const now = new Date();

	// Calculate cards due for review
	const calculateDueCards = (cardList: Flashcard[]) => {
		return cardList.filter((card) => {
			if (!card.nextReview) return true; // New cards are due
			const nextReview = new Date(card.nextReview);
			return nextReview <= now;
		}).length;
	};

	const dueCardsCount = calculateDueCards(cards);

	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-secondary/10">
			{showConfetti && (
				<div className="confetti-container pointer-events-none fixed inset-0 z-50">
					{[...Array(50)].map((_, i) => (
						<div
							key={`confetti-${i}-${Math.random().toString(36).substring(2, 9)}`}
							className="confetti"
							style={{
								left: `${Math.random() * 100}%`,
								top: "-5%",
								backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
								width: `${Math.random() * 10 + 5}px`,
								height: `${Math.random() * 10 + 5}px`,
								animation: `fall ${Math.random() * 3 + 2}s linear forwards, sway ${Math.random() * 4 + 3}s ease-in-out infinite alternate`,
							}}
						/>
					))}
				</div>
			)}

			{/* Refined Header with improved design */}
			<header className="sticky top-0 z-10 border-b bg-gradient-to-r from-primary/10 via-background to-primary/10 backdrop-blur-sm">
				<div className="container mx-auto py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<Button
								variant="ghost"
								size="icon"
								asChild
								className="mr-3 rounded-full transition-colors hover:bg-primary/10"
							>
								<Link href="/flashcards">
									<ArrowLeft className="h-5 w-5" />
									<span className="sr-only">Back to decks</span>
								</Link>
							</Button>

							<div>
								<div className="flex items-center gap-2">
									<h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-2xl text-transparent tracking-tight">
										{deck?.name || "Loading..."}
									</h1>
									{getDifficultyBadge()}
								</div>
								<p className="flex items-center gap-1.5 text-muted-foreground text-sm">
									<span className="inline-flex items-center gap-1">
										<Dices className="h-3.5 w-3.5 text-primary/70" />
										Card {currentCard + 1} of {totalCards}
									</span>
									<span className="mx-1.5 inline-block h-1 w-1 rounded-full bg-muted-foreground/30" />
									<span>{Math.round(progress)}% complete</span>
								</p>
							</div>
						</div>

						<div className="hidden items-center gap-5 text-sm md:flex">
							<div className="flex items-center gap-1.5 rounded-md bg-secondary/40 px-3 py-1.5">
								<Clock className="h-4 w-4 text-primary/70" />
								<span className="font-medium">
									{formatDuration(studyDuration)}
								</span>
							</div>
							<div className="flex items-center gap-1.5 rounded-md bg-secondary/40 px-3 py-1.5">
								<Brain className="h-4 w-4 text-primary/70" />
								<span className="font-medium">
									{dbStudyStats?.studiedToday || 0} today
								</span>
							</div>
							<div className="flex items-center gap-1.5 rounded-md bg-secondary/40 px-3 py-1.5">
								<Award className="h-4 w-4 text-amber-500" />
								<span className="font-medium">{accuracy}% accuracy</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Enhanced study area with improved layout */}
			<main className="container mx-auto flex flex-1 flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
				<div className="w-full max-w-4xl space-y-8">
					{/* Enhanced progress tracking with better visuals */}
					<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2.5 rounded-xl border bg-card p-5 shadow-md transition-shadow hover:shadow-lg dark:bg-card/80 dark:backdrop-blur-sm">
							<div className="flex items-center justify-between">
								<span className="flex items-center gap-2 font-semibold text-sm">
									<ThumbsUp className="h-4 w-4 text-green-500" />
									Easy Cards
								</span>
								<span className="font-bold text-green-600 text-sm">
									{studyStats.easyCards}
								</span>
							</div>
							<Progress
								value={
									(studyStats.easyCards /
										Math.max(1, studyStats.totalReviewed)) *
									100
								}
								className="h-2.5 rounded-full bg-muted"
							/>
							<p className="flex items-center gap-1.5 text-muted-foreground text-xs">
								{studyStats.totalReviewed > 0 ? (
									<>
										<Info className="h-3.5 w-3.5 text-primary/60" />
										<span>
											{Math.round(
												(studyStats.easyCards / studyStats.totalReviewed) * 100,
											)}
											% success rate
										</span>
									</>
								) : (
									<>
										<Info className="h-3.5 w-3.5 text-primary/60" />
										<span>No cards reviewed yet</span>
									</>
								)}
							</p>
						</div>

						<div className="space-y-2.5 rounded-xl border bg-card p-5 shadow-md transition-shadow hover:shadow-lg dark:bg-card/80 dark:backdrop-blur-sm">
							<div className="flex items-center justify-between">
								<span className="flex items-center gap-2 font-semibold text-sm">
									<Hourglass className="h-4 w-4 text-primary" />
									Study Time
								</span>
								<span className="font-bold text-sm">
									{formatDuration(studyDuration)}
								</span>
							</div>
							<div className="mt-2.5 flex items-center justify-between gap-2">
								<span className="text-muted-foreground text-xs">
									Avg. per card:
								</span>
								<span className="rounded-md bg-secondary/40 px-2.5 py-1 font-medium text-xs">
									{studyStats.totalReviewed > 0
										? formatDuration(
												Math.floor(studyDuration / studyStats.totalReviewed),
											)
										: "0:00"}
								</span>
							</div>
						</div>
					</div>

					{/* Enhanced flashcard with improved animations and design */}
					<div
						className={`perspective-1000 w-full transition-all duration-300 ${flipped ? "scale-[1.02]" : ""}`}
					>
						<Card
							className={`transform-style-3d relative min-h-[350px] w-full cursor-pointer rounded-2xl border-2 transition-all duration-500 hover:shadow-2xl sm:min-h-[400px] md:min-h-[450px] ${
								flipped
									? "border-primary/40 shadow-lg shadow-primary/5"
									: "border-border hover:border-primary/20"
							}bg-gradient-to-br overflow-hidden from-card to-card/95 `}
							onClick={handleFlip}
						>
							{/* Abstract pattern decoration */}
							<div className="pointer-events-none absolute inset-0 overflow-hidden opacity-5">
								{[...Array(8)].map((_, i) => (
									<div
										key={`pattern-${i}-${Math.random().toString(36).substring(2, 9)}`}
										className="absolute rounded-full bg-primary/30 blur-3xl"
										style={{
											width: `${Math.random() * 200 + 100}px`,
											height: `${Math.random() * 200 + 100}px`,
											left: `${Math.random() * 100}%`,
											top: `${Math.random() * 100}%`,
											opacity: Math.random() * 0.5 + 0.25,
											transform: "translate(-50%, -50%)",
										}}
									/>
								))}
							</div>

							{/* Front of card (Question) */}
							<div
								className={`backface-hidden absolute inset-0 flex h-full w-full flex-col transition-all duration-500 ${
									flipped ? "rotate-y-180 opacity-0" : "rotate-y-0 opacity-100"
								}`}
								style={{
									backfaceVisibility: "hidden",
									transformStyle: "preserve-3d",
								}}
							>
								<CardHeader className="pb-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
												<Dices className="h-4 w-4 text-primary" />
											</div>
											<div className="font-medium text-primary text-sm">
												Question
											</div>
										</div>
										<div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 font-medium text-primary text-xs">
											<Info className="h-3.5 w-3.5" />
											Card {currentCard + 1} of {totalCards}
										</div>
									</div>
									<div className="mt-4 border-b pb-2 font-extrabold text-2xl text-foreground tracking-tight">
										{cards[currentCard]?.title || "Question"}
									</div>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col items-center justify-center space-y-4 p-6">
									{cards[currentCard]?.imageUrl && (
										<div className="relative mb-4 h-40 w-full max-w-xs overflow-hidden rounded-lg">
											<img
												src={cards[currentCard].imageUrl}
												alt="Flashcard illustration"
												className="h-full w-full object-contain"
											/>
										</div>
									)}
									<div className="max-w-2xl text-center font-medium text-lg sm:text-xl">
										{cards[currentCard]?.question || "Loading..."}
									</div>
								</CardContent>
								<CardFooter className="flex justify-center pb-8 opacity-70">
									<Button
										variant="outline"
										className="group relative overflow-hidden border-primary/30 text-primary transition-colors hover:text-primary-foreground"
									>
										<span className="relative z-10">Tap to Reveal Answer</span>
										<span className="absolute inset-0 origin-left scale-x-0 transform bg-primary transition-transform duration-300 group-hover:scale-x-100" />
									</Button>
								</CardFooter>
								{/* Keyboard hints with improved styling */}
								<div className="absolute right-3 bottom-3 flex gap-2">
									<kbd className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs shadow-sm">
										Space
									</kbd>
								</div>
							</div>

							{/* Back of card (Answer) with enhanced design */}
							<div
								className={`backface-hidden absolute inset-0 flex h-full w-full flex-col transition-all duration-500 ${
									flipped ? "rotate-y-0 opacity-100" : "rotate-y-180 opacity-0"
								}`}
								style={{
									backfaceVisibility: "hidden",
									transformStyle: "preserve-3d",
								}}
							>
								<CardHeader className="pb-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
												<Award className="h-4 w-4 text-green-500" />
											</div>
											<div className="font-medium text-green-600 text-sm">
												Answer
											</div>
										</div>
										<div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3.5 py-1.5 font-medium text-green-600 text-xs">
											<Info className="h-3.5 w-3.5" />
											Card {currentCard + 1} of {totalCards}
										</div>
									</div>
									<div className="mt-4 border-b pb-2 font-extrabold text-2xl text-foreground tracking-tight">
										{cards[currentCard]?.title || "Answer"}
									</div>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col items-center justify-center space-y-4 p-6">
									{cards[currentCard]?.imageUrl && (
										<div className="relative mb-4 h-40 w-full max-w-xs overflow-hidden rounded-lg">
											<img
												src={cards[currentCard].imageUrl}
												alt="Flashcard illustration"
												className="h-full w-full object-contain"
											/>
										</div>
									)}
									<div className="max-w-2xl text-center font-medium text-lg leading-relaxed sm:text-xl">
										{cards[currentCard]?.answer || "Loading..."}
									</div>
								</CardContent>
								<CardFooter className="flex flex-col justify-center gap-4 pb-8 sm:flex-row">
									<div className="grid w-full max-w-md grid-cols-2 gap-3">
										<Button
											variant="outline"
											className="group gap-2 border-red-300 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
											onClick={() => handleCardRating(1)}
										>
											<ThumbsDown className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
											<span>Hard</span>
											<span className="ml-1 rounded bg-muted/50 px-1.5 text-xs opacity-70">
												1
											</span>
										</Button>
										<Button
											variant="outline"
											className="group gap-2 border-amber-300 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/50"
											onClick={() => handleCardRating(2)}
										>
											<span>Good</span>
											<span className="ml-1 rounded bg-muted/50 px-1.5 text-xs opacity-70">
												2
											</span>
										</Button>
										<Button
											variant="outline"
											className="group gap-2 border-green-300 text-green-600 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/50"
											onClick={() => handleCardRating(3)}
										>
											<span>Easy</span>
											<span className="ml-1 rounded bg-muted/50 px-1.5 text-xs opacity-70">
												3
											</span>
										</Button>
										<Button
											variant="outline"
											className="group gap-2 border-emerald-300 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50"
											onClick={() => handleCardRating(4)}
										>
											<ThumbsUp className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
											<span>Perfect</span>
											<span className="ml-1 rounded bg-muted/50 px-1.5 text-xs opacity-70">
												4
											</span>
										</Button>
									</div>
								</CardFooter>
								{/* Keyboard hints with improved styling */}
								<div className="absolute right-3 bottom-3 flex gap-2">
									<kbd className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs shadow-sm">
										1-4
									</kbd>
								</div>
							</div>
						</Card>
					</div>

					{/* Enhanced navigation buttons */}
					<div className="mt-10 flex items-center justify-between">
						<Button
							variant="outline"
							onClick={handlePrevious}
							disabled={currentCard === 0}
							className="h-auto rounded-xl border px-5 py-2.5 shadow-sm transition-all duration-200 hover:translate-x-[-2px] disabled:opacity-50"
						>
							<ChevronLeft className="mr-2 h-4 w-4" />
							<span className="hidden sm:inline">Previous</span>
							<span className="ml-1.5 hidden rounded bg-muted/50 px-1.5 text-xs opacity-70 sm:inline">
								←
							</span>
						</Button>

						<div className="hidden text-center md:block">
							<span className="rounded-full bg-secondary/40 px-4 py-2 font-medium text-sm">
								Card {currentCard + 1} of {totalCards}
							</span>
						</div>

						<Button
							onClick={() => {
								handleNext();
								checkMilestone(currentCard + 1);
							}}
							disabled={currentCard === totalCards - 1}
							className="h-auto rounded-xl bg-primary px-5 py-2.5 shadow-sm transition-all duration-200 hover:translate-x-[2px] hover:bg-primary/90 disabled:opacity-50"
						>
							<span className="hidden sm:inline">Next</span>
							<ChevronRight className="ml-2 h-4 w-4" />
							<span className="ml-1.5 hidden rounded bg-primary-foreground/20 px-1.5 text-xs opacity-70 sm:inline">
								→
							</span>
						</Button>
					</div>

					{/* Keyboard shortcuts guide with improved design */}
					<div className="mt-6 hidden rounded-xl bg-muted/30 px-4 py-3 text-center text-muted-foreground text-xs sm:block">
						<p className="flex flex-wrap items-center justify-center gap-2">
							<span>Keyboard shortcuts:</span>
							<span className="flex items-center gap-1">
								<kbd className="mx-1 rounded-md border bg-background px-2 py-0.5 shadow-sm">
									Space
								</kbd>
								<span>to flip card</span>
							</span>
							<span className="flex items-center gap-1">
								<kbd className="mx-1 rounded-md border bg-background px-2 py-0.5 shadow-sm">
									←
								</kbd>
								<span>previous card</span>
							</span>
							<span className="flex items-center gap-1">
								<kbd className="mx-1 rounded-md border bg-background px-2 py-0.5 shadow-sm">
									→
								</kbd>
								<span>next card</span>
							</span>
							<span className="flex items-center gap-1">
								<kbd className="mx-1 rounded-md border bg-background px-2 py-0.5 shadow-sm">
									1-4
								</kbd>
								<span>rate difficulty</span>
							</span>
						</p>
					</div>
				</div>
			</main>

			{/* Session Completion Dialog */}
			<AlertDialog
				open={showCompletionDialog}
				onOpenChange={setShowCompletionDialog}
			>
				<AlertDialogContent className="sm:max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<span className="text-2xl">🎉</span>
							<span>Study Session Complete!</span>
						</AlertDialogTitle>
						<AlertDialogDescription className="space-y-4">
							<div className="mt-4 grid grid-cols-2 gap-4">
								<div className="space-y-2 rounded-lg bg-secondary/50 p-4 text-center">
									<div className="font-medium text-2xl text-primary">
										{dbStudyStats?.studiedToday || 0}
									</div>
									<div className="text-muted-foreground text-sm">
										Cards Reviewed Today
									</div>
								</div>
								<div className="space-y-2 rounded-lg bg-secondary/50 p-4 text-center">
									<div className="font-medium text-2xl text-amber-500">
										{dbStudyStats?.totalStudied || 0}
									</div>
									<div className="text-muted-foreground text-sm">
										Total Lifetime Reviews
									</div>
								</div>
								<div className="space-y-2 rounded-lg bg-secondary/50 p-4 text-center">
									<div className="font-medium text-2xl">{accuracy}%</div>
									<div className="text-muted-foreground text-sm">
										Success Rate
									</div>
								</div>
								<div className="space-y-2 rounded-lg bg-secondary/50 p-4 text-center">
									<div className="font-medium text-2xl">
										{formatDuration(studyDuration)}
									</div>
									<div className="text-muted-foreground text-sm">
										Total Time
									</div>
								</div>
							</div>

							<div className="text-center text-muted-foreground text-sm">
								Average time per card:{" "}
								{studyStats.totalReviewed > 0
									? formatDuration(
											Math.floor(studyDuration / studyStats.totalReviewed),
										)
									: "0:00"}
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel asChild>
							<Button variant="outline" asChild>
								<Link href="/flashcards">Return to Decks</Link>
							</Button>
						</AlertDialogCancel>
						<AlertDialogAction onClick={() => window.location.reload()}>
							Study Again
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes sway {
          0% {
            transform: translateX(-10px);
          }
          100% {
            transform: translateX(10px);
          }
        }

        .confetti {
          position: absolute;
          border-radius: 50%;
          opacity: 0.7;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .transform-style-3d {
          transform-style: preserve-3d;
        }

        .backface-hidden {
          backface-visibility: hidden;
        }

        .rotate-y-0 {
          transform: rotateY(0deg);
        }

        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        @media (prefers-reduced-motion: reduce) {
          .confetti {
            animation: none !important;
          }
          
          .backface-hidden {
            transition-duration: 0.1s !important;
          }
        }
      `}</style>
		</div>
	);
}
