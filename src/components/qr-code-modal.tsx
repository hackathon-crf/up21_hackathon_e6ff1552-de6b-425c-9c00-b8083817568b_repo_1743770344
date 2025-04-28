"use client";

import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import QRCodeDisplay from "./qr-code-display";

interface QRCodeModalProps {
	/**
	 * Whether the modal is open
	 */
	open: boolean;
	/**
	 * Function to handle closing the modal
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * The base URL of the application (for generating the join URL)
	 */
	baseUrl: string;
	/**
	 * The game code to encode in the QR code URL
	 */
	gameCode: string;
	/**
	 * The ID of the lobby
	 */
	lobbyId: string | number;
}

const QRCodeModal = ({
	open,
	onOpenChange,
	baseUrl,
	gameCode,
	lobbyId,
}: QRCodeModalProps) => {
	// Remove trailing slash if present
	const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

	// Generate the join URL
	const joinUrl = `${cleanBaseUrl}/multiplayer?join=${gameCode}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Share Game Invitation</DialogTitle>
					<DialogDescription>
						Let others join by scanning this QR code or using the game code
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center justify-center py-4">
					<QRCodeDisplay
						url={joinUrl}
						gameCode={gameCode}
						text="Scan to join this multiplayer session"
					/>

					<p className="mt-4 text-center text-muted-foreground text-sm">
						Players can also manually enter the code on the join page
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default QRCodeModal;
