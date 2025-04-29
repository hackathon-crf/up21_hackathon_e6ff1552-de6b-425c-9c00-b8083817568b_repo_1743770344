import { QrCode, X } from "lucide-react";
import { useState } from "react";

import QRCodeDisplay from "~/components/qr-code-display";
import QRCodeModal from "~/components/qr-code-modal";
import { Button } from "~/components/ui/button";
import type { QRCodeState } from "~/lib/types";

interface ToggleableQRCodeProps {
	/**
	 * The URL to encode in the QR code
	 */
	url: string;
	/**
	 * The game code to display
	 */
	gameCode: string | undefined;
	/**
	 * Text to display with the QR code
	 */
	text?: string;
	/**
	 * Optional description text (only shown in preview mode)
	 */
	previewNote?: string;
	/**
	 * Optional ID for the QR code (used to identify in modals)
	 */
	id?: string | number;
	/**
	 * Current display state of the QR code
	 */
	state: QRCodeState | undefined;
	/**
	 * Whether the button is disabled
	 */
	disabled?: boolean;
	/**
	 * Callback when state changes
	 */
	onStateChange: (state: QRCodeState) => void;
	/**
	 * Base URL for constructing the full URL
	 */
	baseUrl: string;
}

/**
 * A component that provides a three-state QR code display with toggle button.
 * States: hidden, inline, modal
 */
export function ToggleableQRCode({
	url,
	gameCode,
	text,
	previewNote,
	id = "preview",
	state,
	disabled = false,
	onStateChange,
	baseUrl,
}: ToggleableQRCodeProps) {
	// Make sure state is never undefined in our component
	const currentState = state || "hidden";

	// Function to handle button click - cycle through states
	const handleToggle = () => {
		if (currentState === "hidden") onStateChange("inline");
		else if (currentState === "inline") onStateChange("modal");
		else onStateChange("hidden");
	};

	// Function to hide the QR code
	const handleHide = () => {
		onStateChange("hidden");
	};

	return (
		<>
			{/* QR Code Modal */}
			{currentState === "modal" && (
				<QRCodeModal
					open={currentState === "modal"}
					onOpenChange={(open) => {
						if (!open) onStateChange("hidden");
					}}
					baseUrl={baseUrl}
					gameCode={gameCode}
					lobbyId={id}
				/>
			)}

			{/* Button to toggle QR code display */}
			<Button
				variant={currentState !== "hidden" ? "default" : "outline"}
				size="icon"
				onClick={handleToggle}
				disabled={disabled}
				title={
					currentState === "hidden"
						? "Show QR Code"
						: currentState === "inline"
							? "Show QR Code in Modal"
							: "Hide QR Code"
				}
			>
				<QrCode className="h-4 w-4" />
				<span className="sr-only">Toggle QR code</span>
			</Button>

			{/* Inline QR code display */}
			{currentState === "inline" && (
				<div className="mt-4 rounded-lg border p-3">
					<div className="mb-1 flex justify-end">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleHide}
							className="h-6 w-6"
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
					<div className="flex flex-col items-center">
						<QRCodeDisplay
							url={url}
							gameCode={gameCode}
							text={text || "Scan to join this session"}
							className="w-full border-none p-2 shadow-none"
							compact={true}
						/>
						{previewNote && (
							<p className="mt-2 text-center text-muted-foreground text-xs">
								{previewNote}
							</p>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={() => onStateChange("modal")}
							className="mt-2"
						>
							<QrCode className="mr-2 h-3 w-3" />
							Show Full Screen
						</Button>
					</div>
				</div>
			)}
		</>
	);
}
