// filepath: /home/lonestar/Desktop/Projects/cr-hackathon-secours/src/trpc/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "~/env";

import { appRouter } from "~/server/api/root";
import {
	createTRPCContext,
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

// Export the router's type signature
export type { AppRouter } from "~/server/api/root";

// Export reusable router elements
export { createTRPCRouter, publicProcedure, protectedProcedure };

// Export the context creation function
export { createTRPCContext };

export const getServerAuthSession = async () => {
	const cookieStore = await cookies();

	const supabase = createServerClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				get(name: string) {
					return cookieStore.get(name)?.value;
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	return {
		user,
		session,
	};
};

export const createCaller = async () => {
	const auth = await getServerAuthSession();

	// Create a standard Headers object from the cookie data
	const headersList = new Headers();
	const cookieStore = await cookies();
	const cookieData = cookieStore.getAll();

	if (cookieData.length > 0) {
		const cookieString = cookieData
			.map(
				(cookie: { name: string; value: string }) =>
					`${cookie.name}=${cookie.value}`,
			)
			.join("; ");
		headersList.set("cookie", cookieString);
	}

	const ctx = await createTRPCContext({
		headers: headersList,
		auth,
	});

	return appRouter.createCaller(ctx);
};
