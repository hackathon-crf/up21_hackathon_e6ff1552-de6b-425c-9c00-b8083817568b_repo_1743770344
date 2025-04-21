"use client";

import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "~/components/auth/AuthProvider";

export default function Home() {
	const router = useRouter();
	const { user, isLoading } = useAuth();

	useEffect(() => {
		// Add a slight delay to avoid race conditions with AuthProvider
		const redirectTimer = setTimeout(() => {
			if (isLoading) return; // Wait until auth state is loaded

			// If user is authenticated, redirect to dashboard
			// Otherwise, redirect to login
			if (user) {
				console.log(
					"Home page: User is authenticated, redirecting to dashboard",
				);
				router.replace("/dashboard");
			} else {
				console.log(
					"Home page: User is not authenticated, redirecting to login",
				);
				router.replace("/auth/login");
			}
		}, 300); // Small delay to let AuthProvider's logic complete first

		return () => clearTimeout(redirectTimer);
	}, [router, user, isLoading]);

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
