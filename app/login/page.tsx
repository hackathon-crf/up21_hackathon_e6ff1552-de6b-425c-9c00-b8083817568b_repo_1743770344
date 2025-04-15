"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "~/components/auth/AuthProvider";

function LoginPageContent() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const { signIn, isLoading } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		try {
			await signIn(email, password);
			router.push(redirectTo);
		} catch (err) {
			setError("Invalid login credentials");
			console.error("Login error:", err);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
				<h1 className="mb-6 text-center font-bold text-3xl">Login</h1>

				{error && (
					<div className="mb-4 rounded-md bg-red-50 p-4 text-red-700 text-sm">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="email"
							className="block font-medium text-gray-700 text-sm"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block font-medium text-gray-700 text-sm"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
						/>
					</div>

					<div>
						<button
							type="submit"
							disabled={isLoading}
							className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
						>
							{isLoading ? "Signing in..." : "Sign in"}
						</button>
					</div>
				</form>

				<div className="mt-6 text-center text-sm">
					<p>
						Don&apos;t have an account?{" "}
						<Link
							href="/signup"
							className="font-medium text-blue-600 hover:text-blue-500"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-gray-50">
					<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
						<h1 className="mb-6 text-center font-bold text-3xl">Login</h1>
						<div className="flex justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
						</div>
					</div>
				</div>
			}
		>
			<LoginPageContent />
		</Suspense>
	);
}
