import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * A utility function to get the authenticated user session from Supabase
 * for API routes.
 */
export async function getAuthSession() {
	const cookieStore = await cookies();
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			get: (name) => cookieStore.get(name)?.value ?? "",
			set: () => {}, // Not needed for auth verification
			remove: () => {}, // Not needed for auth verification
		},
	});

	const {
		data: { session },
	} = await supabase.auth.getSession();
	return session;
}

/**
 * A utility function to require authentication for API routes.
 * Returns the session if authenticated, otherwise returns a NextResponse error.
 */
export async function requireAuth(request: NextRequest) {
	const session = await getAuthSession();

	if (!session?.user) {
		return {
			success: false,
			response: NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			),
		};
	}

	return {
		success: true,
		session,
	};
}
