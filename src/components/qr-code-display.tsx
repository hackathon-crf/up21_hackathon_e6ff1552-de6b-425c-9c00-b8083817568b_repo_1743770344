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
	/**
	 * Optional size for QR code SVG (default: 180)
	 */
	size?: number;
	/**
	 * Whether to show compact mode (fewer controls, smaller size)
	 */
	compact?: boolean;
}

const QRCodeDisplay = ({
	url,
	text,
	gameCode,
	className,
	size = 180,
	compact = false,
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
			canvas.width = 180; // Same as the size prop
			canvas.height = 180; // Same as the size prop

			// Create a data URL from the SVG
			const svgBlob = new Blob([svgData], {
				type: "image/svg+xml;charset=utf-8",
			});
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
		<Card
			className={`flex flex-col items-center ${compact ? "p-2" : "p-4"} ${className || ""}`}
		>
			<div className={`${compact ? "mb-2" : "mb-4"} rounded-lg bg-white p-3`}>
				<QRCodeSVG
					id="game-qrcode"
					value={url}
					size={compact ? 140 : size}
					level="H" // High error correction capability
					includeMargin={true}
					className="rounded-md"
				/>
			</div>

			{gameCode && (
				<div
					className={`${compact ? "mt-1 mb-2" : "mt-2 mb-3"} flex items-center gap-2`}
				>
					<span
						className={`font-bold font-mono ${compact ? "text-md" : "text-2xl"} tracking-wider`}
					>
						{gameCode}
					</span>
					<Button
						variant="ghost"
						size="icon"
						onClick={copyGameCode}
						title="Copy game code"
						className={compact ? "h-7 w-7" : ""}
					>
						{copied ? (
							<Check className={`${compact ? "h-3 w-3" : "h-4 w-4"}`} />
						) : (
							<Copy className={`${compact ? "h-3 w-3" : "h-4 w-4"}`} />
						)}
					</Button>
				</div>
			)}

			{text && (
				<p
					className={`${compact ? "mb-2 text-xs" : "mb-3 text-base"} text-center text-muted-foreground`}
				>
					{text}
				</p>
			)}

			{!compact && (
				<Button
					variant="outline"
					size="sm"
					onClick={downloadQR}
					className="mt-1 mb-2" /* Added bottom margin to provide more space */
				>
					<Download className="mr-2 h-4 w-4" />
					Download QR Code
				</Button>
			)}
		</Card>
	);
};

export default QRCodeDisplay;
