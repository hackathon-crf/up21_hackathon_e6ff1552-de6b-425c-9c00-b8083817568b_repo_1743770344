"use client";

import type { TRPCClientErrorLike } from "@trpc/client";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import type { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";
import Page from "../page";
import type { ChatPageProps } from "../page";

// Define session type based on the database structure
type Session = {
	id: string;
	user_id: string;
	title: string;
	position: number;
	is_pinned: boolean;
	status: string;
	created_at: Date;
	updated_at: Date | null;
};

export default function ChatSessionPage() {
	const params = useParams();
	const session_id = params.sessionId as string;

	// Check if session exists - using the query without callbacks
	const sessionQuery = api.chat.getSession.useQuery(
		{ session_id },
		{
			enabled: !!session_id,
			retry: false,
		},
	);

	// Use effect to handle the successful query result and errors
	useEffect(() => {
		if (sessionQuery.isLoading) return;

		if (sessionQuery.isSuccess && sessionQuery.data) {
			console.log(
				`Successfully loaded session: ${sessionQuery.data.id}, title: ${sessionQuery.data.title}`,
			);
		}

		if (sessionQuery.isError && sessionQuery.error) {
			console.error(`Error loading session ${session_id}:`, sessionQuery.error);
			// Log more details about the error - handle safely since some properties might not exist
			console.error(`Error details: ${sessionQuery.error.message}`, {
				// Access properties that are available on TRPCClientErrorLike
				code: sessionQuery.error.data?.code,
				httpStatus: sessionQuery.error.data?.httpStatus,
				path: sessionQuery.error.data?.path,
			});
		}
	}, [
		sessionQuery.isLoading,
		sessionQuery.isSuccess,
		sessionQuery.isError,
		sessionQuery.data,
		sessionQuery.error,
		session_id,
	]);

	useEffect(() => {
		if (session_id) {
			console.log(`ChatSessionPage mounted with session_id: ${session_id}`);
		}
	}, [session_id]);

	// Now we can pass the session_id as initialSessionId
	return <Page initialSessionId={session_id} />;
}
