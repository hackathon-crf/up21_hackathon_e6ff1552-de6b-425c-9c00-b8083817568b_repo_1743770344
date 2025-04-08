import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "~/components/auth/AuthProvider";

export const metadata: Metadata = {
	title: "Flashcard SRS - Next.js Migration",
	description: "Flashcard learning app with spaced repetition system",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`}>
			<body>
				<TRPCReactProvider>
					<AuthProvider>
						{children}
					</AuthProvider>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
