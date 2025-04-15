import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

export const createServerClient = () => {
	return createClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.SUPABASE_SERVICE_ROLE_KEY,
		{
			auth: {
				persistSession: false,
			},
		},
	);
};

export const createBrowserClient = () => {
	return createClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			auth: {
				persistSession: true,
				autoRefreshToken: true,
			},
		},
	);
};
