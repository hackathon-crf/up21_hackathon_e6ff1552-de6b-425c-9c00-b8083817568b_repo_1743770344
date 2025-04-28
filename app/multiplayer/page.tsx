"use client";

import { Crown, Gamepad2, QrCode, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardHeader } from "~/components/dashboard-header";
import QRCodeModal from "~/components/qr-code-modal";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/hooks/use-toast";

export default function MultiplayerPage() {
	return <MultiplayerContent />;
}

function MultiplayerContent() {
	const router = useRouter();
	const { toast } = useToast();
	const [gameCode, setGameCode] = useState("");
	const [isJoining, setIsJoining] = useState(false);
	const [creatingGameType, setCreatingGameType] = useState<string | null>(null);
	const [showQRCode, setShowQRCode] = useState(false);
	const [createdGameData, setCreatedGameData] = useState<{
		code: string;
		id: number | string;
	} | null>(null);
	const baseUrl =
		typeof window !== "undefined"
			? `${window.location.protocol}//${window.location.host}`
			: "";

	const handleJoinGame = async () => {
		if (!gameCode.trim()) {
			toast({
				title: "Error",
				description: "Please enter a game code",
				variant: "destructive",
			});
			return;
		}

		try {
			setIsJoining(true);

			toast({
				title: "Joining session",
				description: `Connecting to training session ${gameCode}...`,
			});

			const response = await fetch("/api/multiplayer/join", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					code: gameCode.trim(),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to join game");
			}

			// Redirect to the lobby page
			router.push(`/multiplayer/lobby/${data.id}`);
		} catch (error) {
			console.error("Error joining game:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Invalid game code",
				variant: "destructive",
			});
		} finally {
			setIsJoining(false);
		}
	};

	// Check for QR code join parameter in URL
	useEffect(() => {
		// Get the URL parameters
		const params = new URLSearchParams(window.location.search);
		const joinCode = params.get("join");

		if (joinCode) {
			setGameCode(joinCode);

			// Auto-join with a slight delay to ensure the component is fully loaded
			const timer = setTimeout(() => {
				handleJoinGame();
				// Remove the parameter from URL to prevent repeated joins on refresh
				router.replace("/multiplayer");
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [router, toast, gameCode, setGameCode, handleJoinGame]);

	const handleCopyCode = (code: string) => {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			navigator.clipboard.writeText(code);
			toast({
				title: "Game code copied",
				description:
					"Share this code with your team to join the training session",
			});
		}
	};

	const handleCreateGame = async (mode: string, showQR = false) => {
		try {
			setCreatingGameType(mode);

			const response = await fetch("/api/multiplayer", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title:
						mode === "Rapid Response"
							? "Rapid Response Challenge"
							: "Card Clash Challenge",
					mode: mode.toLowerCase().replace(" ", "-"),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to create game");
			}

			toast({
				title: `${mode} created`,
				description: `Your session has been created with code: ${data.code}`,
			});

			if (showQR) {
				// Store the created game data and show QR code
				setCreatedGameData({ code: data.code, id: data.id });
				setShowQRCode(true);
				// Don't redirect immediately, let user share QR code first
			} else {
				// Redirect to the lobby page immediately
				router.push(`/multiplayer/lobby/${data.id}`);
			}
		} catch (error) {
			console.error("Error creating game:", error);
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to create game",
				variant: "destructive",
			});
		} finally {
			setCreatingGameType(null);
		}
	};

	// Handle continuing to lobby after showing QR code
	const continueToLobby = () => {
		if (createdGameData) {
			setShowQRCode(false);
			router.push(`/multiplayer/lobby/${createdGameData.id}`);
		}
	};

	return (
		<div className="flex min-h-screen flex-col">
			<DashboardHeader
				title="Multiplayer"
				description="Challenge your team and test your first aid knowledge together"
			/>

			{/* QR Code Modal */}
			{createdGameData && (
				<QRCodeModal
					open={showQRCode}
					onOpenChange={(open) => {
						setShowQRCode(open);
						if (!open) continueToLobby();
					}}
					baseUrl={baseUrl}
					gameCode={createdGameData.code}
					lobbyId={createdGameData.id}
				/>
			)}

			<main className="flex-1 p-6">
				<Tabs defaultValue="join" className="mx-auto max-w-4xl">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="join">Join Session</TabsTrigger>
						<TabsTrigger value="create">Create Session</TabsTrigger>
					</TabsList>

					<TabsContent value="join" className="mt-6 space-y-4">
						<Card className="p-4 px-0">
							<CardHeader>
								<CardTitle>Join an Existing Session</CardTitle>
								<CardDescription>
									Enter a session code to join a training activity with your
									team
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Input
										placeholder="Enter 6-character session code"
										value={gameCode}
										onChange={(e) => setGameCode(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleJoinGame();
											}
										}}
									/>
									<p className="mt-2 text-muted-foreground text-xs">
										Ask the session host for the code. Codes are 6 characters
										long and contain only uppercase letters and numbers.
									</p>
								</div>
							</CardContent>
							<CardFooter>
								<Button
									className="w-full"
									onClick={handleJoinGame}
									disabled={isJoining}
								>
									{isJoining ? (
										<>
											<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
											Joining...
										</>
									) : (
										<>
											<Gamepad2 className="mr-2 h-4 w-4" />
											Join Session
										</>
									)}
								</Button>
							</CardFooter>
						</Card>

						<Card className="p-4 px-0">
							<CardHeader>
								<CardTitle>Recent Sessions</CardTitle>
								<CardDescription>
									Your recently played training sessions
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="rounded-full bg-primary/10 p-2">
												<Crown className="h-4 w-4 text-primary" />
											</div>
											<div>
												<p className="font-medium text-sm">
													CPR & AED Challenge
												</p>
												<p className="text-muted-foreground text-xs">
													Yesterday at 3:45 PM • 5 participants • Rapid Response
												</p>
											</div>
										</div>
										<Button size="sm" variant="outline">
											Results
										</Button>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="rounded-full bg-primary/10 p-2">
												<Users className="h-4 w-4 text-primary" />
											</div>
											<div>
												<p className="font-medium text-sm">First Aid Basics</p>
												<p className="text-muted-foreground text-xs">
													3 days ago • 3 participants • Card Clash
												</p>
											</div>
										</div>
										<Button size="sm" variant="outline">
											Results
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="create" className="mt-6 space-y-4">
						<div className="grid gap-6 md:grid-cols-2">
							<Card>
								<CardHeader>
									<div className="flex items-center gap-3">
										<div className="rounded-full bg-primary/10 p-2">
											<Gamepad2 className="h-5 w-5 text-primary" />
										</div>
										<CardTitle>Rapid Response</CardTitle>
									</div>
									<CardDescription>
										Fast-paced challenge with real-time scoring based on speed
										and accuracy
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="rounded-lg border bg-muted/50 p-4">
											<div className="flex items-center">
												<div>
													<p className="font-medium text-sm">Session Details</p>
													<p className="mt-1 text-muted-foreground text-sm">
														A unique game code will be generated when you create
														this session
													</p>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
								<CardFooter className="flex flex-col gap-2">
									<Button
										className="w-full"
										onClick={() => handleCreateGame("Rapid Response")}
										disabled={creatingGameType !== null}
									>
										{creatingGameType === "Rapid Response" ? (
											<>
												<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
												Creating session...
											</>
										) : (
											<>Create & Host Rapid Response</>
										)}
									</Button>

									<Button
										variant="outline"
										className="w-full"
										onClick={() => handleCreateGame("Rapid Response", true)}
										disabled={creatingGameType !== null}
									>
										<QrCode className="mr-2 h-4 w-4" />
										Create with QR Code
									</Button>
								</CardFooter>
							</Card>

							<Card>
								<CardHeader>
									<div className="flex items-center gap-3">
										<div className="rounded-full bg-primary/10 p-2">
											<Users className="h-5 w-5 text-primary" />
										</div>
										<CardTitle>Card Clash</CardTitle>
									</div>
									<CardDescription>
										Team-based flashcard challenge where teams compete to answer
										correctly
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="rounded-lg border bg-muted/50 p-4">
											<div className="flex items-center">
												<div>
													<p className="font-medium text-sm">Session Details</p>
													<p className="mt-1 text-muted-foreground text-sm">
														A unique game code will be generated when you create
														this session
													</p>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
								<CardFooter className="flex flex-col gap-2">
									<Button
										className="w-full"
										onClick={() => handleCreateGame("Card Clash")}
										disabled={creatingGameType !== null}
									>
										{creatingGameType === "Card Clash" ? (
											<>
												<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
												Creating session...
											</>
										) : (
											<>Create & Host Card Clash</>
										)}
									</Button>

									<Button
										variant="outline"
										className="w-full"
										onClick={() => handleCreateGame("Card Clash", true)}
										disabled={creatingGameType !== null}
									>
										<QrCode className="mr-2 h-4 w-4" />
										Create with QR Code
									</Button>
								</CardFooter>
							</Card>
						</div>
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}
