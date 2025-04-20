"use client";

import {
	ArrowLeft,
	Eye,
	HelpCircle,
	Image as ImageIcon,
	LayoutTemplate,
	Loader2,
	Pencil,
	Plus,
	Save,
	Tag,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

export default function CreateFlashcard() {
	const router = useRouter();
	const { toast } = useToast();
	const tagInputRef = useRef<HTMLInputElement>(null);

	// Form state
	const [formData, setFormData] = useState({
		question: "",
		answer: "",
		title: "",
		imageUrl: "",
		tags: [] as string[],
		deckId: "",
	});

	// Fetch decks from API
	const { data: decks, isLoading: loadingDecks } =
		api.flashcard.getDecks.useQuery();

	// Form validation errors
	const [errors, setErrors] = useState({
		question: "",
		answer: "",
		imageUrl: "",
	});

	const [tagInput, setTagInput] = useState("");
	const [isImageValid, setIsImageValid] = useState(true);
	const [activeTab, setActiveTab] = useState<string>("edit");
	const [flipCard, setFlipCard] = useState(false);
	const [isNewDeckDialogOpen, setIsNewDeckDialogOpen] = useState(false);
	const [newDeckName, setNewDeckName] = useState("");
	const [newDeckDescription, setNewDeckDescription] = useState("");

	// Check image validity
	useEffect(() => {
		if (formData.imageUrl) {
			const img = new Image();
			img.onload = () => setIsImageValid(true);
			img.onerror = () => setIsImageValid(false);
			img.src = formData.imageUrl;
		}
	}, [formData.imageUrl]);

	// tRPC mutations
	const createFlashcard = api.flashcard.createFlashcard.useMutation({
		onSuccess: () => {
			toast({
				title: "Success!",
				description: "Your flashcard has been created.",
				variant: "default",
			});
			router.push("/flashcards");
		},
		onError: (error) => {
			toast({
				title: "Error",
				description:
					error.message || "Failed to create flashcard. Please try again.",
				variant: "destructive",
			});
		},
	});

	const createDeck = api.flashcard.createDeck.useMutation({
		onSuccess: (newDeck) => {
			if (!newDeck) return;
			
			toast({
				title: "Deck Created!",
				description: `Your deck "${newDeck.name}" has been created.`,
				variant: "default",
			});

			// Update form to select the new deck
			setFormData((prev) => ({
				...prev,
				deckId: newDeck.id,
			}));

			// Reset form fields
			setNewDeckName("");
			setNewDeckDescription("");

			// Close the dialog
			const closeButton = document.querySelector(
				'[data-slot="dialog-close"]',
			) as HTMLElement;
			if (closeButton) closeButton.click();

			// Refetch decks
			utils.flashcard.getDecks.invalidate();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description:
					error.message || "Failed to create deck. Please try again.",
				variant: "destructive",
			});
		},
	});

	// tRPC utils for invalidating queries
	const utils = api.useUtils();

	// Handle input changes
	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));

		// Clear error when user types
		if (errors[name as keyof typeof errors]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	// Handle tag input
	const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && tagInput.trim()) {
			e.preventDefault();
			addTag(tagInput);
		}
	};

	const addTag = (tag: string) => {
		const trimmedTag = tag.trim();
		if (trimmedTag && !formData.tags.includes(trimmedTag)) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, trimmedTag],
			}));
			setTagInput("");
			setTimeout(() => {
				if (tagInputRef.current) {
					tagInputRef.current.focus();
				}
			}, 0);
		}
	};

	const removeTag = (tagToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	};

	// Form validation
	const validateForm = () => {
		const newErrors = {
			question: "",
			answer: "",
			imageUrl: "",
		};

		let isValid = true;

		if (!formData.question.trim()) {
			newErrors.question = "Question is required";
			isValid = false;
		}

		if (!formData.answer.trim()) {
			newErrors.answer = "Answer is required";
			isValid = false;
		}

		// Only validate URL if a value is provided
		if (
			formData.imageUrl &&
			formData.imageUrl.trim() !== "" &&
			!isValidUrl(formData.imageUrl)
		) {
			newErrors.imageUrl = "Please enter a valid URL";
			isValid = false;
		}

		setErrors(newErrors);
		return isValid;
	};

	// Update isValidUrl to be more robust
	const isValidUrl = (url: string) => {
		if (!url || url.trim() === "") return true; // Empty URLs are considered valid
		try {
			new URL(url);
			return true;
		} catch (e) {
			return false;
		}
	};

	// Form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (validateForm()) {
			// Create a submission object, filtering out empty imageUrl
			const submission = {
				question: formData.question,
				answer: formData.answer,
				title: formData.title || undefined,
				tags: formData.tags,
				deckId: formData.deckId || undefined,
			};

			// Only include imageUrl if it's not empty
			if (formData.imageUrl && formData.imageUrl.trim() !== "") {
				Object.assign(submission, { imageUrl: formData.imageUrl });
			}

			createFlashcard.mutate(submission);
		}
	};

	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-secondary/10">
			{/* Enhanced header with pattern background */}
			<div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
				<div className="absolute inset-0 opacity-5">
					<div
						className="absolute inset-0"
						style={{
							backgroundImage:
								"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
							backgroundSize: "30px 30px",
						}}
					/>
				</div>
				<div className="container relative z-10 py-10">
					<div className="flex items-center">
						<Button
							variant="ghost"
							size="icon"
							asChild
							className="mr-4 transition-transform duration-200 hover:scale-105"
						>
							<Link href="/flashcards">
								<ArrowLeft className="h-5 w-5" />
							</Link>
						</Button>
						<div>
							<h1 className="mb-1 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text font-bold text-3xl text-transparent tracking-tight">
								Create New Flashcard
							</h1>
							<p className="max-w-2xl text-muted-foreground">
								Add a new flashcard to your collection to enhance your learning
								experience
							</p>
						</div>
					</div>
				</div>
			</div>

			<main className="container max-w-5xl py-10">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="w-full"
						>
							<TabsList className="mb-4 w-full rounded-lg border bg-background/80 p-1 backdrop-blur-sm">
								<TabsTrigger
									value="edit"
									className="flex flex-1 items-center gap-2 rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
								>
									<Pencil className="h-4 w-4" />
									Edit Content
								</TabsTrigger>
								<TabsTrigger
									value="preview"
									className="flex flex-1 items-center gap-2 rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
								>
									<Eye className="h-4 w-4" />
									Preview
								</TabsTrigger>
							</TabsList>

							<TabsContent value="edit">
								<Card className="border shadow-lg transition-all duration-300 hover:border-primary/20 hover:shadow-xl">
									<form onSubmit={handleSubmit}>
										<CardHeader className="border-b bg-muted/30">
											<CardTitle className="flex items-center">
												<LayoutTemplate className="mr-2 h-5 w-5 text-primary" />
												Flashcard Details
											</CardTitle>
											<CardDescription>
												Fill in the details below to create a new flashcard.
												Questions and answers are required.
											</CardDescription>
										</CardHeader>

										<CardContent className="space-y-8 pt-6">
											{/* Deck Selection */}
											<div className="relative space-y-2">
												<label
													htmlFor="deckId"
													className="group flex items-center font-medium text-sm"
												>
													Deck{" "}
													<span className="ml-1 text-muted-foreground">
														(Optional)
													</span>
													<HelpCircle className="ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100" />
													<span className="pointer-events-none absolute left-full ml-2 w-48 rounded-md bg-popover p-2 text-popover-foreground text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
														Select a deck to add this flashcard to or leave
														blank to add without a deck.
													</span>
												</label>
												<div className="space-y-2">
													<div className="relative">
														<select
															id="deckId"
															name="deckId"
															value={formData.deckId}
															onChange={handleChange}
															className="h-10 w-full rounded-md border border-input bg-background pl-10 text-sm ring-offset-background transition-all file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
														>
															<option value="">
																-- Select a Deck (Optional) --
															</option>
															{loadingDecks ? (
																<option disabled>Loading decks...</option>
															) : decks && decks.length > 0 ? (
																decks.map(
																	(deck: {
																		id: string;
																		name: string;
																		cardCount: number;
																	}) => (
																		<option key={deck.id} value={deck.id}>
																			{deck.name} ({deck.cardCount} cards)
																		</option>
																	),
																)
															) : (
																<option disabled>No decks available</option>
															)}
														</select>
														<LayoutTemplate className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
													</div>

													<Dialog>
														<DialogTrigger asChild>
															<Button
																type="button"
																variant="outline"
																size="sm"
																className="flex w-full items-center justify-center text-primary"
															>
																<Plus className="mr-1 h-3.5 w-3.5" />
																Create New Deck
															</Button>
														</DialogTrigger>
														<DialogContent>
															<DialogHeader>
																<DialogTitle>Create New Deck</DialogTitle>
																<DialogDescription>
																	Create a new flashcard deck to organize your
																	cards
																</DialogDescription>
															</DialogHeader>
															<div className="space-y-4 py-2">
																<div className="space-y-2">
																	<label
																		htmlFor="new-deck-name"
																		className="font-medium text-sm"
																	>
																		Deck Name{" "}
																		<span className="text-destructive">*</span>
																	</label>
																	<Input
																		id="new-deck-name"
																		placeholder="Enter a name for your deck"
																		value={newDeckName}
																		onChange={(e) =>
																			setNewDeckName(e.target.value)
																		}
																	/>
																</div>
																<div className="space-y-2">
																	<label
																		htmlFor="new-deck-description"
																		className="font-medium text-sm"
																	>
																		Description{" "}
																		<span className="text-muted-foreground">
																			(Optional)
																		</span>
																	</label>
																	<Textarea
																		id="new-deck-description"
																		placeholder="Enter a description for your deck"
																		value={newDeckDescription}
																		onChange={(e) =>
																			setNewDeckDescription(e.target.value)
																		}
																		rows={3}
																	/>
																</div>
															</div>
															<DialogFooter>
																<DialogClose asChild>
																	<Button variant="outline" type="button">
																		Cancel
																	</Button>
																</DialogClose>
																<Button
																	type="button"
																	onClick={() => {
																		if (!newDeckName.trim()) {
																			toast({
																				title: "Error",
																				description: "Deck name is required",
																				variant: "destructive",
																			});
																			return;
																		}
																		createDeck.mutate({
																			name: newDeckName,
																			description: newDeckDescription,
																		});
																	}}
																	disabled={createDeck.isPending}
																>
																	{createDeck.isPending
																		? "Creating..."
																		: "Create Deck"}
																</Button>
															</DialogFooter>
														</DialogContent>
													</Dialog>
												</div>
											</div>

											{/* Title (optional) */}
											<div className="relative space-y-2">
												<label
													htmlFor="title"
													className="group flex items-center font-medium text-sm"
												>
													Title{" "}
													<span className="ml-1 text-muted-foreground">
														(Optional)
													</span>
													<HelpCircle className="ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100" />
													<span className="pointer-events-none absolute left-full ml-2 w-48 rounded-md bg-popover p-2 text-popover-foreground text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
														A short title helps you quickly identify this card.
													</span>
												</label>
												<div className="relative">
													<Input
														id="title"
														name="title"
														placeholder="Enter a descriptive title"
														value={formData.title}
														onChange={handleChange}
														className="pl-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
													/>
													<Pencil className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
												</div>
											</div>

											{/* Question */}
											<div className="space-y-2">
												<label
													htmlFor="question"
													className="font-medium text-sm"
												>
													Question <span className="text-destructive">*</span>
												</label>
												<div className="relative">
													<Textarea
														id="question"
														name="question"
														placeholder="Enter the question"
														rows={3}
														value={formData.question}
														onChange={handleChange}
														className={`pl-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 ${
															errors.question
																? "border-destructive focus-visible:ring-destructive/20"
																: ""
														}`}
													/>
													<HelpCircle className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
												</div>
												{errors.question && (
													<p className="flex items-center text-destructive text-sm">
														<X className="mr-1 h-3.5 w-3.5" />
														{errors.question}
													</p>
												)}
											</div>

											{/* Answer */}
											<div className="space-y-2">
												<label htmlFor="answer" className="font-medium text-sm">
													Answer <span className="text-destructive">*</span>
												</label>
												<div className="relative">
													<Textarea
														id="answer"
														name="answer"
														placeholder="Enter the answer"
														rows={5}
														value={formData.answer}
														onChange={handleChange}
														className={`pl-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 ${
															errors.answer
																? "border-destructive focus-visible:ring-destructive/20"
																: ""
														}`}
													/>
													<Pencil className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
												</div>
												{errors.answer && (
													<p className="flex items-center text-destructive text-sm">
														<X className="mr-1 h-3.5 w-3.5" />
														{errors.answer}
													</p>
												)}
											</div>

											{/* Image URL */}
											<div className="space-y-2">
												<label
													htmlFor="imageUrl"
													className="group flex items-center font-medium text-sm"
												>
													Image URL{" "}
													<span className="ml-1 text-muted-foreground">
														(Optional)
													</span>
													<HelpCircle className="ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100" />
													<span className="pointer-events-none absolute w-48 rounded-md bg-popover p-2 text-popover-foreground text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
														Add an image to help illustrate your flashcard.
													</span>
												</label>
												<div className="relative">
													<Input
														id="imageUrl"
														name="imageUrl"
														placeholder="https://example.com/image.jpg"
														value={formData.imageUrl}
														onChange={handleChange}
														className={`pl-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 ${
															errors.imageUrl || !isImageValid
																? "border-destructive focus-visible:ring-destructive/20"
																: ""
														}`}
													/>
													<ImageIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
												</div>
												{errors.imageUrl && (
													<p className="flex items-center text-destructive text-sm">
														<X className="mr-1 h-3.5 w-3.5" />
														{errors.imageUrl}
													</p>
												)}
												{formData.imageUrl &&
													!errors.imageUrl &&
													!isImageValid && (
														<p className="flex items-center text-amber-500 text-sm">
															<HelpCircle className="mr-1 h-3.5 w-3.5" />
															Image could not be loaded. Check the URL and try
															again.
														</p>
													)}
											</div>

											{/* Tags */}
											<div className="space-y-2">
												<label
													htmlFor="tags"
													className="group flex items-center font-medium text-sm"
												>
													Tags{" "}
													<span className="ml-1 text-muted-foreground">
														(Optional)
													</span>
													<HelpCircle className="ml-1.5 h-3.5 w-3.5 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100" />
													<span className="pointer-events-none absolute w-48 rounded-md bg-popover p-2 text-popover-foreground text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
														Tags help you organize and find your flashcards more
														easily.
													</span>
												</label>
												<div className="mb-2 rounded-md bg-muted/50 p-3">
													<div className="mb-2 flex min-h-8 flex-wrap gap-1.5">
														{formData.tags.length === 0 && (
															<span className="text-muted-foreground text-xs italic">
																No tags added yet
															</span>
														)}
														{formData.tags.map((tag) => (
															<span
																key={tag}
																className="group inline-flex items-center rounded-md bg-primary/15 px-2.5 py-0.5 font-medium text-primary text-xs transition-colors hover:bg-primary/20"
															>
																<Tag className="mr-1 h-3 w-3 opacity-70 group-hover:opacity-100" />
																{tag}
																<button
																	type="button"
																	onClick={() => removeTag(tag)}
																	className="ml-1.5 rounded-full p-0.5 text-primary transition-colors hover:bg-primary/80 hover:text-primary-foreground"
																	aria-label={`Remove tag ${tag}`}
																>
																	<X className="h-3 w-3" />
																</button>
															</span>
														))}
													</div>
													<div className="relative flex">
														<Input
															id="tagInput"
															ref={tagInputRef}
															placeholder="Add tags and press Enter"
															value={tagInput}
															onChange={(e) => setTagInput(e.target.value)}
															onKeyDown={handleTagInputKeyDown}
															className="pl-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
														/>
														<Tag className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
														<Button
															type="button"
															size="sm"
															variant="ghost"
															className="-translate-y-1/2 absolute top-1/2 right-2 h-6 px-2 text-primary text-xs hover:bg-primary/80 hover:text-primary-foreground"
															onClick={() => addTag(tagInput)}
															disabled={!tagInput.trim()}
														>
															<Plus className="mr-1 h-3 w-3" />
															Add
														</Button>
													</div>
												</div>
											</div>
										</CardContent>

										<CardFooter className="flex justify-between border-t bg-muted/30 p-6">
											<Button
												variant="outline"
												type="button"
												asChild
												className="transition-all duration-200 hover:bg-background"
											>
												<Link href="/flashcards">Cancel</Link>
											</Button>
											<Button
												type="submit"
												disabled={createFlashcard.isPending}
												className="flex items-center gap-2 bg-primary shadow-sm transition-all hover:bg-primary/90 hover:shadow"
											>
												{createFlashcard.isPending ? (
													<>
														<Loader2 className="h-4 w-4 animate-spin" />
														Creating...
													</>
												) : (
													<>
														<Save className="h-4 w-4" />
														Create Flashcard
													</>
												)}
											</Button>
										</CardFooter>
									</form>
								</Card>
							</TabsContent>

							<TabsContent value="preview">
								<div className="flex flex-col space-y-6">
									<div className="rounded-lg border bg-muted/30 p-4 shadow">
										<h3 className="mb-2 flex items-center font-medium text-lg">
											<Eye className="mr-2 h-5 w-5 text-primary" />
											Flashcard Preview
										</h3>
										<p className="mb-4 text-muted-foreground text-sm">
											This is how your flashcard will look. Click the card to
											flip between question and answer.
										</p>

										{/* Flashcard Preview */}
										<div className="perspective-[1000px] mx-auto h-64 w-full max-w-md cursor-pointer">
											<button
												type="button"
												className={`transform-style-3d relative h-full w-full text-left transition-all duration-500 ${
													flipCard ? "rotate-y-180" : ""
												}`}
												onClick={() => setFlipCard(!flipCard)}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														setFlipCard(!flipCard);
													}
												}}
												aria-label="Flip flashcard"
											>
												{/* Question Side */}
												<div className="backface-hidden absolute inset-0 flex flex-col rounded-xl border-2 border-primary/10 bg-card p-6 shadow-lg">
													{formData.title && (
														<div className="mb-2 border-b pb-2 font-medium text-muted-foreground text-sm">
															{formData.title}
														</div>
													)}

													<div className="flex flex-1 flex-col items-center justify-center">
														{formData.imageUrl && isImageValid && (
															<div className="mb-4 flex max-h-24 justify-center">
																<img
																	src={formData.imageUrl}
																	alt="Flashcard illustration"
																	className="max-h-full rounded-md object-contain"
																/>
															</div>
														)}

														<div className="text-center">
															{formData.question ? (
																<p className="text-lg">{formData.question}</p>
															) : (
																<p className="text-muted-foreground italic">
																	Your question will appear here
																</p>
															)}
														</div>
													</div>

													{formData.tags.length > 0 && (
														<div className="mt-4 flex flex-wrap gap-1 border-t pt-2">
															{formData.tags.map((tag) => (
																<span
																	key={tag}
																	className="rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs"
																>
																	{tag}
																</span>
															))}
														</div>
													)}

													<div className="absolute right-2 bottom-2 text-muted-foreground text-xs">
														Click to flip
													</div>
												</div>

												{/* Answer Side */}
												<div className="backface-hidden absolute inset-0 flex rotate-y-180 flex-col rounded-xl border-2 border-primary/20 bg-primary/5 p-6 shadow-lg">
													{formData.title && (
														<div className="mb-2 border-b pb-2 font-medium text-muted-foreground text-sm">
															{formData.title}
														</div>
													)}

													<div className="flex flex-1 flex-col justify-center">
														<div className="text-center">
															{formData.answer ? (
																<p className="text-lg">{formData.answer}</p>
															) : (
																<p className="text-muted-foreground italic">
																	Your answer will appear here
																</p>
															)}
														</div>
													</div>

													<div className="absolute right-2 bottom-2 text-muted-foreground text-xs">
														Click to flip
													</div>
												</div>
											</button>
										</div>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</div>

					{/* Tips and Help Section */}
					<div className="lg:col-span-1">
						<Card className="sticky top-6 border shadow">
							<CardHeader className="border-b bg-primary/5">
								<CardTitle className="flex items-center text-lg">
									<HelpCircle className="mr-2 h-5 w-5 text-primary" />
									Tips for Great Flashcards
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<ul className="space-y-4 text-sm">
									<li className="flex gap-2">
										<div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
											<span className="font-medium text-primary text-xs">
												1
											</span>
										</div>
										<div>
											<p className="mb-0.5 font-medium">
												Keep questions specific
											</p>
											<p className="text-muted-foreground text-xs">
												Focus on one concept per flashcard for better retention.
											</p>
										</div>
									</li>
									<li className="flex gap-2">
										<div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
											<span className="font-medium text-primary text-xs">
												2
											</span>
										</div>
										<div>
											<p className="mb-0.5 font-medium">Include visual aids</p>
											<p className="text-muted-foreground text-xs">
												Images can improve memory and understanding of complex
												topics.
											</p>
										</div>
									</li>
									<li className="flex gap-2">
										<div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
											<span className="font-medium text-primary text-xs">
												3
											</span>
										</div>
										<div>
											<p className="mb-0.5 font-medium">
												Be concise with answers
											</p>
											<p className="text-muted-foreground text-xs">
												Concise answers are easier to recall during study
												sessions.
											</p>
										</div>
									</li>
									<li className="flex gap-2">
										<div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
											<span className="font-medium text-primary text-xs">
												4
											</span>
										</div>
										<div>
											<p className="mb-0.5 font-medium">Use tags effectively</p>
											<p className="text-muted-foreground text-xs">
												Organize your flashcards with relevant tags for easy
												filtering.
											</p>
										</div>
									</li>

									<li className="flex gap-2">
										<div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
											<span className="font-medium text-primary text-xs">
												5
											</span>
										</div>
										<div>
											<p className="mb-0.5 font-medium">Organize into decks</p>
											<p className="text-muted-foreground text-xs">
												Group related flashcards into decks to study them
												together.
											</p>
										</div>
									</li>
								</ul>

								<div className="mt-6 border-t pt-4">
									<h4 className="mb-2 font-medium text-sm">Example Formats:</h4>
									<div className="space-y-2 text-muted-foreground text-xs">
										<p>
											<span className="font-medium text-foreground">
												Definition:
											</span>{" "}
											"What is CPR?" → "Cardiopulmonary Resuscitation, an
											emergency procedure..."
										</p>
										<p>
											<span className="font-medium text-foreground">
												Procedure:
											</span>{" "}
											"List steps for checking vital signs" → "1. Check
											breathing, 2. Check pulse..."
										</p>
										<p>
											<span className="font-medium text-foreground">
												Identification:
											</span>{" "}
											"How do you identify a stroke?" → "Use the FAST method:
											Face, Arms, Speech, Time"
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
