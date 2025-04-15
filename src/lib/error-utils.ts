/**
 * Error handling utilities
 */

export interface ErrorWithMessage {
	message: string;
	statusCode?: number;
	name?: string;
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
	return (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof (error as Record<string, unknown>).message === "string"
	);
}

export function toErrorWithMessage(error: unknown): ErrorWithMessage {
	if (isErrorWithMessage(error)) {
		return error;
	}

	try {
		if (error instanceof Error) {
			return error;
		}

		if (typeof error === "string") {
			return new Error(error);
		}

		// For completely unknown errors
		return new Error(
			"An unknown error occurred. Please try again or contact support.",
		);
	} catch {
		// If all else fails
		return new Error(
			"An unknown error occurred. Please try again or contact support.",
		);
	}
}

export function getErrorMessage(error: unknown): string {
	return toErrorWithMessage(error).message;
}
