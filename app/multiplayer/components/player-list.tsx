"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
	useDebugEffect,
	useDebugRenders,
	useDebugState,
} from "~/lib/client-utils";
import { cn, debugColors } from "~/lib/utils";
import { PlayerAvatar } from "./player-avatar";

export interface Player {
	id: number | string;
	name: string;
	avatar: string;
	isHost?: boolean;
	isCurrentUser?: boolean;
	isReady?: boolean;
	isSpeaking?: boolean;
	isMuted?: boolean;
	status?: "idle" | "typing" | "answered" | "thinking" | "away";
	streak?: number;
	score?: number;
	rank?: number;
	role?: "player" | "host" | "moderator" | "observer";
}

interface PlayerListProps {
	players: Player[];
	title?: string;
	description?: string;
	showReadyStatus?: boolean;
	showControls?: boolean;
	className?: string;
	maxHeight?: string;
	onKickPlayer?: (playerId: number | string) => void;
	onPromotePlayer?: (playerId: number | string) => void;
	onToggleReady?: () => void;
	isCurrentUserReady?: boolean;
	isCurrentUserHost?: boolean;
}

// Create component as regular function first so we can memoize it
const PlayerListComponent = ({
	players,
	title = "Players",
	description,
	showReadyStatus = true,
	showControls = false,
	className,
	maxHeight = "300px",
	onKickPlayer,
	onPromotePlayer,
	onToggleReady,
	isCurrentUserReady = false,
	isCurrentUserHost = false,
}: PlayerListProps) => {
	// Debug render count and track instance
	const instanceId = useRef(
		`list-${Math.random().toString(36).substr(2, 9)}`,
	).current;
	const renderCount = useDebugRenders("PlayerList", debugColors.playerList, {
		playersCount: players.length,
		title,
		description,
		showReadyStatus,
		showControls,
		className,
		maxHeight,
		hasKickHandler: !!onKickPlayer,
		hasPromoteHandler: !!onPromotePlayer,
		hasToggleReadyHandler: !!onToggleReady,
		isCurrentUserReady,
		isCurrentUserHost,
	});

	console.log(
		`%c[PlayerList ${instanceId}] Component instance`,
		debugColors.playerList,
	);

	// Debug players data whenever it changes
	useEffect(() => {
		console.log(
			`%c[PlayerList ${instanceId}] Players data changed:`,
			debugColors.playerList,
			players,
		);
	}, [players, instanceId]);

	const [expandedPlayer, setExpandedPlayer] = useState<string | number | null>(
		null,
	);

	// Debug state changes
	useDebugState(
		expandedPlayer,
		"expandedPlayer",
		`PlayerList ${instanceId}`,
		debugColors.playerList,
	);

	const readyCount = players.filter((player) => player.isReady).length;
	const totalPlayers = players.length;
	const allReady = readyCount === totalPlayers;

	// Track when these derived values change
	useEffect(() => {
		console.log(
			`%c[PlayerList ${instanceId}] Ready status: ${readyCount}/${totalPlayers} (allReady: ${allReady})`,
			debugColors.playerList,
		);
	}, [readyCount, totalPlayers, allReady, instanceId]);

	// Use useCallback to memoize the click handler
	const handlePlayerClick = useCallback(
		(playerId: string | number) => {
			console.log(
				`%c[PlayerList ${instanceId}] handlePlayerClick called with id: ${playerId}`,
				debugColors.playerList,
			);
			setExpandedPlayer((prevId) => {
				const newValue = prevId === playerId ? null : playerId;
				console.log(
					`%c[PlayerList ${instanceId}] setExpandedPlayer: ${prevId} -> ${newValue}`,
					debugColors.playerList,
				);
				return newValue;
			});
		},
		[instanceId],
	);

	// Debug before creating player items
	console.log(
		`%c[PlayerList ${instanceId}] Before creating player items, render #${renderCount}`,
		debugColors.playerList,
	);

	// Use a ref to track if player items are recreated on each render
	const playerItemsRef = useRef<Array<React.ReactNode>>([]);

	// Pre-create player items outside of the render to avoid recreation
	const playerItems = players.map((player) => {
		console.log(
			`%c[PlayerList ${instanceId}] Creating item for player:`,
			debugColors.playerList,
			player,
		);

		return (
			<div
				key={player.id}
				className={cn(
					"group relative flex items-center justify-between rounded-lg p-2 transition-all",
					player.isCurrentUser
						? "bg-primary/10"
						: "bg-muted/50 hover:bg-muted/80",
					expandedPlayer === player.id && "bg-muted",
				)}
			>
				<div className="flex items-center gap-3">
					<PlayerAvatar
						player={player}
						showStatus={true}
						showBadge={false}
						onClick={() => handlePlayerClick(player.id)}
					/>
					<div>
						<div className="flex items-center gap-2">
							<span className="font-medium">{player.name}</span>
							{player.isCurrentUser && (
								<Badge variant="outline" className="text-xs">
									You
								</Badge>
							)}
							{player.isHost && (
								<Badge
									variant="outline"
									className="flex items-center gap-1 border-yellow-500 text-xs text-yellow-500"
								>
									<span className="h-2 w-2 rounded-full bg-yellow-500" />
									Host
								</Badge>
							)}
						</div>
						{player.score !== undefined && (
							<p className="text-muted-foreground text-xs">
								Score: {player.score}
							</p>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					{showReadyStatus && (
						<Badge
							variant={player.isReady ? "default" : "outline"}
							className="text-xs"
						>
							{player.isReady ? "Ready" : "Not Ready"}
						</Badge>
					)}

					{showControls &&
						isCurrentUserHost &&
						!player.isCurrentUser &&
						expandedPlayer === player.id && (
							<div className="flex items-center gap-1">
								{onPromotePlayer && (
									<Button
										variant="ghost"
										size="sm"
										className="h-7 px-2 text-xs"
										onClick={() => {
											console.log(
												`%c[PlayerList ${instanceId}] Promote button clicked for player: ${player.id}`,
												debugColors.playerList,
											);
											onPromotePlayer(player.id);
										}}
									>
										Promote
									</Button>
								)}
								{onKickPlayer && (
									<Button
										variant="destructive"
										size="sm"
										className="h-7 px-2 text-xs"
										onClick={() => {
											console.log(
												`%c[PlayerList ${instanceId}] Kick button clicked for player: ${player.id}`,
												debugColors.playerList,
											);
											onKickPlayer(player.id);
										}}
									>
										Kick
									</Button>
								)}
							</div>
						)}
				</div>
			</div>
		);
	});

	// Debug if playerItems are recreated
	useEffect(() => {
		if (playerItemsRef.current.length !== playerItems.length) {
			console.log(
				`%c[PlayerList ${instanceId}] Player items count changed: ${playerItemsRef.current.length} -> ${playerItems.length}`,
				debugColors.playerList,
			);
			playerItemsRef.current = playerItems;
		} else {
			console.log(
				`%c[PlayerList ${instanceId}] Player items recreated with same count: ${playerItems.length}`,
				debugColors.playerList,
			);
		}
	}, [playerItems, instanceId]);

	console.log(
		`%c[PlayerList ${instanceId}] Before final render, render #${renderCount}`,
		debugColors.playerList,
	);

	// Track when the component is mounted/unmounted
	useDebugEffect(
		"lifecycle",
		`PlayerList ${instanceId}`,
		debugColors.playerList,
		[],
	);

	return (
		<Card className={cn("", className)}>
			<CardHeader className="p-4 pt-0 pb-0 pb-2">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-base">{title}</CardTitle>
						{description ? (
							<CardDescription>{description}</CardDescription>
						) : (
							showReadyStatus && (
								<CardDescription>
									{readyCount} of {totalPlayers} players ready
								</CardDescription>
							)
						)}
					</div>
					{allReady && <Badge variant="default">All Ready</Badge>}
				</div>
			</CardHeader>
			<CardContent className="p-4 pt-2">
				<ScrollArea
					className={cn("pr-4", maxHeight ? `max-h-[${maxHeight}]` : "")}
				>
					<div className="space-y-2">{playerItems}</div>
				</ScrollArea>

				{onToggleReady && (
					<Button
						className="mt-4 w-full"
						variant={isCurrentUserReady ? "outline" : "default"}
						onClick={() => {
							console.log(
								`%c[PlayerList ${instanceId}] Toggle ready button clicked`,
								debugColors.playerList,
							);
							onToggleReady();
						}}
					>
						{isCurrentUserReady ? "Cancel Ready" : "Ready Up"}
					</Button>
				)}
			</CardContent>
		</Card>
	);
};

// Export a memoized version with comprehensive debug logging
const PlayerListMemo = memo(PlayerListComponent, (prevProps, nextProps) => {
	// Very detailed comparison for debugging
	const playerArraysEqual =
		prevProps.players.length === nextProps.players.length &&
		prevProps.players.every((player, index) => {
			// Get the corresponding player from next props
			const nextPlayer = nextProps.players[index];
			// Safe check if nextPlayer exists (TypeScript safety)
			if (!nextPlayer) return false;
			
			return (
				player.id === nextPlayer.id &&
				player.name === nextPlayer.name &&
				player.isReady === nextPlayer.isReady &&
				player.status === nextPlayer.status
			);
		});

	const arePropsEqual =
		playerArraysEqual &&
		prevProps.title === nextProps.title &&
		prevProps.showReadyStatus === nextProps.showReadyStatus &&
		prevProps.showControls === nextProps.showControls &&
		prevProps.className === nextProps.className &&
		prevProps.maxHeight === nextProps.maxHeight &&
		prevProps.isCurrentUserReady === nextProps.isCurrentUserReady &&
		prevProps.isCurrentUserHost === nextProps.isCurrentUserHost;

	console.log("%c[PlayerList] Memo comparison:", debugColors.playerList, {
		prevPlayersLength: prevProps.players.length,
		nextPlayersLength: nextProps.players.length,
		playerArraysEqual,
		arePropsEqual,
		prevProps,
		nextProps,
	});

	return arePropsEqual;
});

// Export the memoized component
export const PlayerList = PlayerListMemo;
