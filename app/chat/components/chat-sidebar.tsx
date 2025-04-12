"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, PlusCircle, Trash2, Pencil, Check, X } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

export function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const currentSessionId = pathname.includes('/chat/') && pathname !== '/chat/settings' 
    ? pathname.split('/').pop() 
    : undefined;
  
  // Get chat sessions
  const { data: sessions, isLoading, refetch } = api.chat.getSessions.useQuery();
  
  // Create new session
  const createSessionMutation = api.chat.createSession.useMutation({
    onSuccess: (data) => {
      refetch();
      setCreating(false);
      // Navigate to the new session
      router.push(`/chat/${data.id}`);
    },
    onError: (error) => {
      setCreating(false);
      console.error("Failed to create session:", error);
    }
  });
  
  // Update session title
  const updateSessionTitleMutation = api.chat.updateSessionTitle.useMutation({
    onSuccess: () => {
      refetch();
      setEditingSessionId(null);
    },
    onError: (error) => {
      console.error("Failed to update session title:", error);
    }
  });
  
  // Delete session
  const deleteSessionMutation = api.chat.deleteSession.useMutation({
    onSuccess: () => {
      refetch();
      if (currentSessionId && sessions?.some(s => s.id === currentSessionId)) {
        router.push('/chat');
      }
    },
    onError: (error) => {
      console.error("Failed to delete session:", error);
    }
  });
  
  // Handle new chat button click
  const handleNewChat = () => {
    try {
      console.log("Creating new chat session");
      setCreating(true);
      
      // Make sure title is explicitly passed as an object with the correct shape
      const input = { title: "New Chat" };
      console.log("Input payload:", input);
      
      // Use the mutation without callback overrides (use the ones defined in the hook)
      createSessionMutation.mutate(input);
    } catch (error) {
      setCreating(false);
      console.error("Exception while creating session:", error);
    }
  };
  
  // Handle edit session title
  const startEditingSession = (session: { id: string, title: string }) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title || "New Chat");
  };
  
  // Handle save edited title
  const saveSessionTitle = (id: string) => {
    if (editTitle.trim()) {
      updateSessionTitleMutation.mutate({
        sessionId: id,
        title: editTitle
      });
    }
  };
  
  // Handle delete session
  const deleteSession = (id: string) => {
    deleteSessionMutation.mutate({
      sessionId: id
    });
  };
  
  return (
    <div className="w-64 border-r border-zinc-800 flex flex-col h-full bg-zinc-900/70 py-2">
      <div className="p-3">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={handleNewChat}
          disabled={creating}
        >
          <PlusCircle className="h-4 w-4" />
          New Chat
          {creating && <div className="ml-2 animate-spin">⟳</div>}
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto py-2">
        {isLoading && (
          <div className="px-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        )}
        
        {!isLoading && (!sessions || sessions.length === 0) && (
          <div className="px-3 py-10 text-center text-muted-foreground">
            <p>No chat history yet</p>
            <p className="text-xs mt-1">
              Start a new conversation to create your first chat
            </p>
          </div>
        )}
        
        <div className="space-y-1 px-2">
          {sessions?.map((session) => (
            <div key={session.id} className="group relative">
              {editingSessionId === session.id ? (
                <div className="flex items-center px-3 py-2 gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveSessionTitle(session.id);
                      } else if (e.key === 'Escape') {
                        setEditingSessionId(null);
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => saveSessionTitle(session.id)}
                  >
                    <Check className="h-3 w-3" />
                    <span className="sr-only">Save</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingSessionId(null)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Cancel</span>
                  </Button>
                </div>
              ) : (
                <Link
                  href={`/chat/${session.id}`}
                  className={`
                    px-3 py-2 flex items-center justify-between rounded-md group
                    ${session.id === currentSessionId 
                      ? "bg-primary/20 text-primary-foreground" 
                      : "hover:bg-zinc-800/70 text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {session.title || "New Chat"}
                    </span>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEditingSession(session);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-2">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete chat</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this chat and all its messages.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSession(session.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}