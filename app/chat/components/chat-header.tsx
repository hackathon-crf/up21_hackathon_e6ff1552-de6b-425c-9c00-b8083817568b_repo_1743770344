"use client";

import { Bot, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";

interface ChatHeaderProps {
	title: string;
	description: string;
}

export function ChatHeader({ title, description }: ChatHeaderProps) {
	return (
		<div className="flex items-center justify-between p-4">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<img src="/mascot.svg" alt="Mascot" className="h-5 w-5" />
				</div>
				<div>
					<h1 className="font-semibold text-xl">{title}</h1>
					<p className="text-muted-foreground text-sm">{description}</p>
				</div>
			</div>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							asChild
							size="icon"
							className="h-10 w-10 rounded-full shadow-md"
						>
							<Link href="/chat/settings">
								<Settings className="h-5 w-5" />
								<span className="sr-only">Chat Settings</span>
							</Link>
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Chat Settings</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
