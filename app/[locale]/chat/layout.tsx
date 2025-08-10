"use client";

import { useIsMobile } from "~/hooks/use-mobile";
import { ChatSidebar } from "./components/chat-sidebar";

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const isMobile = useIsMobile();

	return (
		<div className="relative flex h-screen overflow-hidden">
			{/* Only show sidebar on desktop */}
			{!isMobile && (
				<div className="relative h-screen w-[360px] shrink-0 overflow-hidden border-border border-r bg-background">
					<ChatSidebar />
				</div>
			)}
			<main className="flex-1 overflow-hidden">{children}</main>
		</div>
	);
}
