import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { HydrateClient } from "~/trpc/server";

// Add export const dynamic = 'force-dynamic' to prevent static generation
export const dynamic = 'force-dynamic';

export default async function Home() {
	// Check if user is authenticated
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get: async (name) => {
					try {
						const cookieStore = await cookies();
						const cookie = cookieStore.get(name);
						return cookie?.value;
					} catch (error) {
						console.error('Error getting cookie:', error);
						return undefined;
					}
				},
				set: () => {
					// Not needed for server-rendered page
				},
				remove: () => {
					// Not needed for server-rendered page
				},
			},
		}
	);
	
	// ONLY use getUser() for authentication - this is the secure method
	// that validates auth with the Supabase Auth server
	const { data: { user } } = await supabase.auth.getUser();

	// If verified user is logged in, redirect to dashboard
	if (user) {
		redirect('/dashboard');
	}

	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-indigo-900 text-white">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
					<h1 className="text-center font-extrabold text-5xl tracking-tight sm:text-[5rem]">
						Flashcard <span className="text-yellow-400">SRS</span>
					</h1>
					
					<p className="text-center text-xl">
						A powerful spaced repetition system for effective learning
					</p>
					
					<div className="flex flex-col gap-4 sm:flex-row">
						<Link
							className="rounded-lg bg-white px-8 py-3 text-center font-bold text-blue-600 shadow-lg transition hover:bg-gray-100"
							href="/login"
						>
							Sign In
						</Link>
						<Link
							className="rounded-lg bg-yellow-400 px-8 py-3 text-center font-bold text-blue-900 shadow-lg transition hover:bg-yellow-300"
							href="/signup"
						>
							Create Account
						</Link>
					</div>
					
					<div className="mt-12 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
						<div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
							<h3 className="mb-2 font-bold text-xl">Spaced Repetition</h3>
							<p>Study smarter with our scientifically-proven spaced repetition algorithm.</p>
						</div>
						
						<div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
							<h3 className="mb-2 font-bold text-xl">AI-Powered</h3>
							<p>Generate flashcards and get personalized help with our AI assistant.</p>
						</div>
						
						<div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
							<h3 className="mb-2 font-bold text-xl">Multiplayer</h3>
							<p>Challenge friends to flashcard games and compete for the high score.</p>
						</div>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}