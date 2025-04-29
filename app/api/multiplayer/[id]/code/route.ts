import { createServerClient } from "@supabase/ssr";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { gameLobbies } from "~/server/db/schema";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		// Resolve dynamic route parameter
		const { id } = params;
		const lobbyId = Number.parseInt(id);
		
		if (Number.isNaN(lobbyId)) {
			return NextResponse.json({ error: "Invalid lobby ID" }, { status: 400 });
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

		// Fetch just the lobby code
		const lobby = await db.query.gameLobbies.findFirst({
			where: (gameLobbies, { eq }) => eq(gameLobbies.id, lobbyId),
			columns: { code: true }
		});

		if (!lobby) {
			return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
		}

		return NextResponse.json({ code: lobby.code });
	} catch (error) {
		console.error("Error fetching lobby code:", error);
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
