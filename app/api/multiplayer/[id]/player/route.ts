import { createServerClient } from "@supabase/ssr";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { gameLobbies, gamePlayers } from "~/server/db/schema";

export async function PATCH(
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

		const { action, playerId } = await request.json();
		if (!action) {
			return NextResponse.json(
				{ error: "Action is required" },
				{ status: 400 },
			);
		}

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

		// Check if user is in this lobby
		const currentPlayer = lobby.players.find(
			(player) => player.userId === session.user.id,
		);
		if (!currentPlayer) {
			return NextResponse.json(
				{ error: "You are not a participant in this lobby" },
				{ status: 403 },
			);
		}

		// Handle different actions
		switch (action) {
			case "toggleReady": {
				// Toggle the player's ready status
				const newStatus = currentPlayer.status === "ready" ? "joined" : "ready";
				await db
					.update(gamePlayers)
					.set({ status: newStatus })
					.where(eq(gamePlayers.id, currentPlayer.id));

				return NextResponse.json({ success: true, status: newStatus });
			}

			case "kickPlayer": {
				// Only the host can kick players
				if (lobby.hostUserId !== session.user.id) {
					return NextResponse.json(
						{ error: "Only the host can kick players" },
						{ status: 403 },
					);
				}

				if (!playerId || typeof playerId !== "number") {
					return NextResponse.json(
						{ error: "Valid player ID is required" },
						{ status: 400 },
					);
				}

				// Don't allow kicking yourself (the host)
				const playerToKick = lobby.players.find(
					(player) => player.id === playerId,
				);
				if (!playerToKick || playerToKick.userId === lobby.hostUserId) {
					return NextResponse.json(
						{ error: "Cannot kick this player" },
						{ status: 400 },
					);
				}

				// Remove the player from the lobby
				await db.delete(gamePlayers).where(eq(gamePlayers.id, playerId));

				return NextResponse.json({ success: true, action: "kicked", playerId });
			}

			case "promotePlayer": {
				// Only the host can promote players
				if (lobby.hostUserId !== session.user.id) {
					return NextResponse.json(
						{ error: "Only the host can promote players" },
						{ status: 403 },
					);
				}

				if (!playerId || typeof playerId !== "number") {
					return NextResponse.json(
						{ error: "Valid player ID is required" },
						{ status: 400 },
					);
				}

				// Get the player to promote
				const playerToPromote = lobby.players.find(
					(player) => player.id === playerId,
				);
				if (!playerToPromote) {
					return NextResponse.json(
						{ error: "Player not found" },
						{ status: 404 },
					);
				}

				// Update the lobby to set new host
				await db
					.update(gameLobbies)
					.set({ hostUserId: playerToPromote.userId })
					.where(eq(gameLobbies.id, id));

				return NextResponse.json({
					success: true,
					action: "promoted",
					playerId,
					newHostId: playerToPromote.userId,
				});
			}

			default:
				return NextResponse.json({ error: "Invalid action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error updating player in lobby:", error);
		return NextResponse.json(
			{ error: "Failed to update player status" },
			{ status: 500 },
		);
	}
}
