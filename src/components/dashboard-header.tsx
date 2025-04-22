import { Bell } from "lucide-react";

import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";

interface DashboardHeaderProps {
	title: string;
	description?: string;
	className?: string;
}

export function DashboardHeader({
	title,
	description,
	className,
}: DashboardHeaderProps) {
	return (
		<div
			className={`sticky top-0 z-10 border-b bg-background ${className ?? ""}`}
		>
			<div className="flex flex-col px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
				<div className="mb-2 sm:mb-0">
					<h1 className="font-bold text-xl sm:text-2xl">{title}</h1>
					{description && (
						<p className="text-muted-foreground text-xs sm:text-sm">
							{description}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8 sm:h-9 sm:w-9"
					>
						<Bell className="h-4 w-4" />
						<span className="sr-only">Notifications</span>
					</Button>
					<ModeToggle />
				</div>
			</div>
		</div>
	);
}
