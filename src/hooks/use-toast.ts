"use client";

import * as React from "react";

import type { ToastActionElement, ToastProps } from "~/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

// --- Adjusted ToasterToast type ---
type ToasterToast = Omit<ToastProps, "title" | "description"> & {
	// Omit conflicting props
	id: string;
	title?: React.ReactNode; // Add back with ReactNode type
	description?: React.ReactNode; // Add back with ReactNode type
	action?: ToastActionElement;
	variant?: "default" | "success" | "info" | "warning" | "destructive";
};
// ---------------------------------

// --- Add Promise Toast Types ---
type ToastContentProps = {
	title: React.ReactNode;
	description?: React.ReactNode;
};

type PromiseToastProps<TData = unknown> = {
	loading: ToastContentProps;
	success: ((data: TData) => ToastContentProps) | ToastContentProps;
	error: ((error: unknown) => ToastContentProps) | ToastContentProps;
	duration?: number; // Optional duration for success/error toasts
};
// ------------------------------

const actionTypes = {
	ADD_TOAST: "ADD_TOAST",
	UPDATE_TOAST: "UPDATE_TOAST",
	DISMISS_TOAST: "DISMISS_TOAST",
	REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
	count = (count + 1) % Number.MAX_VALUE;
	return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
	| {
			type: ActionType["ADD_TOAST"];
			toast: ToasterToast;
	  }
	| {
			type: ActionType["UPDATE_TOAST"];
			toast: Partial<ToasterToast>;
	  }
	| {
			type: ActionType["DISMISS_TOAST"];
			toastId?: ToasterToast["id"];
	  }
	| {
			type: ActionType["REMOVE_TOAST"];
			toastId?: ToasterToast["id"];
	  };

interface State {
	toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case actionTypes.ADD_TOAST:
			return {
				...state,
				toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
			};

		case actionTypes.UPDATE_TOAST:
			return {
				...state,
				toasts: state.toasts.map((t) =>
					t.id === action.toast.id ? { ...t, ...action.toast } : t,
				),
			};

		case actionTypes.DISMISS_TOAST: {
			const { toastId } = action;

			// ! Side effects ! - This could be extracted into a dismissToast() action,
			// but I'll keep it here for simplicity
			if (toastId) {
				if (toastTimeouts.has(toastId)) {
					clearTimeout(toastTimeouts.get(toastId));
					toastTimeouts.delete(toastId);
				}
			} else {
				for (const [id, timeout] of toastTimeouts.entries()) {
					clearTimeout(timeout);
					toastTimeouts.delete(id);
				}
			}

			return {
				...state,
				toasts: state.toasts.map((t) =>
					t.id === toastId || toastId === undefined
						? {
								...t,
								open: false,
							}
						: t,
				),
			};
		}
		case actionTypes.REMOVE_TOAST:
			if (action.toastId === undefined) {
				return {
					...state,
					toasts: [],
				};
			}
			return {
				...state,
				toasts: state.toasts.filter((t) => t.id !== action.toastId),
			};
	}
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
	memoryState = reducer(memoryState, action);
	for (const listener of listeners) {
		listener(memoryState);
	}
}

interface Toast extends Omit<ToasterToast, "id"> {}

// Define the return type of toast function
type ToastReturn = {
	id: string;
	dismiss: () => void;
	update: (props: ToasterToast) => void;
};

// Define the Toast function with promise method
interface ToastFunction {
	(props: Toast): ToastReturn;
	promise: typeof promise;
}

// Create the toast function
const toast: ToastFunction = ((props: Toast) => {
	const id = genId();

	const update = (props: ToasterToast) =>
		dispatch({
			type: actionTypes.UPDATE_TOAST,
			toast: { ...props, id },
		});

	const dismiss = () =>
		dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

	// Auto-dismiss after specified duration (use default if not provided)
	const duration = props.duration || TOAST_REMOVE_DELAY;

	dispatch({
		type: actionTypes.ADD_TOAST,
		toast: {
			...props,
			id,
			open: true,
			onOpenChange: (open) => {
				if (!open) dismiss();
			},
		},
	});

	// Set up auto-dismiss
	if (duration !== Number.POSITIVE_INFINITY) {
		setTimeout(dismiss, duration);
	}

	return {
		id: id,
		dismiss,
		update,
	};
}) as ToastFunction;

// --- Add Promise Toast Function ---
async function promise<TData>(
	promise: Promise<TData>,
	props: PromiseToastProps<TData>,
) {
	const id = genId();

	// Show loading toast immediately
	dispatch({
		type: actionTypes.ADD_TOAST,
		toast: {
			...props.loading,
			id,
			variant: "info", // Or a specific loading variant if you have one
			open: true,
			duration: Number.POSITIVE_INFINITY, // Keep loading toast open until promise settles
			onOpenChange: (open) => {
				if (!open) dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
			},
		},
	});

	try {
		const data = await promise;
		// Handle both function and object formats
		const successProps =
			typeof props.success === "function" ? props.success(data) : props.success;
		const duration = props.duration ?? TOAST_REMOVE_DELAY;

		// Update to success toast
		dispatch({
			type: actionTypes.UPDATE_TOAST,
			toast: {
				...successProps,
				id,
				variant: "success",
				duration: duration,
			},
		});

		// Auto-dismiss success toast
		if (duration !== Number.POSITIVE_INFINITY) {
			setTimeout(
				() => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id }),
				duration,
			);
		}

		return data; // Return the resolved data
	} catch (error) {
		// Handle both function and object formats
		const errorProps =
			typeof props.error === "function" ? props.error(error) : props.error;
		const duration = props.duration ?? TOAST_REMOVE_DELAY;

		// Update to error toast
		dispatch({
			type: actionTypes.UPDATE_TOAST,
			toast: {
				...errorProps,
				id,
				variant: "destructive",
				duration: duration,
			},
		});

		// Auto-dismiss error toast
		if (duration !== Number.POSITIVE_INFINITY) {
			setTimeout(
				() => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id }),
				duration,
			);
		}

		throw error; // Re-throw the error
	}
}
// ------------------------------

// Helper functions for common toast types
function success(props: Omit<Toast, "variant">) {
	return toast({ ...props, variant: "success" });
}

function info(props: Omit<Toast, "variant">) {
	return toast({ ...props, variant: "info" });
}

function warning(props: Omit<Toast, "variant">) {
	return toast({ ...props, variant: "warning" });
}

function error(props: Omit<Toast, "variant">) {
	return toast({ ...props, variant: "destructive" });
}

// Assign the promise function to toast
toast.promise = promise;

function useToast() {
	const [state, setState] = React.useState<State>(memoryState);

	React.useEffect(() => {
		listeners.push(setState);
		return () => {
			const index = listeners.indexOf(setState);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		};
	}, []);

	return {
		...state,
		toast,
		success,
		info,
		warning,
		error,
		promise,
		dismiss: (toastId?: string) =>
			dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
	};
}

export { useToast, toast, success, info, warning, error, promise }; // <-- Export promise
