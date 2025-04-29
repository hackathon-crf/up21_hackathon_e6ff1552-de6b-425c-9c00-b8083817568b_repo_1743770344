import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { gameLobbies } from "~/server/db/schema";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ code: string }> },
) {
	try {
		// Resolve dynamic route parameter
		const { code: lobbyCode } = await params;
		if (!lobbyCode || lobbyCode.length !== 6) {
			return NextResponse.json({ error: "Invalid lobby code" }, { status: 400 });
		}

		const cookieStore = await cookies();
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

		const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
			cookies: {
				get: (name) => cookieStore.get(name)?.value ?? "",
				set: () => {}, // Not needed for this endpoint
				remove: () => {}, // Not needed for this endpoint
			},
		});

		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session?.user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		// Fetch lobby with players and check permissions
		const lobby = await db.query.gameLobbies.findFirst({
			where: (gameLobbies, { eq }) => eq(gameLobbies.code, lobbyCode.toUpperCase()),
			with: {
				players: {
					with: {
						user: {
							columns: {
								id: true,
								email: true,
							},
						},
					},
				},
				flashcardDeck: true,
				host: {
					columns: {
						id: true,
						email: true,
					},
				},
			},
		});

		if (!lobby) {
			return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
		}

		// Check if user is in this lobby
		const isParticipant = lobby.players.some(
			(player) => player.userId === session.user.id,
		);
		if (!isParticipant && lobby.hostUserId !== session.user.id) {
			return NextResponse.json(
				{ error: "You are not a participant in this lobby" },
				{ status: 403 },
			);
		}

		// Format player data to include current user
		const formattedPlayers = lobby.players.map((player) => ({
			id: player.id,
			userId: player.userId,
			nickname: player.nickname,
			score: player.score,
			isHost: player.userId === lobby.hostUserId,
			isReady: player.status === "ready",
			isCurrentUser: player.userId === session.user.id,
			status: player.status,
			avatar: "/avatar.svg?height=40&width=40", // Default avatar for now
		}));

		// Format the lobby data
		const lobbyData = {
			id: lobby.id,
			code: lobby.code,
			hostUserId: lobby.hostUserId,
			status: lobby.status,
			title: lobby.flashcardDeck?.name || "Multiplayer Session",
			topic: lobby.flashcardDeck?.description || "First Aid",
			difficulty: "Intermediate", // Hardcoded default
			questions: 10, // Default value, could be based on deck
			timePerQuestion: 30, // Default value, could be configurable
			players: formattedPlayers,
		};

		return NextResponse.json(lobbyData);
	} catch (error) {
		console.error("API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch lobby data" },
			{ status: 500 },
		);
	}
}
