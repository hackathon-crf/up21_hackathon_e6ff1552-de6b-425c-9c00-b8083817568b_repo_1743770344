"use client";

import { format } from "date-fns";
import {
	ArrowLeft,
	Download,
	Edit,
	Loader2,
	Plus,
	Search,
	Trash2,
	Upload,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

// Define the Flashcard type to avoid type errors
type Flashcard = {
	id: string;
	userId: string;
	deckId: string | null;
	question: string;
	answer: string;
	title: string | null;
	imageUrl: string | null;
	createdAt: Date;
	lastReview: Date | null;
	nextReview: Date | null;
	easeFactor: number | null;
	repetitions: number | null;
	aiGenerated: boolean;
	deck?: { name: string; } | null;
	deckName?: string;
	// Make updatedAt optional since it might be missing
	updatedAt?: Date | null;
}

export default function ManageDeckPage({
	params,
}: { params: { deck: string } }) {
	const { toast } = useToast();
	const [searchTerm, setSearchTerm] = useState("");
	const [newQuestion, setNewQuestion] = useState("");
	const [newAnswer, setNewAnswer] = useState("");
	const [newTitle, setNewTitle] = useState("");
	const [newImageUrl, setNewImageUrl] = useState("");
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentEditCard, setCurrentEditCard] = useState<string | null>(null);
	const [deckName, setDeckName] = useState("");
	const [deckDescription, setDeckDescription] = useState("");
	const [cardsPerSession, setCardsPerSession] = useState("20");

	// Fetch deck information
	const { data: deck, isPending: deckLoading } =
		api.flashcard.getDeckById.useQuery({
			id: params.deck,
		});

	// Update state when deck data is received
	useEffect(() => {
		if (deck) {
			setDeckName(deck.name);
			setDeckDescription(deck.description || "");
		}
	}, [deck]);

	// Error handling for deck loading
	const handleDeckError = (error: unknown) => {
		const errorMessage = error instanceof Error ? error.message : "Failed to load deck information";
		toast({
			title: "Error",
			description: errorMessage,
			variant: "destructive",
		});
	};

	// Fetch flashcards for this specific deck
	const {
		data: flashcards,
		isPending: cardsLoading,
		refetch: refetchCards,
		error: flashcardsError,
	} = api.flashcard.getFlashcards.useQuery({
		deckId: params.deck,
	});

	// Handle error if flashcards query fails
	useEffect(() => {
		if (flashcardsError) {
			handleDeckError(flashcardsError);
		}
	}, [flashcardsError]);

	// Mutations for flashcard operations
	const createFlashcard = api.flashcard.createFlashcard.useMutation({
		onSuccess: () => {
			toast({
				title: "Card added",
				description: "Your flashcard has been added to the deck",
			});
			setNewQuestion("");
			setNewAnswer("");
			setNewTitle("");
			setNewImageUrl("");
			refetchCards();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message || "Failed to create flashcard",
				variant: "destructive",
			});
		},
	});

	const updateDeck = api.flashcard.updateDeck.useMutation({
		onSuccess: () => {
			toast({
				title: "Settings saved",
				description: "Deck settings have been updated",
			});
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update deck settings",
				variant: "destructive",
			});
		},
	});

	const deleteFlashcard = api.flashcard.deleteFlashcard.useMutation({
		onSuccess: () => {
			toast({
				title: "Card deleted",
				description: "Your flashcard has been removed from the deck",
			});
			refetchCards();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message || "Failed to delete flashcard",
				variant: "destructive",
			});
		},
	});

	const updateFlashcard = api.flashcard.updateFlashcard.useMutation({
		onSuccess: () => {
			toast({
				title: "Card updated",
				description: "Your flashcard has been updated",
			});
			setCurrentEditCard(null);
			setEditDialogOpen(false);
			refetchCards();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update flashcard",
				variant: "destructive",
			});
		},
	});

	// Format the deck name for display
	const formatDeckName = (name: string) => {
		if (deck) return deck.name;

		// Fallback if deck data isn't loaded yet
		return name
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	// Filter cards based on search term
	const filteredCards = flashcards?.filter(
		(card) =>
			card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
			card.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
			card.title?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleAddCard = () => {
		if (!newQuestion.trim() || !newAnswer.trim()) {
			toast({
				title: "Error",
				description: "Question and answer cannot be empty",
				variant: "destructive",
			});
			return;
		}

		createFlashcard.mutate({
			question: newQuestion,
			answer: newAnswer,
			title: newTitle || undefined,
			imageUrl: newImageUrl || undefined,
			deckId: params.deck,
		});
	};

	const handleDeleteCard = (id: string) => {
		deleteFlashcard.mutate({ id });
	};

	const handleEditCard = (card: Flashcard) => {
		setCurrentEditCard(card.id);
		setNewQuestion(card.question);
		setNewAnswer(card.answer);
		setNewTitle(card.title || "");
		setNewImageUrl(card.imageUrl || "");
		setEditDialogOpen(true);
	};

	const handleUpdateCard = () => {
		if (!currentEditCard) return;

		if (!newQuestion.trim() || !newAnswer.trim()) {
			toast({
				title: "Error",
				description: "Question and answer cannot be empty",
				variant: "destructive",
			});
			return;
		}

		updateFlashcard.mutate({
			id: currentEditCard,
			question: newQuestion,
			answer: newAnswer,
			title: newTitle || undefined,
			imageUrl: newImageUrl || undefined,
		});
	};

	const handleSaveSettings = () => {
		updateDeck.mutate({
			id: params.deck,
			name: deckName,
			description: deckDescription,
		});
	};

	// Calculate difficulty based on SRS data
	const calculateDifficulty = (card: Flashcard) => {
		if (!card.easeFactor) return "Medium";
		if (card.easeFactor < 1.5) return "Hard";
		if (card.easeFactor > 2.5) return "Easy";
		return "Medium";
	};

	const handleGenerateAI = () => {
		// In a real app, this would generate cards using AI
		toast({
			title: "AI generation started",
			description: "Generating new flashcards based on your settings",
		});
	};

	const isPending = deckLoading || cardsLoading;

	return (
		<div className="flex min-h-screen flex-col">
			<div className="border-b">
				<div className="flex h-16 items-center px-6">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/flashcards">
							<ArrowLeft className="h-4 w-4" />
							<span className="sr-only">Back to decks</span>
						</Link>
					</Button>
					<div className="ml-4 flex-1">
						<h1 className="font-bold text-2xl">
							{isPending ? "Loading..." : formatDeckName(params.deck)}
						</h1>
						<p className="text-muted-foreground text-sm">
							Manage your flashcards
						</p>
					</div>
				</div>
			</div>

			<main className="flex-1 p-6">
				{isPending ? (
					<div className="flex h-full items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-primary/70" />
					</div>
				) : (
					<Tabs defaultValue="cards" className="space-y-4">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<TabsList>
								<TabsTrigger value="cards">Cards</TabsTrigger>
								<TabsTrigger value="statistics">Statistics</TabsTrigger>
								<TabsTrigger value="settings">Settings</TabsTrigger>
							</TabsList>

							<div className="flex gap-2">
								<Dialog>
									<DialogTrigger asChild>
										<Button>
											<Plus className="mr-2 h-4 w-4" />
											Add Card
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Add New Flashcard</DialogTitle>
											<DialogDescription>
												Create a new flashcard for your{" "}
												{formatDeckName(params.deck)} deck
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<div className="space-y-2">
												<Label htmlFor="title">Title (Optional)</Label>
												<Input
													id="title"
													placeholder="Enter an optional title for the card"
													value={newTitle}
													onChange={(e) => setNewTitle(e.target.value)}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="question">Question</Label>
												<Textarea
													id="question"
													placeholder="Enter your question here"
													value={newQuestion}
													onChange={(e) => setNewQuestion(e.target.value)}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="answer">Answer</Label>
												<Textarea
													id="answer"
													placeholder="Enter the answer here"
													value={newAnswer}
													onChange={(e) => setNewAnswer(e.target.value)}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="imageUrl">Image URL (Optional)</Label>
												<Input
													id="imageUrl"
													placeholder="https://example.com/image.jpg"
													value={newImageUrl}
													onChange={(e) => setNewImageUrl(e.target.value)}
												/>
											</div>
										</div>
										<DialogFooter>
											<DialogClose asChild>
												<Button variant="outline">Cancel</Button>
											</DialogClose>
											<Button
												onClick={handleAddCard}
												disabled={createFlashcard.isPending}
											>
												{createFlashcard.isPending ? "Adding..." : "Add Card"}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>

								<Dialog>
									<DialogTrigger asChild>
										<Button variant="outline">
											<Upload className="mr-2 h-4 w-4" />
											Import
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Import Flashcards</DialogTitle>
											<DialogDescription>
												Upload a CSV or JSON file to import flashcards
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<div className="rounded-lg border-2 border-dashed p-6 text-center">
												<Upload className="mx-auto h-8 w-8 text-muted-foreground" />
												<p className="mt-2 font-medium text-sm">
													Drag and drop your file here, or click to browse
												</p>
												<p className="mt-1 text-muted-foreground text-xs">
													Supports CSV and JSON formats
												</p>
												<Input
													type="file"
													className="hidden"
													accept=".csv,.json"
												/>
											</div>
										</div>
										<DialogFooter>
											<Button variant="outline">Cancel</Button>
											<Button>Import Cards</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>

								<Button variant="outline">
									<Download className="mr-2 h-4 w-4" />
									Export
								</Button>
							</div>
						</div>

						{/* Edit Card Dialog */}
						<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Edit Flashcard</DialogTitle>
									<DialogDescription>
										Update your flashcard details
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div className="space-y-2">
										<Label htmlFor="edit-title">Title (Optional)</Label>
										<Input
											id="edit-title"
											placeholder="Enter an optional title for the card"
											value={newTitle}
											onChange={(e) => setNewTitle(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="edit-question">Question</Label>
										<Textarea
											id="edit-question"
											placeholder="Enter your question here"
											value={newQuestion}
											onChange={(e) => setNewQuestion(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="edit-answer">Answer</Label>
										<Textarea
											id="edit-answer"
											placeholder="Enter the answer here"
											value={newAnswer}
											onChange={(e) => setNewAnswer(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="edit-imageUrl">Image URL (Optional)</Label>
										<Input
											id="edit-imageUrl"
											placeholder="https://example.com/image.jpg"
											value={newImageUrl}
											onChange={(e) => setNewImageUrl(e.target.value)}
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setEditDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button
										onClick={handleUpdateCard}
										disabled={updateFlashcard.isPending}
									>
										{updateFlashcard.isPending ? "Updating..." : "Update Card"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						<TabsContent value="cards" className="space-y-4">
							<div className="flex items-center">
								<div className="relative max-w-sm flex-1">
									<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										type="search"
										placeholder="Search cards..."
										className="pl-8"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
							</div>

							<Card>
								<CardContent className="p-0">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Question</TableHead>
												<TableHead>Answer</TableHead>
												<TableHead>Last Reviewed</TableHead>
												<TableHead>Next Review</TableHead>
												<TableHead>Difficulty</TableHead>
												<TableHead className="w-[100px]">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredCards && filteredCards.length > 0 ? (
												filteredCards.map((card) => (
													<TableRow key={card.id}>
														<TableCell className="font-medium">
															{card.title ? <strong>{card.title}:</strong> : ""}{" "}
															{card.question}
														</TableCell>
														<TableCell>{card.answer}</TableCell>
														<TableCell>
															{card.lastReview
																? format(
																		new Date(card.lastReview),
																		"MMM d, yyyy",
																	)
																: "Not reviewed yet"}
														</TableCell>
														<TableCell>
															{card.nextReview
																? format(
																		new Date(card.nextReview),
																		"MMM d, yyyy",
																	)
																: "Not scheduled"}
														</TableCell>
														<TableCell>
															<span
																className={`rounded-full px-2 py-1 font-medium text-xs ${
																	calculateDifficulty(card) === "Easy"
																		? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
																		: calculateDifficulty(card) === "Medium"
																			? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
																			: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
																}`}
															>
																{calculateDifficulty(card)}
															</span>
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-2">
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => handleEditCard(card)}
																>
																	<Edit className="h-4 w-4" />
																	<span className="sr-only">Edit</span>
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => handleDeleteCard(card.id)}
																	disabled={deleteFlashcard.isPending}
																>
																	<Trash2 className="h-4 w-4" />
																	<span className="sr-only">Delete</span>
																</Button>
															</div>
														</TableCell>
													</TableRow>
												))
											) : (
												<TableRow>
													<TableCell colSpan={6} className="py-4 text-center">
														{cardsLoading
															? "Loading cards..."
															: searchTerm
																? "No cards match your search term."
																: "No cards found in this deck. Add new cards to get started."}
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="statistics" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								<Card>
									<CardHeader>
										<CardTitle>Learning Progress</CardTitle>
										<CardDescription>
											Overall mastery of this deck
										</CardDescription>
									</CardHeader>
									<CardContent className="pb-2">
										<div className="font-bold text-3xl">
											{filteredCards && filteredCards.length > 0
												? `${Math.floor(
														(filteredCards.filter(
															(card) =>
																card.repetitions && card.repetitions > 1,
														).length /
															filteredCards.length) *
															100,
													)}%`
												: "0%"}
										</div>
										<p className="text-muted-foreground text-xs">
											Based on card repetition data
										</p>
										<div className="mt-4 space-y-2">
											{filteredCards && (
												<>
													<div className="space-y-1">
														<div className="flex items-center justify-between text-sm">
															<span>Mastered</span>
															<span className="font-medium">
																{
																	filteredCards.filter(
																		(card) =>
																			card.repetitions && card.repetitions > 2,
																	).length
																}{" "}
																cards
															</span>
														</div>
														<div className="h-2 overflow-hidden rounded-full bg-muted">
															<div
																className="h-full bg-green-500"
																style={{
																	width: `${
																		filteredCards.length
																			? (
																					filteredCards.filter(
																						(card) =>
																							card.repetitions &&
																							card.repetitions > 2,
																					).length / filteredCards.length
																				) * 100
																			: 0
																	}%`,
																}}
															/>
														</div>
													</div>
													<div className="space-y-1">
														<div className="flex items-center justify-between text-sm">
															<span>Learning</span>
															<span className="font-medium">
																{
																	filteredCards.filter(
																		(card) =>
																			card.repetitions &&
																			card.repetitions > 0 &&
																			card.repetitions <= 2,
																	).length
																}{" "}
																cards
															</span>
														</div>
														<div className="h-2 overflow-hidden rounded-full bg-muted">
															<div
																className="h-full bg-yellow-500"
																style={{
																	width: `${
																		filteredCards.length
																			? (
																					filteredCards.filter(
																						(card) =>
																							card.repetitions &&
																							card.repetitions > 0 &&
																							card.repetitions <= 2,
																					).length / filteredCards.length
																				) * 100
																			: 0
																	}%`,
																}}
															/>
														</div>
													</div>
													<div className="space-y-1">
														<div className="flex items-center justify-between text-sm">
															<span>Not Started</span>
															<span className="font-medium">
																{
																	filteredCards.filter(
																		(card) =>
																			!card.repetitions ||
																			card.repetitions === 0,
																	).length
																}{" "}
																cards
															</span>
														</div>
														<div className="h-2 overflow-hidden rounded-full bg-muted">
															<div
																className="h-full bg-red-500"
																style={{
																	width: `${
																		filteredCards.length
																			? (
																					filteredCards.filter(
																						(card) =>
																							!card.repetitions ||
																							card.repetitions === 0,
																					).length / filteredCards.length
																				) * 100
																			: 0
																	}%`,
																}}
															/>
														</div>
													</div>
												</>
											)}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Cards Overview</CardTitle>
										<CardDescription>Summary of your deck</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium text-sm">Total Cards</p>
												</div>
												<div className="font-bold text-2xl">
													{filteredCards?.length || 0}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium text-sm">Due Today</p>
												</div>
												<div className="font-bold text-2xl">
													{filteredCards?.filter((card) => {
														if (!card.nextReview) return true; // New cards are due
														const nextReview = new Date(card.nextReview);
														const today = new Date();
														return nextReview <= today;
													}).length || 0}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium text-sm">Average Ease</p>
												</div>
												<div className="font-bold text-2xl">
													{filteredCards &&
													filteredCards.length > 0 &&
													filteredCards.some((card) => card.easeFactor)
														? (
																filteredCards.reduce(
																	(sum, card) => sum + (card.easeFactor || 2.5),
																	0,
																) / filteredCards.length
															).toFixed(1)
														: "N/A"}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Review Forecast</CardTitle>
										<CardDescription>Upcoming card reviews</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium text-sm">Today</p>
													<p className="text-muted-foreground text-xs">
														{format(new Date(), "MMM d, yyyy")}
													</p>
												</div>
												<div className="font-bold text-2xl">
													{filteredCards?.filter((card) => {
														if (!card.nextReview) return true;
														const nextReview = new Date(card.nextReview);
														const today = new Date();
														return nextReview <= today;
													}).length || 0}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium text-sm">Tomorrow</p>
													<p className="text-muted-foreground text-xs">
														{format(
															new Date(Date.now() + 24 * 60 * 60 * 1000),
															"MMM d, yyyy",
														)}
													</p>
												</div>
												<div className="font-bold text-2xl">
													{filteredCards?.filter((card) => {
														if (!card.nextReview) return false;
														const nextReview = new Date(card.nextReview);
														const today = new Date();
														const tomorrow = new Date(today);
														tomorrow.setDate(today.getDate() + 1);
														tomorrow.setHours(23, 59, 59, 999);
														return nextReview > today && nextReview <= tomorrow;
													}).length || 0}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium text-sm">This Week</p>
													<p className="text-muted-foreground text-xs">
														Next 7 days
													</p>
												</div>
												<div className="font-bold text-2xl">
													{filteredCards?.filter((card) => {
														if (!card.nextReview) return false;
														const nextReview = new Date(card.nextReview);
														const today = new Date();
														const nextWeek = new Date(today);
														nextWeek.setDate(today.getDate() + 7);
														return nextReview > today && nextReview <= nextWeek;
													}).length || 0}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="settings" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Deck Settings</CardTitle>
									<CardDescription>
										Configure your flashcard deck
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="deck-name">Deck Name</Label>
										<Input
											id="deck-name"
											value={deckName}
											onChange={(e) => setDeckName(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="deck-description">Description</Label>
										<Textarea
											id="deck-description"
											value={deckDescription}
											onChange={(e) => setDeckDescription(e.target.value)}
											placeholder="Enter a description for your deck"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="cards-per-session">
											Cards per study session
										</Label>
										<select
											id="cards-per-session"
											className="w-full rounded-md border border-input bg-background px-3 py-2"
											value={cardsPerSession}
											onChange={(e) => setCardsPerSession(e.target.value)}
										>
											<option value="10">10 cards</option>
											<option value="20">20 cards</option>
											<option value="30">30 cards</option>
											<option value="50">50 cards</option>
											<option value="0">All cards</option>
										</select>
									</div>
								</CardContent>
								<CardFooter>
									<Button
										onClick={handleSaveSettings}
										disabled={updateDeck.isPending}
									>
										{updateDeck.isPending ? "Saving..." : "Save Settings"}
									</Button>
								</CardFooter>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>AI Generation</CardTitle>
									<CardDescription>
										Generate flashcards using AI
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="ai-source">Source Material</Label>
										<Textarea
											id="ai-source"
											placeholder="Paste text or provide a topic for AI to generate flashcards from"
											className="min-h-[100px]"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="ai-cards">
											Number of cards to generate
										</Label>
										<select
											id="ai-cards"
											className="w-full rounded-md border border-input bg-background px-3 py-2"
										>
											<option value="5">5 cards</option>
											<option value="10" selected>
												10 cards
											</option>
											<option value="15">15 cards</option>
											<option value="20">20 cards</option>
										</select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="ai-difficulty">Difficulty level</Label>
										<select
											id="ai-difficulty"
											className="w-full rounded-md border border-input bg-background px-3 py-2"
										>
											<option value="beginner">Beginner</option>
											<option value="intermediate" selected>
												Intermediate
											</option>
											<option value="advanced">Advanced</option>
										</select>
									</div>
								</CardContent>
								<CardFooter>
									<Button onClick={handleGenerateAI}>Generate Cards</Button>
								</CardFooter>
							</Card>
						</TabsContent>
					</Tabs>
				)}
			</main>
		</div>
	);
}
