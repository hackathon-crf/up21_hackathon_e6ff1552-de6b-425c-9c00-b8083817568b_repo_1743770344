"use client";

import { Check, Copy, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

interface QRCodeDisplayProps {
	/**
	 * The URL to encode in the QR code
	 */
	url: string;
	/**
	 * Text to display below the QR code
	 */
	text?: string;
	/**
	 * Optional game code to display and copy
	 */
	gameCode?: string;
	/**
	 * Optional class name for styling
	 */
	className?: string;
}

const QRCodeDisplay = ({
	url,
	text,
	gameCode,
	className,
}: QRCodeDisplayProps) => {
	const [copied, setCopied] = useState(false);

	// Function to copy the game code to clipboard
	const copyGameCode = () => {
		if (gameCode) {
			navigator.clipboard.writeText(gameCode);
			setCopied(true);

			// Reset copied state after 2 seconds
			setTimeout(() => {
				setCopied(false);
			}, 2000);
		}
	};

	// Function to download QR code as PNG
	const downloadQR = () => {
		const element = document.getElementById("game-qrcode");
		const svg = element instanceof SVGElement ? element : null;
		if (svg) {
			// Create a canvas element
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const svgData = new XMLSerializer().serializeToString(svg);
			const img = new Image();
			
			// Set canvas size from props or default QR code size
			canvas.width = 180;  // Same as the size prop
			canvas.height = 180; // Same as the size prop
			
			// Create a data URL from the SVG
			const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
			const URL = window.URL || window.webkitURL || window;
			const svgUrl = URL.createObjectURL(svgBlob);
			
			img.onload = () => {
				// Once the image has loaded, draw it on the canvas and download
				if (ctx) {
					ctx.drawImage(img, 0, 0);
					URL.revokeObjectURL(svgUrl);
					
					// Download the canvas as PNG
					const pngUrl = canvas.toDataURL("image/png");
					const downloadLink = document.createElement("a");
					downloadLink.href = pngUrl;
					downloadLink.download = `game-invite-${gameCode || "qrcode"}.png`;
					document.body.appendChild(downloadLink);
					downloadLink.click();
					document.body.removeChild(downloadLink);
				}
			};
			
			img.src = svgUrl;
		}
	};

	return (
		<Card className={`flex flex-col items-center p-4 ${className || ""}`}>
			<div className="mb-3 rounded-lg bg-white p-3">
				<QRCodeSVG
					id="game-qrcode"
					value={url}
					size={180}
					level="H" // High error correction capability
					includeMargin={true}
					className="rounded-md"
				/>
			</div>

			{gameCode && (
				<div className="mt-2 mb-3 flex items-center gap-2">
					<span className="font-bold font-mono text-lg tracking-wider">
						{gameCode}
					</span>
					<Button
						variant="ghost"
						size="icon"
						onClick={copyGameCode}
						title="Copy game code"
					>
						{copied ? (
							<Check className="h-4 w-4" />
						) : (
							<Copy className="h-4 w-4" />
						)}
					</Button>
				</div>
			)}

			{text && (
				<p className="mb-3 text-center text-muted-foreground text-sm">{text}</p>
			)}

			<Button variant="outline" size="sm" onClick={downloadQR} className="mt-1">
				<Download className="mr-2 h-4 w-4" />
				Download QR Code
			</Button>
		</Card>
	);
};

export default QRCodeDisplay;
