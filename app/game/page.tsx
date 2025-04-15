"use client";

import { Copy, Crown, Gamepad2, Users } from "lucide-react";
import { useState } from "react";

import { DashboardHeader } from "~/components/dashboard-header";
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

export default function GamePage() {
	const { toast } = useToast();
	const [gameCode, setGameCode] = useState("");

	const handleCopyCode = () => {
		navigator.clipboard.writeText("FIRST123");
		toast({
			title: "Game code copied",
			description: "Share this code with your team to join the training game",
		});
	};

	const handleCreateGame = () => {
		// In a real app, this would create a new game
		toast({
			title: "Game created",
			description: "Your training game has been created",
		});
	};

	const handleJoinGame = () => {
		if (!gameCode.trim()) {
			toast({
				title: "Error",
				description: "Please enter a game code",
				variant: "destructive",
			});
			return;
		}

		// In a real app, this would join an existing game
		toast({
			title: "Joining game",
			description: `Connecting to training game ${gameCode}...`,
		});
	};

	return (
		<div className="flex min-h-screen flex-col">
			<DashboardHeader
				title="Training Game"
				description="Challenge your team and test your first aid knowledge together"
			/>

			<main className="flex-1 p-6">
				<Tabs defaultValue="join" className="mx-auto max-w-3xl">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="join">Join Game</TabsTrigger>
						<TabsTrigger value="create">Create Game</TabsTrigger>
					</TabsList>

					<TabsContent value="join" className="mt-4 space-y-4 sm:mt-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg sm:text-xl">
									Join an Existing Game
								</CardTitle>
								<CardDescription>
									Enter a game code to join a training session with your team
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Input
										placeholder="Enter game code (e.g., FIRST123)"
										value={gameCode}
										onChange={(e) => setGameCode(e.target.value)}
									/>
								</div>
							</CardContent>
							<CardFooter>
								<Button className="w-full" onClick={handleJoinGame}>
									<Gamepad2 className="mr-2 h-4 w-4" />
									Join Game
								</Button>
							</CardFooter>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Recent Games</CardTitle>
								<CardDescription>
									Your recently played training games
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
													Yesterday at 3:45 PM • 5 participants
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
													3 days ago • 3 participants
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

					<TabsContent value="create" className="mt-4 space-y-4 sm:mt-6">
						<div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
							<Card>
								<CardHeader>
									<CardTitle>Create a New Game</CardTitle>
									<CardDescription>
										Set up a training game for your team to join
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="rounded-lg border bg-muted/50 p-4">
										<div className="flex items-center justify-between">
											<div>
												<p className="font-medium text-sm">Your Game Code</p>
												<p className="mt-1 font-bold text-2xl tracking-wider">
													FIRST123
												</p>
											</div>
											<Button
												variant="outline"
												size="icon"
												onClick={handleCopyCode}
											>
												<Copy className="h-4 w-4" />
												<span className="sr-only">Copy code</span>
											</Button>
										</div>
										<p className="mt-2 text-muted-foreground text-xs">
											Share this code with your team to let them join your
											training game
										</p>
									</div>

									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<Card>
												<CardHeader className="pb-2">
													<CardTitle className="text-sm">Topic</CardTitle>
												</CardHeader>
												<CardContent>
													<select className="w-full rounded-md border p-2">
														<option>CPR & AED</option>
														<option>First Aid Basics</option>
														<option>Emergency Response</option>
														<option>Bleeding Control</option>
													</select>
												</CardContent>
											</Card>

											<Card>
												<CardHeader className="pb-2">
													<CardTitle className="text-sm">Difficulty</CardTitle>
												</CardHeader>
												<CardContent>
													<select className="w-full rounded-md border p-2">
														<option>Basic</option>
														<option>Intermediate</option>
														<option>Advanced</option>
														<option>Mixed</option>
													</select>
												</CardContent>
											</Card>
										</div>

										<Card>
											<CardHeader className="pb-2">
												<CardTitle className="text-sm">Game Settings</CardTitle>
											</CardHeader>
											<CardContent className="space-y-2">
												<div className="flex items-center justify-between">
													<span className="text-sm">Number of questions</span>
													<select className="rounded-md border p-1">
														<option>5</option>
														<option>10</option>
														<option>15</option>
														<option>20</option>
													</select>
												</div>
												<div className="flex items-center justify-between">
													<span className="text-sm">Time per question</span>
													<select className="rounded-md border p-1">
														<option>15 seconds</option>
														<option>30 seconds</option>
														<option>45 seconds</option>
														<option>60 seconds</option>
													</select>
												</div>
												<div className="flex items-center justify-between">
													<span className="text-sm">Show leaderboard</span>
													<input
														type="checkbox"
														className="h-4 w-4"
														defaultChecked
													/>
												</div>
											</CardContent>
										</Card>
									</div>
								</CardContent>
								<CardFooter>
									<Button className="w-full" onClick={handleCreateGame}>
										<Gamepad2 className="mr-2 h-4 w-4" />
										Start Game
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
