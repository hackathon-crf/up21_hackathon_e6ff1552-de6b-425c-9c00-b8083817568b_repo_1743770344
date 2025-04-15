"use client";

import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastIcon,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "~/components/ui/toast";
import { useToast } from "~/hooks/use-toast";

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map(({ id, title, description, action, variant, ...props }) => (
				<Toast key={id} variant={variant} {...props}>
					<ToastIcon variant={variant} />
					<div className="grid gap-1">
						{title && <ToastTitle>{title}</ToastTitle>}
						{description && <ToastDescription>{description}</ToastDescription>}
						{action && <div className="mt-2">{action}</div>}
					</div>
					<ToastClose />
				</Toast>
			))}
			<ToastViewport />
		</ToastProvider>
	);
}
