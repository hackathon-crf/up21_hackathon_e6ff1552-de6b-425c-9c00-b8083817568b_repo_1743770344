"use client"

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import ChatPage from "../page";
import { api } from "~/trpc/react";

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  // Check if session exists
  const sessionQuery = api.chat.getSession.useQuery(
    { sessionId },
    {
      enabled: !!sessionId,
      retry: false,
      onSuccess: (data) => {
        console.log(`Successfully loaded session: ${data.id}, title: ${data.title}`);
      },
      onError: (error) => {
        console.error(`Error loading session ${sessionId}:`, error);
      }
    }
  );
  
  useEffect(() => {
    if (sessionId) {
      console.log(`ChatSessionPage mounted with sessionId: ${sessionId}`);
    }
  }, [sessionId]);
  
  return <ChatPage initialSessionId={sessionId} />;
}