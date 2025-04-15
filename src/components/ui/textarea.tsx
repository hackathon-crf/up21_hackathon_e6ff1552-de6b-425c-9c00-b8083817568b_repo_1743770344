"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	maxRows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, maxRows, ...props }, ref) => {
		const textareaRef = React.useRef<HTMLTextAreaElement>(null);
		const combinedRef = useCombinedRefs(ref, textareaRef);

		// Auto-resize functionality
		React.useEffect(() => {
			const textarea = textareaRef.current;
			if (!textarea || !maxRows) return;

			const adjustHeight = () => {
				textarea.style.height = "auto";

				const lineHeight = Number.parseInt(
					getComputedStyle(textarea).lineHeight,
				);
				const paddingTop = Number.parseInt(
					getComputedStyle(textarea).paddingTop,
				);
				const paddingBottom = Number.parseInt(
					getComputedStyle(textarea).paddingBottom,
				);

				const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

				textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
			};

			textarea.addEventListener("input", adjustHeight);
			adjustHeight(); // Initial adjustment

			return () => {
				textarea.removeEventListener("input", adjustHeight);
			};
		}, [maxRows]);

		return (
			<textarea
				className={cn(
					"flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={combinedRef}
				{...props}
			/>
		);
	},
);
Textarea.displayName = "Textarea";

// Helper to combine multiple refs
function useCombinedRefs<T>(...refs: Array<React.ForwardedRef<T>>) {
	const targetRef = React.useRef<T>(null);

	React.useEffect(() => {
		refs.forEach((ref) => {
			if (!ref) return;

			if (typeof ref === "function") {
				ref(targetRef.current);
			} else {
				ref.current = targetRef.current;
			}
		});
	}, [refs]);

	return targetRef;
}

export { Textarea };
