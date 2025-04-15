import type React from "react";

export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="min-h-screen w-full">{children}</div>;
}
