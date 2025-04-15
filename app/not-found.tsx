import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
			<h1 className="mb-4 font-bold text-4xl">404 - Page Not Found</h1>
			<p className="mb-6 text-lg text-muted-foreground">
				The page you're looking for doesn't exist or has been moved.
			</p>
			<div className="flex gap-4">
				<Link
					href="/auth/login"
					className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Go to Login
				</Link>
				<Link
					href="/dashboard"
					className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:bg-secondary/90"
				>
					Go to Dashboard
				</Link>
			</div>
		</div>
	);
}
