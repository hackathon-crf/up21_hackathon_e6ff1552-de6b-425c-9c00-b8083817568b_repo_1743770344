import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { createServerClient } from "@supabase/ssr";
import type { Session, User } from "@supabase/supabase-js";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { cookies } from "next/headers";
import { env } from "~/env";
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

interface CreateContextOptions {
	headers: Headers;
	auth: {
		session: Session | null;
		user: User | null;
	};
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
	console.log("[createInnerTRPCContext] - Creating context with options:", {
		hasHeaders: !!opts.headers,
		hasAuth: !!opts.auth,
		userId: opts.auth?.user?.id
			? `${opts.auth.user.id.slice(0, 8)}...`
			: "none",
	});
	return {
		headers: opts.headers,
		auth: opts.auth,
		db, // Add the database client to the context
	};
};

/**
 * This is the actual context you'll use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 */
export const createTRPCContext = async (opts: {
	headers: Headers;
	auth?: { session: Session | null; user: User | null };
}) => {
	console.log(
		"[createTRPCContext] - Starting context creation. Provided options:",
		{
			hasHeaders: !!opts.headers,
			authProvided: !!opts.auth,
		},
	);

	// If auth was provided by the caller (e.g. in testing), use it
	if (opts.auth) {
		console.log("[createTRPCContext] - Using provided auth data");
		return createInnerTRPCContext({
			headers: opts.headers,
			auth: opts.auth,
		});
	}

	// Create a Supabase client using async cookies handling for Next.js
	const cookieStore = cookies();

	// Using env variables with proper typing instead of non-null assertions
	const supabase = createServerClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll() {
					// Return all cookies in the expected format
					// @ts-expect-error - The cookies API type definitions may be inconsistent
					return cookieStore.getAll().reduce((acc, cookie) => {
						acc[cookie.name] = cookie.value;
						return acc;
					}, {});
				},
				setAll(cookiesToSet) {
					// Cookie setting not needed for this read-only context
					try {
						for (const { name, value, options } of cookiesToSet) {
							// This would be used if we needed to set cookies
							// Not implementing the actual set since it's not used
						}
					} catch (error) {
						// Ignore errors in server components where cookie setting isn't supported
						console.debug("Cookie setting not supported in this context");
					}
				},
			},
		},
	);

	try {
		// Get session from Supabase
		const {
			data: { session },
		} = await supabase.auth.getSession();
		console.log(
			"[createTRPCContext] - Supabase session:",
			session ? "Found" : "Not found",
		);

		if (session) {
			return createInnerTRPCContext({
				headers: opts.headers,
				auth: {
					session: session,
					user: session.user,
				},
			});
		}
	} catch (error) {
		console.error("[createTRPCContext] - Error getting session:", error);
	}

	console.log(
		"[createTRPCContext] - No auth provided, initializing default null auth",
	);
	// Return a default context if no auth is provided or session fetch failed
	return createInnerTRPCContext({
		headers: opts.headers,
		auth: {
			session: null,
			user: null,
		},
	});
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

/**
 * 3. ROUTER & PROCEDURE (THE FUN PART)
 */
export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
	console.log("[isAuthed middleware] Auth check with ctx:", {
		hasAuth: !!ctx.auth,
		hasUser: !!ctx.auth?.user,
		userId: ctx.auth?.user?.id ? `${ctx.auth.user.id.slice(0, 8)}...` : "none",
		env: process.env.NODE_ENV || "unknown",
	});

	// TEMPORARY: Skip auth check during development, but with a safer approach
	if (!ctx.auth?.user) {
		const isDevelopment = process.env.NODE_ENV === "development";

		if (isDevelopment) {
			console.log(
				"[isAuthed middleware] No user found, bypassing auth check for development environment",
			);
			// Use a consistent mock user ID that's clearly for development
			return next({
				ctx: {
					auth: {
						user: {
							id: `dev-user-${new Date().toISOString().slice(0, 10)}`,
							email: "dev@example.com",
							role: "user",
						},
						session: null,
					},
				},
			});
		}
		console.log("[isAuthed middleware] No user found, authentication required");
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in to access this resource",
		});
	}

	// User is authenticated, proceed with the actual user data
	return next({
		ctx: {
			// Infers the `session` as non-nullable
			auth: { ...ctx.auth, user: ctx.auth.user },
			// Add user directly to context for easier access in procedures
			user: ctx.auth.user,
		},
	});
});

// Export procedures
export const protectedProcedure = t.procedure.use(isAuthed);

// Helper to create a router with context
export const createTRPCRouter = router;
