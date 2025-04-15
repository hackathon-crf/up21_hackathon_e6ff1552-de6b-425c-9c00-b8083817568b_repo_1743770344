"use client";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { useDebugRenders } from "~/lib/client-utils";
import { cn, debugColors } from "~/lib/utils";

const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
				destructive:
					"border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
				outline:
					"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	// Add debug render tracking
	useDebugRenders("Badge", debugColors.badge, {
		className,
		variant,
		asChild,
		...props,
	});

	const Comp = asChild ? Slot : "span";

	// Debug log right before render
	// console.log(`%c[Badge] About to render with:`, debugColors.badge, {
	//   className,
	//   variant,
	//   asChild,
	//   computedClassName: cn(badgeVariants({ variant }), className),
	//   props
	// })

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

// Export a memoized version to prevent unnecessary re-renders
const MemoizedBadge = React.memo(Badge, (prevProps, nextProps) => {
	// Debug comparison
	const areEqual =
		prevProps.className === nextProps.className &&
		prevProps.variant === nextProps.variant &&
		prevProps.asChild === nextProps.asChild;

	// console.log(`%c[Badge] Memo comparison:`, debugColors.badge, {
	//   prevProps,
	//   nextProps,
	//   areEqual,
	// });

	return areEqual;
});

// Export both the original and memoized versions
export { MemoizedBadge as Badge, badgeVariants };
