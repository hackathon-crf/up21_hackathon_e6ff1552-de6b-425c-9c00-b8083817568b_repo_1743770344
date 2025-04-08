import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr';

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  // Extract auth data from request directly without using cookies() API
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // Not needed for API routes as we don't modify response
        },
        remove(name, options) {
          // Not needed for API routes as we don't modify response
        },
      },
    }
  );

  // ONLY use getUser() for authentication - this is the secure method
  // that validates auth with the Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get session separately if needed, but never use session.user for auth
  const { data: { session } } = await supabase.auth.getSession();

	return createTRPCContext({
		headers: req.headers,
    // Pass pre-fetched auth data
    auth: {
      session,
      user,
    },
	});
};

const handler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError:
			env.NODE_ENV === "development"
				? ({ path, error }) => {
						console.error(
							`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
						);
					}
				: undefined,
	});

export { handler as GET, handler as POST };
