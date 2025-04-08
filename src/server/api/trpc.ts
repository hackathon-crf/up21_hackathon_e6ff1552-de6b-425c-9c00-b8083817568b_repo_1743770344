/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';
import { env } from "~/env";

interface CreateContextOptions {
  headers: Headers;
  auth?: {
    session: Session | null;
    user: User | null;
  }
}

export const createTRPCContext = async (opts: CreateContextOptions) => {
  // If auth data is passed directly (from API route), use it
  if (opts.auth) {
    return {
      db,
      session: opts.auth.session,
      user: opts.auth.user,
      headers: opts.headers,
    };
  }

  // Otherwise for RSC/SSR, get auth data using Next.js cookies
  try {
    // Get supabase server client using server component headers
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: async (name) => {
            try {
              const cookieStore = await cookies();
              const cookie = cookieStore.get(name);
              return cookie?.value;
            } catch (error) {
              console.error('Error getting cookie:', error);
              return undefined;
            }
          },
          set: () => {
            // Not applicable for server components
          },
          remove: () => {
            // Not applicable for server components
          },
        },
      }
    );

    // ONLY use getUser() for authentication - this is the secure method
    // that validates auth with the Supabase Auth server
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get session separately if needed, but never use session.user for auth
    const { data: { session } } = await supabase.auth.getSession();

    return {
      db,
      // Only pass the validated user from getUser()
      session, 
      user, // This is the verified user from getUser(), not session.user
      headers: opts.headers,
    };
  } catch (error) {
    console.error("Error in createTRPCContext:", error);
    // Fall back to unauthenticated context
    return {
      db,
      session: null,
      user: null,
      headers: opts.headers,
    };
  }
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
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
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();

	if (t._config.isDev) {
		// artificial delay in dev
		const waitMs = Math.floor(Math.random() * 400) + 100;
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}

	const result = await next();

	const end = Date.now();
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

	return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Auth middleware
 * 
 * This middleware ensures that the user is authenticated before allowing access
 * to protected procedures
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error("UNAUTHORIZED: You must be logged in to access this resource");
  }
  
  return next({
    ctx: {
      // Infer type to ensure user exists
      user: ctx.user,
      session: ctx.session,
    },
  });
});

/**
 * Protected (authenticated) procedure
 * 
 * This is the procedure you should use for any routes that require authentication.
 * It ensures the user is logged in before allowing access.
 */
export const protectedProcedure = t.procedure.use(timingMiddleware).use(enforceUserIsAuthed);