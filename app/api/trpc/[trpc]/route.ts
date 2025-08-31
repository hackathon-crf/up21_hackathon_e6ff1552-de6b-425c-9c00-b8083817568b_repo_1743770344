import { createServerClient } from "@supabase/ssr";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { transformer } from "~/trpc/shared"; // Import shared transformer

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
	try {
		console.log("[API] Creating tRPC context");

		// Log cookies for debugging in a safer way
		console.log(
			"[API] Request cookies:",
			Array.from(req.cookies.getAll()).map((cookie) => ({
				name: cookie.name,
				value: cookie.name.includes("token")
					? "***REDACTED***"
					: `${cookie.value.slice(0, 10)}...`,
			})),
		);

		// Extract auth data from request directly without using cookies() API
		const supabase = createServerClient(
			env.NEXT_PUBLIC_SUPABASE_URL,
			env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			{
				cookies: {
					get(name) {
						const cookie = req.cookies.get(name);
						return cookie?.value;
					},
					set(name, value, options) {
						// Not needed for API routes as we don't modify response
					},
					remove(name, options) {
						// Not needed for API routes as we don't modify response
					},
				},
			},
		);

		console.log("[API] Supabase client created, fetching auth data");

		let user = null;
		let session = null;

		// Try to get authenticated user - handle errors gracefully
		try {
			const { data: userData, error: userError } =
				await supabase.auth.getUser();

			if (userError) {
				console.error("[API] Error getting user:", userError.message);
			} else if (userData?.user) {
				user = userData.user;
				console.log(
					`[API] Retrieved authenticated user: ${user.id.slice(0, 8)}...`,
				);
			} else {
				console.log("[API] No authenticated user found");
			}
		} catch (userErr) {
			console.error("[API] Exception in getUser():", userErr);
		}

		// Get session separately
		try {
			const { data: sessionData, error: sessionError } =
				await supabase.auth.getSession();

			if (sessionError) {
				console.error("[API] Error getting session:", sessionError.message);
			} else if (sessionData?.session) {
				session = sessionData.session;
				console.log("[API] Retrieved session");
			} else {
				console.log("[API] No active session found");
			}
		} catch (sessionErr) {
			console.error("[API] Exception in getSession():", sessionErr);
		}

		console.log(
			"[API] Authentication status:",
			user ? "Authenticated" : "Not authenticated",
		);

		// Create context with the auth data we were able to retrieve
		return createTRPCContext({
			headers: req.headers,
			auth: {
				session,
				user,
			},
		});
	} catch (error) {
		console.error("[API] Error creating context:", error);
		// For any global error, return a basic context with no auth
		return createTRPCContext({
			headers: req.headers,
			auth: {
				session: null,
				user: null,
			},
		});
	}
};

// Debug raw request data before processing
async function debugRequestData(req: NextRequest) {
	try {
		// Clone the request to avoid consuming the body
		const clonedReq = req.clone();

		// Check if there's a body
		if (clonedReq.body) {
			try {
				// Try to get the body as text and log it
				const text = await clonedReq.text();
				console.log("[API Debug] Request body as text:", text);

				// Try to parse as JSON if possible
				try {
					const json = JSON.parse(text);
					console.log("[API Debug] Request body as JSON:", json);
				} catch (e) {
					console.log("[API Debug] Request body is not valid JSON");
				}
			} catch (e) {
				console.log("[API Debug] Could not read request body:", e);
			}
		} else {
			console.log("[API Debug] Request has no body");
		}

		// Log query params
		console.log("[API Debug] Request URL:", clonedReq.url);
		console.log("[API Debug] Request method:", clonedReq.method);
		console.log(
			"[API Debug] Request headers:",
			Object.fromEntries(clonedReq.headers.entries()),
		);
	} catch (error) {
		console.error("[API Debug] Error debugging request:", error);
	}
}

const handler = async (req: NextRequest) => {
	// Debug incoming request
	await debugRequestData(req);

	// Process with the standard handler
	const response = await fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: async () => await createContext(req),
		onError:
			env.NODE_ENV === "development"
				? ({ path, error, input }) => {
						console.error(
							`❌ tRPC failed on ${path ?? "<no-path>"}:`,
							error,
							// Add more detailed error info
							{
								message: error.message,
								code: error.code,
								// Safely access error properties
								cause: error.cause,
								input,
							},
						);
					}
				: undefined,
	});

	// Log basic response info (simplified to avoid JSON parsing issues)
	if (env.NODE_ENV === "development") {
		console.log("[API] Response status:", response.status);
		console.log(
			"[API] Response headers:",
			Object.fromEntries(response.headers.entries()),
		);
		
		// Only log response body for non-streaming responses to avoid issues
		if (!response.headers.get("content-type")?.includes("stream")) {
			try {
				const clonedResponse = response.clone();
				const responseText = await clonedResponse.text();
				console.log(
					"[API] Response body preview:",
					responseText.length > 500
						? `${responseText.substring(0, 500)}...`
						: responseText,
				);
			} catch (error) {
				console.log("[API] Could not read response body for logging");
			}
		}
	}

	// Return the original response directly (avoid cloning/recreation issues)
	return response;
};

export { handler as GET, handler as POST };
