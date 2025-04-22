"use client";

import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "~/components/auth/AuthProvider";

export default function Home() {
	const router = useRouter();
	const { user, isLoading } = useAuth();

	// Add immediate debugging info when component renders
	console.log("🔍 ROOT PAGE RENDER", {
		timestamp: new Date().toISOString(),
		hasUser: !!user,
		userEmail: user?.email,
		isAuthLoading: isLoading,
	});

	// Add a safeguard for stuck auth state - force redirect after timeout
	useEffect(() => {
		// Create a hard timeout that will force redirect after 3 seconds regardless of auth state
		const forceRedirectTimer = setTimeout(() => {
			console.log(
				"🔍 ROOT PAGE: FORCE REDIRECT - Auth state took too long, forcing redirect",
			);
			window.location.href = "/dashboard?force_redirect=true";
		}, 3000);

		return () => clearTimeout(forceRedirectTimer);
	}, []);

	useEffect(() => {
		console.log("🔍 ROOT PAGE EFFECT TRIGGERED", {
			timestamp: new Date().toISOString(),
			hasUser: !!user,
			isAuthLoading: isLoading,
		});

		// Create unique debug ID to track this specific effect run
		const debugId = Math.random().toString(36).substring(2, 8);
		console.log(`🔍 ROOT PAGE EFFECT RUN ID: ${debugId}`);

		// If we can guarantee this is an authenticated session somehow, force redirect
		// This could be from URL params, localStorage data or other cues
		const urlParams = new URLSearchParams(window.location.search);
		const forceRedirect = urlParams.get("force_redirect");

		if (forceRedirect) {
			console.log(
				`🔍 [${debugId}] ROOT PAGE: Force redirect parameter detected, bypassing auth checks`,
			);
			window.location.href = "/dashboard";
			return;
		}

		// Don't try redirect if still loading, unless 2 seconds have passed
		if (isLoading) {
			console.log(
				`🔍 [${debugId}] ROOT PAGE: Auth still loading, not redirecting yet`,
			);
			return;
		}

		console.log(`🔍 [${debugId}] ROOT PAGE: Auth ready, preparing redirect`);

		// Use localStorage instead of sessionStorage for better persistence
		const redirectKey = "home_redirect_initiated";
		const redirectTimestamp = localStorage.getItem(redirectKey);
		const now = Date.now();

		// Check if we've redirected recently (within last 5 seconds)
		if (redirectTimestamp && now - Number.parseInt(redirectTimestamp) < 5000) {
			console.log(
				`🔍 [${debugId}] ROOT PAGE: Recent redirect detected, preventing loop`,
				{
					lastRedirect: new Date(
						Number.parseInt(redirectTimestamp),
					).toISOString(),
					timeSince: `${now - Number.parseInt(redirectTimestamp)}ms`,
				},
			);
			return;
		}

		// Set the redirect timestamp to prevent loops
		localStorage.setItem(redirectKey, now.toString());

		try {
			// If user is authenticated, redirect to dashboard
			// Otherwise, redirect to login
			if (user) {
				console.log(
					`🔍 [${debugId}] ROOT PAGE: User is authenticated, redirecting to dashboard`,
					{ userEmail: user.email },
				);
				window.location.href = "/dashboard";
			} else {
				console.log(
					`🔍 [${debugId}] ROOT PAGE: User not authenticated, redirecting to login`,
				);
				window.location.href = "/auth/login";
			}
		} catch (error) {
			console.error(`🔍 [${debugId}] ROOT PAGE: Error during redirect:`, error);
		}
	}, [user, isLoading]);

	// Show a loading state while redirecting
	return (
		<div className="flex min-h-screen flex-col items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<div className="flex h-16 w-16 items-center justify-center rounded-md bg-red-600">
					<Shield className="h-10 w-10 text-white" />
				</div>
				<h1 className="font-bold text-3xl">Red Cross Training Hub</h1>
				<p className="text-muted-foreground">Redirecting to login...</p>
				<div className="mt-4 h-2 w-32 overflow-hidden rounded-full bg-muted">
					<div className="h-full w-1/3 animate-[pulse_1.5s_ease-in-out_infinite] bg-primary" />
				</div>
			</div>
		</div>
	);
}
