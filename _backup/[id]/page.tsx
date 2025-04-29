"use client";

import {
	Copy,
	Heart,
	MessageSquare,
	Play,
	QrCode,
	Settings,
	Share2,
	Shield,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";

import QRCodeDisplay from "~/components/qr-code-display";
import QRCodeModal from "~/components/qr-code-modal";
import { ToggleableQRCode } from "~/components/toggleable-qr-code";
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
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/hooks/use-toast";
import type { QRCodeState } from "~/lib/types";
import { cn } from "~/lib/utils";
import { ConnectionStatus } from "../../components/connection-status";
import { GameChat } from "../../components/game-chat";
import {
	PlayerList,
	type Player as PlayerListPlayer,
} from "../../components/player-list";
import { VoiceChatControls } from "../../components/voice-chat-controls";

// Define types for our API data
type PlayerStatus =
	| "joined"
	| "ready"
	| "playing"
	| "left"
	| "idle"
	| "typing"
	| "away"
	| undefined;

type Player = {
	id: number;
	userId: string;
	nickname: string;
	avatar?: string;
	isHost: boolean;
	isReady: boolean;
	isCurrentUser?: boolean;
	status?: PlayerStatus;
	score?: number;
};

type LobbyData = {
	id: number;
	code: string;
	hostUserId: string;
	status: string;
	title: string;
	topic: string;
	difficulty: string;
	questions: number;
	timePerQuestion: number;
	players: Player[];
};

export default function LobbyPage() {
	// Use the useParams hook to get route parameters
	const { id } = useParams() as { id: string };
	return <LobbyContent gameId={id} />;
}

function LobbyContent({ gameId }: { gameId: string }) {
	const router = useRouter();
	const { toast } = useToast();
	const [isHost, setIsHost] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [gameMode, setGameMode] = useState<"rapid" | "clash">("rapid");
	const [chatCollapsed, setChatCollapsed] = useState(false);
	const [showVoiceChat, setShowVoiceChat] = useState(false);
	const [isStarting, setIsStarting] = useState(false);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [session, setSession] = useState<LobbyData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

	// QR code display states: hidden, inline, modal
	const [qrCodeDisplay, setQrCodeDisplay] = useState<QRCodeState>("hidden");

	const baseUrl =
		typeof window !== "undefined"
			? `${window.location.protocol}//${window.location.host}`
			: "";

	// Convert API players to PlayerList component format
	const formattedPlayers = useMemo<PlayerListPlayer[]>(() => {
		if (!session) return [];

		return session.players.map((player) => ({
			id: player.id,
			name: player.nickname,
			avatar: player.avatar || "/avatar.svg?height=40&width=40",
			isHost: player.isHost,
			isCurrentUser: player.isCurrentUser,
			isReady: player.isReady,
			status: player.status as
				| "typing"
				| "answered"
				| "thinking"
				| "away"
				| undefined, // Use specific status types
			role: player.isHost ? "host" : "player",
		}));
	}, [session]);

	// Derived values
	const readyCount = useMemo(
		() => session?.players.filter((player) => player.isReady).length || 0,
		[session],
	);
	const totalPlayers = useMemo(() => session?.players.length || 0, [session]);
	const allReady = useMemo(
		() => readyCount === totalPlayers && totalPlayers > 0,
		[readyCount, totalPlayers],
	);

	// Fetch lobby data
	const fetchLobbyData = useCallback(async () => {
		try {
			if (!gameId) return;

			const response = await fetch(`/api/multiplayer/${gameId}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to fetch lobby data");
			}

			const data = await response.json();
			setSession(data);

			// Find the current user to determine if they're the host
			const currentUser = data.players.find((p: Player) => p.isCurrentUser);
			if (currentUser) {
				setIsHost(currentUser.isHost);
				setIsReady(currentUser.isReady);
			}
		} catch (error) {
			console.error("Error fetching lobby:", error);
			setError(error instanceof Error ? error.message : "Failed to load lobby");

			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to load lobby",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}, [gameId, toast]);

	// Initial data fetch
	useEffect(() => {
		fetchLobbyData();

		// Set up polling for updates
		const interval = setInterval(() => {
			fetchLobbyData();
		}, 5000); // Poll every 5 seconds

		setPollInterval(interval);

		// Cleanup polling on unmount
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [fetchLobbyData]);

	// Show welcome notification on mount
	useEffect(() => {
		toast({
			variant: "success",
			title: "Welcome to the lobby!",
			description: "Wait for all players to be ready before starting the game.",
			duration: 8000,
		});
	}, [toast]);

	// Function to copy the game code to clipboard
	const handleCopyCode = useCallback(() => {
		if (!session) return;

		if (typeof navigator !== "undefined" && navigator.clipboard) {
			navigator.clipboard.writeText(session.code);
			toast({
				title: "Game code copied",
				description: "Share this code with your team to join the session",
				duration: 3000,
			});
		}
	}, [session, toast]);

	const handleStartGame = useCallback(async () => {
		if (!gameId || !session) return;

		setConnectionError(null);
		setIsStarting(true);
		toast({
			variant: "info",
			title: "Starting session",
			description: "Preparing the training session...",
			duration: 3000,
		});

		try {
			const response = await fetch(`/api/multiplayer/${gameId}/start`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ forceStart: false }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to start game");
			}

			// Success path
			toast({
				variant: "success",
				title: "Session started!",
				description: "Redirecting to game...",
				duration: 2000,
			});

			// Redirect to the appropriate game mode
			setTimeout(() => {
				if (gameMode === "rapid") {
					router.push(`/multiplayer/rapid/${gameId}`);
				} else {
					router.push(`/multiplayer/clash/${gameId}`);
				}
			}, 1000);
		} catch (error) {
			console.error("Failed to start game:", error);
			let errorMessage = "Failed to start the game. Please try again.";
			if (error instanceof Error) {
				errorMessage = error.message;
			}
			setConnectionError(errorMessage);
			toast({
				variant: "destructive",
				title: "Failed to start session",
				description:
					"There was a problem connecting to the game server. Please try again.",
				duration: 5000,
			});
		} finally {
			setIsStarting(false);
		}
	}, [toast, gameId, gameMode, router, session]);

	const handleForceStart = useCallback(async () => {
		if (!gameId || !session) return;

		setConnectionError(null);
		setIsStarting(true);
		toast({
			variant: "warning",
			title: "Force starting session",
			description: "Starting the session before all players are ready...",
			duration: 3000,
		});

		try {
			const response = await fetch(`/api/multiplayer/${gameId}/start`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ forceStart: true }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to start game");
			}

			// Success path
			toast({
				variant: "success",
				title: "Session started!",
				description: "Redirecting to game...",
				duration: 2000,
			});

			// Redirect to the appropriate game mode
			setTimeout(() => {
				if (gameMode === "rapid") {
					router.push(`/multiplayer/rapid/${gameId}`);
				} else {
					router.push(`/multiplayer/clash/${gameId}`);
				}
			}, 1000);
		} catch (error) {
			console.error("Failed to force start game:", error);
			let errorMessage = "Failed to start the game. Please try again.";
			if (error instanceof Error) {
				errorMessage = error.message;
			}
			setConnectionError(errorMessage);
			toast({
				variant: "destructive",
				title: "Failed to start session",
				description:
					"There was a problem connecting to the game server. Please try again.",
				duration: 5000,
			});
		} finally {
			setIsStarting(false);
		}
	}, [toast, gameId, gameMode, router, session]);

	const handleToggleReady = useCallback(async () => {
		if (!gameId) return;

		try {
			const response = await fetch(`/api/multiplayer/${gameId}/player`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ action: "toggleReady" }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update ready status");
			}

			const data = await response.json();
			const newReadyState = data.status === "ready";
			setIsReady(newReadyState);

			toast({
				variant: "info",
				title: newReadyState ? "You are now ready" : "Ready status canceled",
				description: newReadyState
					? "Waiting for other players to be ready"
					: "You can change your mind at any time",
				duration: 3000,
			});

			// Refresh lobby data
			fetchLobbyData();
		} catch (error) {
			console.error("Failed to toggle ready status:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to update ready status",
				duration: 3000,
			});
		}
	}, [gameId, fetchLobbyData, toast]);

	const handleKickPlayer = useCallback(
		async (playerId: number | string) => {
			if (!gameId) return;

			try {
				const response = await fetch(`/api/multiplayer/${gameId}/player`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						action: "kickPlayer",
						playerId: Number(playerId),
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to kick player");
				}

				toast({
					variant: "destructive",
					title: "Player kicked",
					description: "Player has been removed from the lobby",
				});

				// Refresh lobby data
				fetchLobbyData();
			} catch (error) {
				console.error("Failed to kick player:", error);
				toast({
					variant: "destructive",
					title: "Error",
					description:
						error instanceof Error ? error.message : "Failed to kick player",
				});
			}
		},
		[gameId, fetchLobbyData, toast],
	);

	const handlePromotePlayer = useCallback(
		async (playerId: number | string) => {
			if (!gameId) return;

			try {
				const response = await fetch(`/api/multiplayer/${gameId}/player`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						action: "promotePlayer",
						playerId: Number(playerId),
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to promote player");
				}

				toast({
					variant: "success",
					title: "Player promoted",
					description: "Player is now the host of the lobby",
				});

				// Refresh lobby data
				fetchLobbyData();
			} catch (error) {
				console.error("Failed to promote player:", error);
				toast({
					variant: "destructive",
					title: "Error",
					description:
						error instanceof Error ? error.message : "Failed to promote player",
				});
			}
		},
		[gameId, fetchLobbyData, toast],
	);

	const handleEditSettings = useCallback(() => {
		if (gameId) {
			router.push(`/multiplayer/settings/${gameId}`);
		}
	}, [router, gameId]);

	const handleSetGameMode = useCallback((mode: "rapid" | "clash") => {
		setGameMode(mode);
	}, []);

	// Helper function for keyboard events
	const handleKeyDown = (
		event: React.KeyboardEvent<HTMLButtonElement>,
		callback: () => void,
	) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault(); // Prevent default space bar scroll
			callback();
		}
	};

	const handleToggleChatCollapsed = useCallback(() => {
		setChatCollapsed((prev) => !prev);
	}, []);

	const handleToggleShowVoiceChat = useCallback(() => {
		setShowVoiceChat((prev) => !prev);
	}, []);

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center">
				<div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
				<p>Loading lobby...</p>
			</div>
		);
	}

	// Show error state
	if (error || !session) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center">
				<div className="mb-4 text-destructive">
					<X className="mx-auto h-12 w-12" />
				</div>
				<h1 className="mb-2 font-bold text-xl">Error Loading Lobby</h1>
				<p className="text-muted-foreground">
					{error || "Could not load lobby data"}
				</p>
				<Button className="mt-4" onClick={() => router.push("/multiplayer")}>
					Back to Multiplayer
				</Button>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			{/* QR Code Modal */}
			{session && (
				<QRCodeModal
					open={qrCodeDisplay === "modal"}
					onOpenChange={() => setQrCodeDisplay("hidden")}
					baseUrl={baseUrl}
					gameCode={session.code}
					lobbyId={session.id}
				/>
			)}

			{/* Header Section */}
			<div className="border-b p-3 sm:p-4">
				<div className="mx-auto flex max-w-5xl flex-col justify-between sm:flex-row sm:items-center">
					<div className="mb-2 sm:mb-0">
						<h1 className="font-bold text-xl sm:text-2xl">{session.title}</h1>
						<div className="flex items-center gap-2">
							<p className="text-muted-foreground text-xs sm:text-sm">
								Waiting for all players to be ready
							</p>
							<ConnectionStatus />
						</div>
					</div>
					<div className="flex items-center gap-2 sm:gap-4">
						<div className="flex items-center gap-1 sm:gap-2">
							<Users className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
							<span className="text-xs sm:text-sm">
								{readyCount}/{totalPlayers} ready
							</span>
						</div>
						<Button variant="outline" size="sm" asChild>
							<Link href="/multiplayer">Leave</Link>
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content Section */}
			<main className="flex-1 p-4 sm:p-6">
				<div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
					{/* Left Column (Player List, Voice Chat, Actions, Game Chat) */}
					<div className="space-y-4 sm:space-y-6 md:col-span-2">
						<PlayerList
							players={formattedPlayers}
							showReadyStatus={true}
							showControls={isHost}
							onKickPlayer={handleKickPlayer}
							onPromotePlayer={handlePromotePlayer}
							onToggleReady={handleToggleReady}
							isCurrentUserReady={isReady}
							isCurrentUserHost={isHost}
						/>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<VoiceChatControls />

							<Card className="h-auto gap-0 py-0 pt-0 pb-0">
								<CardHeader className="gap-0 p-3 pt-2 pb-1">
									<CardTitle className="text-base">Quick Actions</CardTitle>
								</CardHeader>
								<CardContent className="p-3 pt-1">
									<div className="grid grid-cols-2 gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={handleToggleShowVoiceChat}
										>
											{showVoiceChat ? "Hide VC" : "Show VC"}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleToggleChatCollapsed}
										>
											{chatCollapsed ? "Show Chat" : "Hide Chat"}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleCopyCode}
										>
											Copy Code
										</Button>
										<Button
											variant={
												qrCodeDisplay !== "hidden" ? "default" : "outline"
											}
											size="sm"
											onClick={() => {
												if (qrCodeDisplay === "hidden")
													setQrCodeDisplay("inline");
												else if (qrCodeDisplay === "inline")
													setQrCodeDisplay("modal");
												else setQrCodeDisplay("hidden");
											}}
										>
											<QrCode className="mr-2 h-4 w-4" />
											{qrCodeDisplay === "hidden"
												? "Show QR"
												: qrCodeDisplay === "inline"
													? "Enlarge QR"
													: "Hide QR"}
										</Button>
										{isHost && (
											<Button
												variant="outline"
												size="sm"
												onClick={handleEditSettings}
											>
												<Settings className="mr-2 h-4 w-4" />
												Settings
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Connection Error Display */}
						{connectionError && (
							<Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
								<CardContent className="flex items-start gap-3 p-4">
									<div className="mt-1 flex-shrink-0 text-red-500">
										<X className="h-5 w-5" />
									</div>
									<div>
										<h3 className="font-medium text-red-700 dark:text-red-400">
											Connection Error
										</h3>
										<p className="text-red-600 text-sm dark:text-red-300">
											{connectionError}
										</p>
										<p className="mt-1 text-red-500 text-xs dark:text-red-400">
											Please check your internet connection and try again.
										</p>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Conditionally render GameChat */}
						{!chatCollapsed && (
							<GameChat
								sessionId={String(session.id)}
								onToggleCollapse={handleToggleChatCollapsed}
								className="transition-opacity duration-300 ease-in-out"
							/>
						)}
					</div>

					{/* Right Column (Session Info, Game Mode) */}
					<div className="space-y-4 sm:space-y-6">
						{/* Session Info Card */}
						<Card className="gap-0 pt-0 pb-0">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="text-base">Session Info</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 p-4 pt-2">
								{/* Session Code Display */}
								<div className="rounded-lg border bg-muted/50 p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium text-sm">Session Code</p>
											<p className="mt-1 font-bold text-2xl tracking-wider">
												{session.code}
											</p>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="icon"
												onClick={handleCopyCode}
												title="Copy code"
											>
												<Copy className="h-4 w-4" />
												<span className="sr-only">Copy code</span>
											</Button>
											<Button
												variant={
													qrCodeDisplay !== "hidden" ? "default" : "outline"
												}
												size="icon"
												onClick={() => {
													if (qrCodeDisplay === "hidden")
														setQrCodeDisplay("inline");
													else if (qrCodeDisplay === "inline")
														setQrCodeDisplay("modal");
													else setQrCodeDisplay("hidden");
												}}
												title={
													qrCodeDisplay === "hidden"
														? "Show QR Code"
														: qrCodeDisplay === "inline"
															? "Show QR Code in Modal"
															: "Hide QR Code"
												}
											>
												<QrCode className="h-4 w-4" />
												<span className="sr-only">Toggle QR code</span>
											</Button>
										</div>
									</div>
									<p className="mt-2 text-muted-foreground text-xs">
										Share this code with your team to join the session
									</p>
									
									{/* Inline QR code display */}
									{qrCodeDisplay === "inline" && (
										<div className="mt-4 rounded-lg border p-3">
											<div className="mb-1 flex justify-end">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setQrCodeDisplay("hidden")}
													className="h-6 w-6"
												>
													<X className="h-3 w-3" />
												</Button>
											</div>
											<div className="flex flex-col items-center">
												<QRCodeDisplay
													url={`${baseUrl}/multiplayer?join=${session?.code || ""}`}
													gameCode={session?.code}
													text="Scan to join this session"
													className="w-full border-none p-2 shadow-none"
													compact={true}
												/>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setQrCodeDisplay("modal")}
													className="mt-2"
												>
													<QrCode className="mr-2 h-3 w-3" />
													Show Full Screen
												</Button>
											</div>
										</div>
									)}
								</div>

								{/* Other Session Details */}
								<div className="space-y-2">
									<div className="flex justify-between">
										<span className="text-muted-foreground text-sm">Topic</span>
										<span className="font-medium text-sm">{session.topic}</span>
									</div>
									<Separator />
									<div className="flex justify-between">
										<span className="text-muted-foreground text-sm">
											Difficulty
										</span>
										<span className="font-medium text-sm">
											{session.difficulty}
										</span>
									</div>
									<Separator />
									<div className="flex justify-between">
										<span className="text-muted-foreground text-sm">
											Questions
										</span>
										<span className="font-medium text-sm">
											{session.questions}
										</span>
									</div>
									<Separator />
									<div className="flex justify-between">
										<span className="text-muted-foreground text-sm">
											Time per Question
										</span>
										<span className="font-medium text-sm">
											{session.timePerQuestion} seconds
										</span>
									</div>
								</div>
							</CardContent>
							{/* Edit Settings Button for Host */}
							{isHost && (
								<CardFooter className="p-4 pt-0">
									<Button
										variant="outline"
										className="w-full"
										onClick={handleEditSettings}
									>
										<Settings className="mr-2 h-4 w-4" />
										Edit Settings
									</Button>
								</CardFooter>
							)}
						</Card>

						{/* Game Mode Selection Card */}
						<Card className="gap-0 pt-0 pb-0">
							<CardHeader className="p-4 pb-2">
								<CardTitle className="text-base">Game Mode</CardTitle>
								<CardDescription>
									Select the type of multiplayer session
								</CardDescription>
							</CardHeader>
							<CardContent className="p-4 pt-2">
								<div className="space-y-4">
									{/* Rapid Response Option */}
									<button
										type="button"
										className={cn(
											"w-full cursor-pointer rounded-lg border-2 p-4 text-left transition-all",
											gameMode === "rapid"
												? "border-primary bg-primary/5"
												: "border-muted hover:border-muted-foreground/50",
										)}
										onClick={() => handleSetGameMode("rapid")}
										onKeyDown={(e) =>
											handleKeyDown(e, () => handleSetGameMode("rapid"))
										}
									>
										<div className="flex items-center gap-3">
											<div className="rounded-full bg-primary/10 p-2">
												<Shield className="h-5 w-5 text-primary" />
											</div>
											<div>
												<h3 className="font-medium">Rapid Response</h3>
												<p className="text-muted-foreground text-sm">
													Fast-paced challenge with real-time scoring
												</p>
											</div>
										</div>
									</button>

									{/* Card Clash Option */}
									<button
										type="button"
										className={cn(
											"w-full cursor-pointer rounded-lg border-2 p-4 text-left transition-all",
											gameMode === "clash"
												? "border-primary bg-primary/5"
												: "border-muted hover:border-muted-foreground/50",
										)}
										onClick={() => handleSetGameMode("clash")}
										onKeyDown={(e) =>
											handleKeyDown(e, () => handleSetGameMode("clash"))
										}
									>
										<div className="flex items-center gap-3">
											<div className="rounded-full bg-primary/10 p-2">
												<Heart className="h-5 w-5 text-primary" />
											</div>
											<div>
												<h3 className="font-medium">Card Clash</h3>
												<p className="text-muted-foreground text-sm">
													Competitive flashcard review
												</p>
											</div>
										</div>
									</button>
								</div>
							</CardContent>
							{/* Start/Ready Button */}
							<CardFooter className="p-4 pt-2">
								{isHost ? (
									<div className="w-full space-y-2">
										<Button
											className="w-full"
											onClick={handleStartGame}
											disabled={!allReady || isStarting}
										>
											{isStarting ? (
												<>
													<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
													Starting...
												</>
											) : (
												<>
													<Play className="mr-2 h-4 w-4" />
													{allReady
														? "Start Session"
														: `Waiting for ${totalPlayers - readyCount} more...`}
												</>
											)}
										</Button>
										{!allReady && !isStarting && (
											<Button
												className="w-full"
												variant="destructive"
												onClick={handleForceStart}
											>
												<Play className="mr-2 h-4 w-4" />
												Force Start Session
											</Button>
										)}
									</div>
								) : (
									<Button
										className="w-full"
										variant={isReady ? "secondary" : "default"}
										onClick={handleToggleReady}
									>
										{isReady ? "Cancel Ready" : "Ready Up"}
									</Button>
								)}
							</CardFooter>
						</Card>
					</div>
				</div>
			</main>

			{/* Floating Chat Button when collapsed */}
			{chatCollapsed && (
				<Button
					variant="outline"
					className="fixed right-4 bottom-4 z-50 flex h-12 items-center gap-2 rounded-full px-4 shadow-lg"
					onClick={handleToggleChatCollapsed}
				>
					<MessageSquare className="h-5 w-5" />
					<span className="font-medium">Chat</span>
				</Button>
			)}
		</div>
	);
}
