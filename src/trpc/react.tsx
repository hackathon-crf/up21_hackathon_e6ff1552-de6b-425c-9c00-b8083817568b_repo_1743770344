"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError, httpBatchStreamLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

import type { AppRouter } from "~/server/api/root";
import { getUrl, transformer } from "./shared";

export const api = createTRPCReact<AppRouter>();

/**
 * Formats and logs TRPCClientError details
 */
function formatTRPCError(error: unknown) {
	if (error instanceof TRPCClientError) {
		console.error("TRPC Error:", error.message);
	} else if (error instanceof Error) {
		console.error(`Error: ${error.message}`);
	} else {
		console.error("Unknown error:", error);
	}
}

/**
 * Provider component for tRPC React integration
 */
export function TRPCReactProvider(props: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: false,
						refetchOnWindowFocus: false,
					},
					mutations: {
						onError: formatTRPCError,
					},
				},
			}),
	);

	const [trpcClient] = useState(() => {
		return api.createClient({
			links: [
				// Logger link for development (can be conditionally disabled in production)
				loggerLink({
					enabled: () => process.env.NODE_ENV === "development",
				}),
				// Main link for tRPC communication
				httpBatchStreamLink({
					url: getUrl(),
					transformer, // In tRPC v11, transformer is passed to the link
					headers() {
						return {
							"x-trpc-source": "react",
							"Content-Type": "application/json",
						};
					},
				}),
			],
		});
	});

	return (
		<QueryClientProvider client={queryClient}>
			<api.Provider client={trpcClient} queryClient={queryClient}>
				{props.children}
			</api.Provider>
		</QueryClientProvider>
	);
}
