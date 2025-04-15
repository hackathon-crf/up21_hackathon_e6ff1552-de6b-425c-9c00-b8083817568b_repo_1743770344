import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";
import type { AppRouter } from "~/server/api/root";

// Export transformer for consistent use across client and server
export const transformer = superjson;

export function getBaseUrl() {
	if (typeof window !== "undefined") {
		// browser should use relative path
		return "";
	}

	if (process.env.VERCEL_URL) {
		// SSR should use vercel url
		return `https://${process.env.VERCEL_URL}`;
	}

	// dev SSR should use localhost
	return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getUrl() {
	return `${getBaseUrl()}/api/trpc`;
}

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
