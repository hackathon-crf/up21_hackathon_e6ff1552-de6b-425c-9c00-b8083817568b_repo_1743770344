import { createServerClient } from "@supabase/ssr";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { gameLobbies, gamePlayers } from "~/server/db/schema";

export async function POST(
	request: NextRequest,
	{ params }: { params: { code: string } },
) {
	try {
		const { code } = params;

		if (!code) {
			return NextResponse.json({ error: "Lobby code is required" }, { status: 400 });
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

		const body = await request.json();
		const { forceStart } = body;

		// Find the lobby with code
		const lobby = await db.query.gameLobbies.findFirst({
			where: (gameLobbies, { eq }) => eq(gameLobbies.code, code.toUpperCase()),
			with: {
				players: true,
			},
		});

		if (!lobby) {
			return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
		}

		// Check if user is the host
		if (lobby.hostUserId !== session.user.id) {
			return NextResponse.json(
				{ error: "Only the host can start the game" },
				{ status: 403 },
			);
		}

		// Check if all players are ready (unless force start)
		if (!forceStart) {
			const allReady = lobby.players.every(
				(player) => player.status === "ready" || player.userId === lobby.hostUserId,
			);
			
			if (!allReady) {
				return NextResponse.json(
					{ error: "Not all players are ready" },
					{ status: 400 },
				);
			}
		}

		// Update game status
		await db
			.update(gameLobbies)
			.set({
				status: "playing",
			})
			.where(eq(gameLobbies.id, lobby.id));

		// Update player status
		await db
			.update(gamePlayers)
			.set({
				status: "playing",
			})
			.where(eq(gamePlayers.lobbyId, lobby.id));

		return NextResponse.json({
			success: true,
			message: "Game started",
			id: lobby.id,
			code: lobby.code,
		});
	} catch (error) {
		console.error("Error starting game:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			},
			{ status: 500 },
		);
	}
}
