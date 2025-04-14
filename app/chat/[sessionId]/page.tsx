"use client"

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import ChatPage from "../page";
import { api } from "~/trpc/react";
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';

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
      retry: false
    }
  );

  // Use effect to handle the successful query result and errors
  useEffect(() => {
    if (sessionQuery.isLoading) return;
    
    if (sessionQuery.isSuccess && sessionQuery.data) {
      console.log(`Successfully loaded session: ${sessionQuery.data.id}, title: ${sessionQuery.data.title}`);
    }
    
    if (sessionQuery.isError && sessionQuery.error) {
      console.error(`Error loading session ${session_id}:`, sessionQuery.error);
      // Log more details about the error - handle safely since some properties might not exist
      console.error(`Error details: ${sessionQuery.error.message}`, {
        // Use optional chaining and type assertions to safely access potential properties
        code: (sessionQuery.error as any).code,
        // Avoid accessing name and cause directly since they aren't guaranteed to exist
        data: (sessionQuery.error as any).data
      });
    }
  }, [sessionQuery.isLoading, sessionQuery.isSuccess, sessionQuery.isError, 
      sessionQuery.data, sessionQuery.error, session_id]);
  
  useEffect(() => {
    if (session_id) {
      console.log(`ChatSessionPage mounted with session_id: ${session_id}`);
    }
  }, [session_id]);
  
  return <ChatPage initialSessionId={session_id} />;
}