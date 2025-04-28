import { createServerClient } from "@supabase/ssr";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { getDb } from "~/server/db";
import { gameLobbies, gamePlayers } from "~/server/db/schema";

// Define types for our API
type CreateLobbyRequest = {
	title: string;
	mode: string;
};

function generateRandomCode(): string {
	// Generate a random 6-character uppercase code
	const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing characters like 0, O, 1, I
	let code = "";

	for (let i = 0; i < 6; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		code += characters[randomIndex];
	}

	return code;
}

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

		// Get connected database instance
		const db = await getDb();

		const { title, mode } = await request.json();

		if (!title) {
			return NextResponse.json({ error: "Title is required" }, { status: 400 });
		}

		// Generate a unique lobby code
		let code = generateRandomCode();
		let codeExists = true;
		let attempts = 0;

		// Make sure the code is unique
		while (codeExists && attempts < 5) {
			const existingLobby = await db.query.gameLobbies.findFirst({
				where: (gameLobbies: any, { eq }: any) => eq(gameLobbies.code, code),
			});

			if (!existingLobby) {
				codeExists = false;
			} else {
				code = generateRandomCode();
				attempts++;
			}
		}

		if (codeExists) {
			return NextResponse.json(
				{ error: "Failed to generate a unique game code. Please try again." },
				{ status: 500 },
			);
		}

		// Create the lobby
		const [lobby] = await db
			.insert(gameLobbies)
			.values({
				code: code,
				hostUserId: session.user.id,
				status: "waiting",
			})
			.returning();

		if (!lobby) {
			return NextResponse.json(
				{ error: "Failed to create lobby" },
				{ status: 500 },
			);
		}

		// Add the host as a player
		const result = await db
			.insert(gamePlayers)
			.values({
				lobbyId: lobby.id,
				userId: session.user.id,
				nickname: session.user.email?.split("@")[0] || "Host",
				status: "joined", // Host doesn't need to be ready
			})
			.returning();

		const player = result[0];
		if (!player) {
			return NextResponse.json(
				{ error: "Failed to add host as player" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			id: lobby.id,
			code: lobby.code,
			hostId: lobby.hostUserId,
			playerId: player.id,
		});
	} catch (error) {
		console.error("Error creating game lobby:", error);
		return NextResponse.json(
			{ error: "Failed to create game lobby" },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
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

		// Get connected database instance
		const db = await getDb();

		// Get all active lobbies
		const activeLobbies = await db.query.gameLobbies.findMany({
			where: (gameLobbies: any, { eq }: any) =>
				eq(gameLobbies.status, "waiting"),
			with: {
				players: true,
				host: {
					columns: {
						id: true,
						email: true,
					},
				},
			},
		});

		// Format the lobbies for the client
		const formattedLobbies = activeLobbies.map((lobby: any) => ({
			id: lobby.id,
			code: lobby.code,
			hostEmail: lobby.host.email,
			playerCount: lobby.players.length,
			createdAt: lobby.createdAt,
		}));

		return NextResponse.json(formattedLobbies);
	} catch (error) {
		console.error("Error fetching game lobbies:", error);
		return NextResponse.json(
			{ error: "Failed to fetch game lobbies" },
			{ status: 500 },
		);
	}
}
