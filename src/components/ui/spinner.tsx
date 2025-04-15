"use client";

import { cn } from "~/lib/utils";

interface SpinnerProps {
	className?: string;
	size?: "sm" | "default" | "lg";
}

export function Spinner({ className, size = "default" }: SpinnerProps) {
	const sizeClasses = {
		sm: "h-3 w-3 border-[1.5px]",
		default: "h-4 w-4 border-2",
		lg: "h-6 w-6 border-2",
	};

	return (
		<span
			className={cn(
				"inline-block animate-spin rounded-full border-current border-t-transparent",
				sizeClasses[size],
				className,
			)}
		/>
	);
}
