"use client";

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

/**
 * This is a minimal fallback component that will be used if the main chat
 * components fail to render due to tRPC or other errors.
 */
export function EmergencyFallback() {
	const [error, setError] = useState<string | null>(null);
	const [sessions, setSessions] = useState([
		{
			id: "fallback-1",
			title: "Fallback Chat 1",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			is_pinned: false,
		},
		{
			id: "fallback-2",
			title: "Fallback Chat 2",
			created_at: new Date(Date.now() - 86400000).toISOString(),
			updated_at: new Date(Date.now() - 86400000).toISOString(),
			is_pinned: true,
		},
	]);

	useEffect(() => {
		// Add visual marker to show component is loaded
		const div = document.createElement("div");
		div.style.position = "fixed";
		div.style.top = "0";
		div.style.left = "0";
		div.style.backgroundColor = "blue";
		div.style.color = "white";
		div.style.padding = "5px";
		div.style.zIndex = "10000";
		div.textContent = "EMERGENCY FALLBACK LOADED";
		document.body.appendChild(div);

		// Try to fetch sessions directly via fetch API
		fetch("/api/trpc/chat.getSessions", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((data) => {
				console.log("Direct API response:", data);

				if (data && Array.isArray(data.result?.data)) {
					setSessions(data.result.data);
				}
			})
			.catch((err) => {
				console.error("Error with direct fetch:", err);
				setError(err.message);
			});
	}, []);

	return (
		<div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
			<h1 style={{ color: "#333", marginBottom: "20px" }}>
				Emergency Fallback UI
			</h1>

			{error && (
				<div
					style={{
						backgroundColor: "#ffeeee",
						border: "1px solid #ffaaaa",
						padding: "10px",
						marginBottom: "20px",
						borderRadius: "4px",
					}}
				>
					<h3>Error:</h3>
					<p>{error}</p>
				</div>
			)}

			<div
				style={{
					backgroundColor: "#f7f7f7",
					padding: "15px",
					borderRadius: "4px",
					marginBottom: "20px",
				}}
			>
				<h2 style={{ marginTop: 0 }}>Chat Sessions</h2>
				<ul style={{ listStyle: "none", padding: 0 }}>
					{sessions.map((session) => (
						<li
							key={session.id}
							style={{
								padding: "10px 15px",
								borderLeft: session.is_pinned
									? "4px solid #4a90e2"
									: "1px solid #ddd",
								marginBottom: "10px",
								backgroundColor: "white",
								borderRadius: "4px",
							}}
						>
							<div style={{ fontWeight: "bold" }}>{session.title}</div>
							<div style={{ fontSize: "12px", color: "#666" }}>
								{new Date(session.updated_at).toLocaleString()}
								{session.is_pinned && (
									<span
										style={{
											marginLeft: "10px",
											backgroundColor: "#e2f2ff",
											color: "#4a90e2",
											padding: "2px 6px",
											borderRadius: "4px",
											fontSize: "10px",
										}}
									>
										PINNED
									</span>
								)}
							</div>
						</li>
					))}
				</ul>
			</div>

			<p>
				If you're seeing this, it means there was an issue with the main chat
				components.
			</p>
			<p>Please try refreshing the page or contact support.</p>

			<h3>Technical Information:</h3>
			<pre
				style={{
					backgroundColor: "#f5f5f5",
					padding: "10px",
					overflowX: "auto",
					fontFamily: "monospace",
					fontSize: "12px",
				}}
			>
				{JSON.stringify(
					{
						navigator: {
							userAgent: window.navigator.userAgent,
						},
						location: window.location.href,
						timestamp: new Date().toISOString(),
					},
					null,
					2,
				)}
			</pre>
		</div>
	);
}

// Function that can be called from the main page component
export function injectEmergencyFallback() {
	try {
		const root = document.getElementById("chat-root") || document.body;
		const container = document.createElement("div");
		container.id = "emergency-fallback-container";
		root.appendChild(container);

		// If React is available, try to render the component using React
		// Otherwise, show a basic HTML message
		if (React?.createElement && typeof document !== "undefined") {
			try {
				// Use the imported createRoot (React 18+)
				createRoot(container).render(React.createElement(EmergencyFallback));
			} catch (renderError) {
				console.error("Error rendering React component:", renderError);
				// Fallback to basic HTML if React rendering fails
				renderBasicHTML(container);
			}
		} else {
			renderBasicHTML(container);
		}

		return true;
	} catch (e: unknown) {
		console.error("Failed to inject emergency fallback:", e);

		// Last resort - try to show something without React
		try {
			document.body.innerHTML = `
        <div style="padding: 20px; max-width: 600px; margin: 0 auto; font-family: sans-serif;">
          <h1 style="color: #d00;">Basic Emergency Fallback</h1>
          <p>The chat interface couldn't be loaded due to a critical error.</p>
          <p>Error: ${e instanceof Error ? e.message : "Unknown error"}</p>
          <p>Please refresh the page or contact support.</p>
        </div>
      `;
		} catch (innerError) {
			// Nothing more we can do
		}

		return false;
	}
}

// Helper function to render basic HTML when React is not available
function renderBasicHTML(container: HTMLElement) {
	container.innerHTML = `
    <div style="padding: 20px; max-width: 600px; margin: 0 auto; font-family: sans-serif;">
      <h1 style="color: #d00;">Emergency Fallback (No React)</h1>
      <p>The chat interface couldn't be loaded.</p>
      <p>Please refresh the page or contact support.</p>
    </div>
  `;
}
