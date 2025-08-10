import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Debug environment flag - set to false in production
export const DEBUG_MODE = process.env.NODE_ENV === "development";

// Color-coded console logging for different components
export const debugColors = {
	tooltip: "color: #ff9900",
	badge: "color: #cc66ff",
};
