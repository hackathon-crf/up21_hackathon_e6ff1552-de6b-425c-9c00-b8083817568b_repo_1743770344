import { createServerClient } from "@supabase/ssr";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { gameLobbies, gamePlayers } from "~/server/db/schema";

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
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

		const id = Number.parseInt(params.id);
		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid lobby ID" }, { status: 400 });
		}

		const { forceStart } = await request.json();

		// Get the lobby with players to check permissions
		const lobby = await db.query.gameLobbies.findFirst({
			where: (gameLobbies, { eq }) => eq(gameLobbies.id, id),
			with: {
				players: true,
			},
		});

		if (!lobby) {
			return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
		}

		// Only the host can start the game
		if (lobby.hostUserId !== session.user.id) {
			return NextResponse.json(
				{ error: "Only the host can start the game" },
				{ status: 403 },
			);
		}

		// If not force starting, check if all players are ready
		if (!forceStart) {
			const allPlayersReady = lobby.players.every(
				(player) =>
					player.status === "ready" || player.userId === lobby.hostUserId,
			);

			if (!allPlayersReady) {
				return NextResponse.json(
					{ error: "Not all players are ready" },
					{ status: 400 },
				);
			}
		}

		// Update all players to 'playing' status
		await db
			.update(gamePlayers)
			.set({ status: "playing" })
			.where(eq(gamePlayers.lobbyId, id));

		// Update the lobby status to 'active'
		await db
			.update(gameLobbies)
			.set({ status: "active" })
			.where(eq(gameLobbies.id, id));

		return NextResponse.json({
			success: true,
			message: forceStart ? "Game force started" : "Game started",
		});
	} catch (error) {
		console.error("Error starting game:", error);
		return NextResponse.json(
			{ error: "Failed to start game" },
			{ status: 500 },
		);
	}
}
