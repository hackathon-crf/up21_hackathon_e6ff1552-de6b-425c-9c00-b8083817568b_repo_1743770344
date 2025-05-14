import { createServerClient } from "@supabase/ssr";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { gameLobbies, gamePlayers } from "~/server/db/schema";

export async function PATCH(
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

		const body = await request.json();
		const { action, playerId } = body;

		// Find current player and check if they are the host
		const currentPlayer = lobby.players.find((p) => p.userId === session.user.id);
		
		if (!currentPlayer) {
			return NextResponse.json(
				{ error: "You are not a participant in this lobby" },
				{ status: 403 },
			);
		}

		const isHost = currentPlayer.userId === lobby.hostUserId;

		// Handle different actions
		switch (action) {
			case "toggleReady": {
				const newStatus = currentPlayer.status === "ready" ? "joined" : "ready";
				
				await db
					.update(gamePlayers)
					.set({
						status: newStatus,
					})
					.where(eq(gamePlayers.id, currentPlayer.id));
				
				return NextResponse.json({
					status: newStatus,
					player: currentPlayer.id,
				});
			}
			
			case "kickPlayer": {
				if (!isHost) {
					return NextResponse.json(
						{ error: "Only the host can kick players" },
						{ status: 403 },
					);
				}
				
				if (!playerId) {
					return NextResponse.json(
						{ error: "Player ID is required" },
						{ status: 400 },
					);
				}
				
				await db
					.delete(gamePlayers)
					.where(eq(gamePlayers.id, playerId));
				
				return NextResponse.json({
					success: true,
					message: "Player removed from lobby",
				});
			}
			
			case "promotePlayer": {
				if (!isHost) {
					return NextResponse.json(
						{ error: "Only the host can promote players" },
						{ status: 403 },
					);
				}
				
				if (!playerId) {
					return NextResponse.json(
						{ error: "Player ID is required" },
						{ status: 400 },
					);
				}
				
				const targetPlayer = lobby.players.find((p) => p.id === playerId);
				if (!targetPlayer) {
					return NextResponse.json(
						{ error: "Player not found in lobby" },
						{ status: 404 },
					);
				}
				
				await db
					.update(gameLobbies)
					.set({
						hostUserId: targetPlayer.userId,
					})
					.where(eq(gameLobbies.id, lobby.id));
				
				return NextResponse.json({
					success: true,
					message: "Player promoted to host",
				});
			}
			
			default:
				return NextResponse.json(
					{ error: "Invalid action" },
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Error updating player:", error);
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
