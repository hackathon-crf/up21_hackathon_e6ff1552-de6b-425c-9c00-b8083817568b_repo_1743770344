import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Go to Login
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}