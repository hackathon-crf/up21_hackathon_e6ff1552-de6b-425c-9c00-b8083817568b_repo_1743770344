import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";

import {
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import { createCallerFactory } from "@trpc/server";

// Export the router's type signature
export type { AppRouter } from "~/server/api/root";

// Export reusable router elements
export { createTRPCRouter, publicProcedure, protectedProcedure };

// Export the context creation function
export { createTRPCContext };

// Factory function to create the tRPC caller
const createCaller = createCallerFactory(appRouter);

export const getServerAuthSession = async () => {
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return headers().get("cookie")?.split("; ").find(c => c.startsWith(`${name}=`))?.split("=")[1];
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

  return {
    user,
    session,
  };
};

export const createCaller = async () => {
  const auth = await getServerAuthSession();
  const ctx = await createTRPCContext({ headers: headers(), auth });
  return createCaller(ctx);
};