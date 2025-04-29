import { createServerClient } from "@supabase/ssr";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { gameLobbies, gamePlayers } from "~/server/db/schema";

// Define request type
type JoinLobbyRequest = {
	code: string;
};

export async function POST(request: NextRequest) {
	try {
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

		const { code } = await request.json();

		if (!code) {
			return NextResponse.json(
				{ error: "Game code is required" },
				{ status: 400 },
			);
		}

		// Find the lobby with the provided code
		const lobby = await db.query.gameLobbies.findFirst({
			where: (gameLobbies, { eq, and }) =>
				and(
					eq(gameLobbies.code, code.toUpperCase()),
					eq(gameLobbies.status, "waiting"),
				),
			with: {
				players: true,
			},
		});

		if (!lobby) {
			return NextResponse.json(
				{ error: "Invalid game code or game has already started" },
				{ status: 404 },
			);
		}

		// Check if player is already in the lobby
		const existingPlayer = lobby.players.find(
			(player) => player.userId === session.user.id,
		);
		if (existingPlayer) {
			return NextResponse.json({
				code: lobby.code,
				hostId: lobby.hostUserId,
				playerId: existingPlayer.id,
			});
		}

		// Add user as a player to the lobby
		const result = await db
			.insert(gamePlayers)
			.values({
				lobbyId: lobby.id,
				userId: session.user.id,
				nickname:
					session.user.email?.split("@")[0] ||
					`Player ${lobby.players.length + 1}`,
				status: "joined", // Player needs to click ready
			})
			.returning();

		const player = result[0];
		if (!player) {
			return NextResponse.json(
				{ error: "Failed to add player to lobby" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			code: lobby.code,
			hostId: lobby.hostUserId,
			playerId: player.id,
		});
	} catch (error) {
		console.error("Error joining game lobby:", error);
		return NextResponse.json(
			{ error: "Failed to join game lobby" },
			{ status: 500 },
		);
	}
}
