import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	// Create supabase server client
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			"Missing Supabase environment variables. Please check your .env file.",
		);
	}

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return Array.from(request.cookies.getAll()).map((cookie) => ({
					name: cookie.name,
					value: cookie.value,
				}));
			},
			setAll(cookiesToSet) {
				for (const { name, value, options } of cookiesToSet) {
					request.cookies.set({
						name,
						value,
						...options,
					});
				}
			},
		},
	});

	// ONLY use getUser() for authentication - this is the secure method
	// that validates auth with the Supabase Auth server
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Get session separately if needed, but never use session.user for auth
	const {
		data: { session },
	} = await supabase.auth.getSession();

	// Handle auth redirects
	const path = request.nextUrl.pathname;

	// Protected routes - redirect to login if not authenticated
	const protectedRoutes = [
		"/dashboard",
		"/flashcards",
		"/study",
		"/chat",
		"/settings",
	];

	if (protectedRoutes.some((route) => path.startsWith(route)) && !user) {
		const redirectUrl = new URL("/login", request.url);
		redirectUrl.searchParams.set("redirectTo", path);
		return NextResponse.redirect(redirectUrl);
	}

	// Auth routes - redirect to dashboard if already authenticated
	const authRoutes = ["/login", "/signup", "/forgot-password", "/auth/login"];

	if (authRoutes.includes(path) && user) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// Also check if path starts with any auth path patterns (for nested auth routes)
	if ((path.startsWith("/auth/") || path.startsWith("/login/")) && user) {
		console.log(
			"Authenticated user trying to access auth route, redirecting to dashboard",
		);
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// Also redirect authenticated users from root path to dashboard
	// Only do this if not explicitly bypassing redirects with a query param
	if (path === "/" && user && !request.nextUrl.searchParams.has("no_redirect")) {
		console.log("Authenticated user at root path, redirecting to dashboard");
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// Update response headers
	const response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	// Update cookies for client components - include authenticated user data directly
	// This is more secure than just passing the session
	if (user) {
		// Only set cookie with user data if we have a verified user
		response.cookies.set("auth_user", JSON.stringify(user), {
			path: "/",
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
		});

		if (session) {
			response.cookies.set("auth_session", JSON.stringify(session), {
				path: "/",
				sameSite: "lax",
				secure: process.env.NODE_ENV === "production",
				httpOnly: true,
			});
		}
	} else {
		// If no user, clear auth cookies to prevent stale data
		response.cookies.delete("auth_user");
		response.cookies.delete("auth_session");
	}

	return response;
}

// Specify which paths the middleware should run on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!api|_next/static|_next/image|favicon.ico|public).*)",
	],
};
