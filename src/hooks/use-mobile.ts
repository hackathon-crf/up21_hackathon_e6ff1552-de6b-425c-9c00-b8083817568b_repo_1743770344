"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if the current viewport is a mobile device
 * based on a breakpoint of 768px (typical md breakpoint in Tailwind)
 */
export function useIsMobile(): boolean {
	// Default to non-mobile to ensure SSR doesn't get mobile specific layout
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		// Check if window is defined (client-side)
		if (typeof window === "undefined") return;

		// Function to update state based on window width
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		// Initial check
		checkIsMobile();

		// Add event listener for window resize
		window.addEventListener("resize", checkIsMobile);

		// Clean up event listener
		return () => {
			window.removeEventListener("resize", checkIsMobile);
		};
	}, []);

	return isMobile;
}
