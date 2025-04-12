"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn, debugColors } from "~/lib/utils";
import { useDebugRenders } from "~/lib/client-utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
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
