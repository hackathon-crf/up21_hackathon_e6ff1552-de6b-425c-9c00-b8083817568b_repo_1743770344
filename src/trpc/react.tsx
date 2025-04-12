"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  TRPCClientError,
  loggerLink,
  httpBatchStreamLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

import type { AppRouter } from "~/server/api/root";
import { getUrl, transformer } from "./shared";

export const api = createTRPCReact<AppRouter>();

// Enhanced error handling for trpc clients
function formatTRPCError(error: unknown) {
  if (error instanceof TRPCClientError) {
    console.error("[TRPC Client] Error details:", {
      message: error.message,
      name: error.name,
      cause: error.cause,
      data: error.data,
      // Extract full JSON representation
      json: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
  } else {
    console.error("[TRPC Client] Unknown error type:", error);
  }
}

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => 
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
        mutations: {
          // Added to help with debugging
          onError: (error) => {
            console.error("Global mutation error handler:", error);
            formatTRPCError(error);
          },
        },
      },
    })
  );

  const [trpcClient] = useState(() => {
    console.log("[tRPC] Creating client");
    
    return api.createClient({
      links: [
        loggerLink({
          enabled: () => true,
        }),
        httpBatchStreamLink({
          url: getUrl(),
          transformer, // In tRPC v11, transformer goes here
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