"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

// Define TypeScript type for the Attribute
type Attribute = "class" | "data-theme" | "data-mode";

export interface ThemeProviderProps {
	children: React.ReactNode;
	attribute?: Attribute | Attribute[];
	defaultTheme?: string;
	enableSystem?: boolean;
	disableTransitionOnChange?: boolean;
	storageKey?: string;
	forcedTheme?: string;
	themes?: string[];
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
