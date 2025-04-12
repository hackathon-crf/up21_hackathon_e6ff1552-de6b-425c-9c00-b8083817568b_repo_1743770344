"use client"

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import ChatPage from "../page";
import { api } from "~/trpc/react";

export default function ChatSessionPage() {
  const params = useParams();
  const session_id = params.sessionId as string;
  
  // Check if session exists
  const sessionQuery = api.chat.getSession.useQuery(
    { session_id },
    {
      enabled: !!session_id,
      retry: false,
      onSuccess: (data) => {
        console.log(`Successfully loaded session: ${data.id}, title: ${data.title}`);
      },
      onError: (error) => {
        console.error(`Error loading session ${session_id}:`, error);
      }
    }
  );
  
  useEffect(() => {
    if (session_id) {
      console.log(`ChatSessionPage mounted with session_id: ${session_id}`);
    }
  }, [session_id]);
  
  return <ChatPage initialSessionId={session_id} />;
}