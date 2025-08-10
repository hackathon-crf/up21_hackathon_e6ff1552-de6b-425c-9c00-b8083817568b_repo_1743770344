import { redirect } from "next/navigation";

// This is the root page that redirects to the default locale
// The actual app content is in /app/[locale]/page.tsx
export default function RootPage() {
	// Always redirect to default locale (French)
	redirect("/fr");
}
