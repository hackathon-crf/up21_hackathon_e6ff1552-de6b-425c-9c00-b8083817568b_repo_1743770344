import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// Create the intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// Handle internationalization first - only return if it's a redirect
	const intlResponse = intlMiddleware(request);
	if (intlResponse && intlResponse.status >= 300 && intlResponse.status < 400) {
		return intlResponse;
	}

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

	// Auto-sync authenticated users with database
	if (user) {
		try {
			// Import the database client and schema
			const { db } = await import("~/server/db");
			const { users } = await import("~/server/db/schema");
			const { eq } = await import("drizzle-orm");

			// Check if user exists in our database
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.id, user.id))
				.limit(1)
				.then((rows) => rows[0] || null);

			if (!existingUser) {
				// Create the user record if it doesn't exist
				console.log(
					`[middleware] Creating missing user record for ${user.id.slice(0, 8)}...`,
				);
				await db.insert(users).values({
					id: user.id,
					email: user.email ?? "",
				});
				console.log("[middleware] User record created successfully");
			}
		} catch (error) {
			console.error("[middleware] Error syncing user with database:", error);
			// Continue without failing - we don't want auth errors to break the app
		}
	}

	// Handle auth redirects - now with locale awareness
	const path = request.nextUrl.pathname;

	// Extract locale from path
	const segments = path.split("/");
	const locale = segments[1]; // First segment after /
	const pathWithoutLocale = segments.slice(2).join("/") || "/";

	// Protected routes - redirect to login if not authenticated
	const protectedRoutes = ["/chat", "/study", "/settings"];

	if (
		protectedRoutes.some((route) =>
			pathWithoutLocale.startsWith(route.slice(1)),
		) &&
		!user
	) {
		const redirectUrl = new URL(`/${locale}/login`, request.url);
		redirectUrl.searchParams.set("redirectTo", path);
		return NextResponse.redirect(redirectUrl);
	}

	// Auth routes - redirect to chat if already authenticated
	const authRoutes = ["/login", "/signup", "/forgot-password", "/auth/login"];

	if (
		authRoutes.some((route) => pathWithoutLocale === route.slice(1)) &&
		user
	) {
		return NextResponse.redirect(new URL(`/${locale}/chat`, request.url));
	}

	// Also check if path starts with any auth path patterns (for nested auth routes)
	if (
		(pathWithoutLocale.startsWith("auth/") ||
			pathWithoutLocale.startsWith("login/")) &&
		user
	) {
		console.log(
			"Authenticated user trying to access auth route, redirecting to chat",
		);
		return NextResponse.redirect(new URL(`/${locale}/chat`, request.url));
	}

	// Also redirect authenticated users from root path to chat
	// Only do this if not explicitly bypassing redirects with a query param
	if (
		pathWithoutLocale === "/" &&
		user &&
		!request.nextUrl.searchParams.has("no_redirect")
	) {
		console.log("Authenticated user at root path, redirecting to chat");
		return NextResponse.redirect(new URL(`/${locale}/chat`, request.url));
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
		 * - trpc (tRPC routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!api|trpc|_next|_vercel|.*\\..*).*)",
	],
};
