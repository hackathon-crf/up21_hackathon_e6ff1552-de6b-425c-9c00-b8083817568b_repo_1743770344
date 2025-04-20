import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "~/env";

// Enhanced debug logging for auth issues
function logAuthEvent(
	level: "info" | "warn" | "error" | "critical",
	message: string,
	data?: any,
) {
	const timestamp = new Date().toISOString();
	const prefix =
		level === "critical"
			? "🚨 AUTH CRITICAL:"
			: level === "error"
				? "❌ AUTH ERROR:"
				: level === "warn"
					? "⚠️ AUTH WARNING:"
					: "📝 AUTH INFO:";

	// Log with appropriate method and formatting
	if (level === "critical") {
		console.log(`\n\n${prefix} ${message} [${timestamp}]`, data);
		console.error(`${prefix} ${message} [${timestamp}]`, data);
	} else if (level === "error") {
		console.error(`${prefix} ${message} [${timestamp}]`, data);
	} else if (level === "warn") {
		console.warn(`${prefix} ${message} [${timestamp}]`, data);
	} else {
		console.log(`${prefix} ${message} [${timestamp}]`, data);
	}
}

export async function GET(request: Request) {
	logAuthEvent("info", "Auth check API called", { url: request.url });

	try {
		// Get cookie store asynchronously
		const cookieStore = await cookies();

		// Create Supabase client
		const supabase = createServerClient(
			env.NEXT_PUBLIC_SUPABASE_URL,
			env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			{
				cookies: {
					get(name) {
						return cookieStore.get(name)?.value;
					},
					set: () => {}, // Not needed for this read-only endpoint
				},
			},
		);

		// Log headers for debug purposes
		const headers: Record<string, string> = {};
		request.headers.forEach((value, key) => {
			headers[key] = value;
		});
		logAuthEvent("info", "Request headers", headers);

		// Get session details
		const {
			data: { session },
			error: sessionError,
		} = await supabase.auth.getSession();

		if (sessionError) {
			logAuthEvent("error", "Auth check API session error", sessionError);
			return NextResponse.json(
				{
					authenticated: false,
					error: sessionError.message,
					timestamp: new Date().toISOString(),
					_debug: "Session error detected by server API",
				},
				{ status: 401 },
			);
		}

		if (!session) {
			logAuthEvent("warn", "No active session", {
				cookieCount: Object.keys(cookieStore.getAll()).length,
			});
			return NextResponse.json(
				{
					authenticated: false,
					message: "No active session",
					timestamp: new Date().toISOString(),
					_debug: "No session found by server API",
				},
				{ status: 200 },
			);
		}

		// If we have a session, verify the user
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			logAuthEvent("critical", "Session exists but user verification failed", {
				error: userError?.message,
				hasSession: !!session,
				sessionExpiry: session.expires_at
					? new Date(session.expires_at * 1000).toISOString()
					: null,
			});

			return NextResponse.json(
				{
					authenticated: false,
					hasSession: true,
					userError: userError?.message || "No user found",
					timestamp: new Date().toISOString(),
					_debug: "User verification failed although session exists",
				},
				{ status: 401 },
			);
		}

		// Success case
		logAuthEvent("info", "Authentication successful", {
			userId: user.id,
			email: user.email?.substring(0, 3) + "...",
		});

		return NextResponse.json(
			{
				authenticated: true,
				user: {
					id: user.id,
					email: user.email,
					emailConfirmed: user.email_confirmed_at ? true : false,
				},
				session: {
					expires: session.expires_at
						? new Date(session.expires_at * 1000).toISOString()
						: null,
				},
				timestamp: new Date().toISOString(),
				_debug: "Authentication successful",
			},
			{ status: 200 },
		);
	} catch (error) {
		logAuthEvent("critical", "Unexpected error in auth check API", error);
		return NextResponse.json(
			{
				authenticated: false,
				error: error instanceof Error ? error.message : "Unknown server error",
				timestamp: new Date().toISOString(),
				_debug: "Unhandled server exception in auth check API",
			},
			{ status: 500 },
		);
	}
}
