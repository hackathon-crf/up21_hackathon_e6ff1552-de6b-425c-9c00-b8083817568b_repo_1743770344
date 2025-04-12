"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, PlusCircle, Trash2, Pencil, Check, X, Pin, Archive, RotateCcw } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { toast } from "~/hooks/use-toast";
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
  // Component initialization
  
  const pathname = usePathname();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const currentSessionId = pathname.includes('/chat/') && pathname !== '/chat/settings' 
    ? pathname.split('/').pop() 
    : undefined;
    
  // Handle component lifecycle and error handling
  useEffect(() => {
    // Global error handler for unexpected errors
    const errorHandler = (event: ErrorEvent) => {
      console.error('Error:', event.message);
      toast({
        title: "Unexpected Error",
        description: event.message,
        variant: "destructive"
      });
    };
    
    // Add error handler
    window.addEventListener('error', errorHandler);
    
    // Remove error handler on cleanup
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  // Get chat sessions with filtering options
  const sessionsData = api.chat.getSessions.useQuery({
    status: showArchived ? 'archived' : 'active',
    includeDeleted: showDeleted,
    sortBy: 'position',
    sortOrder: 'asc'
  }, {
    // Handle errors gracefully
    onError: (error) => {
      console.error("Error fetching sessions:", error.message);
      
      // Show user-friendly error with toast
      toast({
        title: "Failed to load chat sessions",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Extract session data from the result
  const { 
    data: sessions, 
    isLoading, 
    refetch,
    error: sessionsError
  } = sessionsData;
  
  // Create new chat session
  const createSessionMutation = api.chat.createSession.useMutation({
    onMutate: () => {
      setCreating(true);
    },
    onSuccess: (data) => {
      refetch();
      setCreating(false);
      
      // Navigate to the new session
      if (data && data.id) {
        router.push(`/chat/${data.id}`);
      }
    },
    onError: (error) => {
      console.error("Error creating chat session:", error);
      setCreating(false);
      
      // Show user-friendly error
      toast({
        title: "Failed to create chat",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update session title (legacy)
  const updateSessionTitleMutation = api.chat.updateSessionTitle.useMutation({
    onSuccess: () => {
      refetch();
      setEditingSessionId(null);
    },
    onError: (error) => {
      console.error("Failed to update session title:", error);
    }
  });
  
  // Update session (new comprehensive method)
  const updateSessionMutation = api.chat.updateSession.useMutation({
    onSuccess: () => {
      refetch();
      setEditingSessionId(null);
    },
    onError: (error) => {
      console.error("Failed to update session:", error);
    }
  });
  
  // Update multiple session positions
  const updateSessionPositionsMutation = api.chat.updateSessionPositions.useMutation({
    onSuccess: () => {
      refetch();
      setIsReordering(false);
    },
    onError: (error) => {
      console.error("Failed to update session positions:", error);
      setIsReordering(false);
    }
  });
  
  // Delete session
  const deleteSessionMutation = api.chat.deleteSession.useMutation({
    onMutate: async ({ session_id, permanent }) => {
      // Optimistic update
      const previousSessions = sessions ? [...sessions] : [];
      
      if (!sessions) return { previousSessions };
      
      // Update local state optimistically
      const updatedSessions = permanent 
        ? sessions.filter(s => s.id !== session_id)
        : sessions.map(s => s.id === session_id ? { ...s, status: 'deleted' } : s);
      
      // Show immediate feedback by updating the UI
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return { previousSessions };
    },
    onSuccess: (data) => {
      console.log("Session deleted successfully:", data);
      refetch();
      
      // If we deleted the currently open session, redirect to /chat
      if (data.id === currentSessionId) {
        router.push('/chat');
      }
    },
    onError: (error, variables, context) => {
      console.error("Failed to delete session:", error);
      
      // Show user-friendly error message
      toast({
        title: "Error",
        description: `Failed to delete session: ${error.message}`,
        variant: "destructive"
      });
      
      // Revert to previous state
      refetch();
    },
    onSettled: () => {
      // Always refetch after error or success
      refetch();
    }
  });
  
  // Toggle pinned status
  const handleTogglePin = (session: any) => {
    updateSessionMutation.mutate({
      session_id: session.id,
      is_pinned: !session.is_pinned
    });
  };
  
  // Toggle archive status
  const handleToggleArchive = (session: any) => {
    updateSessionMutation.mutate({
      session_id: session.id,
      status: session.status === 'archived' ? 'active' : 'archived'
    });
  };
  
  // Handle new chat button click
  const handleNewChat = () => {
    createSessionMutation.mutate({ 
      title: "New Chat",
      is_pinned: false
    });
  };
  
  // Handle edit session title
  const startEditingSession = (session: { id: string, title: string }) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title || "New Chat");
  };
  
  // Handle save edited title
  const saveSessionTitle = (id: string) => {
    if (editTitle.trim()) {
      // Use the new update method
      updateSessionMutation.mutate({
        session_id: id,
        title: editTitle
      });
    }
  };
  
  // Handle delete session
  const deleteSession = (id: string, permanent: boolean = false) => {
    deleteSessionMutation.mutate({
      session_id: id,
      permanent: permanent
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
      
      {/* Filter controls */}
      <div className="px-3 py-1 flex justify-between text-xs">
        <Button 
          variant={showArchived ? "secondary" : "ghost"} 
          size="sm" 
          className="text-xs h-7"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? "Active Chats" : "Show Archived"}
        </Button>
        
        <Button 
          variant={showDeleted ? "secondary" : "ghost"} 
          size="sm" 
          className="text-xs h-7"
          onClick={() => setShowDeleted(!showDeleted)}
        >
          {showDeleted ? "Hide Deleted" : "Show Deleted"}
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
            <p>No {showArchived ? "archived" : "active"} chats found</p>
            <p className="text-xs mt-1">
              {showArchived 
                ? "Archive chats to store them for later reference" 
                : "Start a new conversation to create your first chat"}
            </p>
          </div>
        )}
        
        {/* Session display with pinned and archived states */}
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
                    ${session.status === 'deleted' ? "opacity-50 " : ""}
                    ${session.status === 'archived' ? "italic " : ""}
                    ${session.is_pinned 
                      ? "border-l-2 border-primary bg-primary/5 font-medium " 
                      : ""}
                    ${session.id === currentSessionId 
                      ? "bg-primary/20 text-primary-foreground" 
                      : "hover:bg-zinc-800/70 text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className={`h-4 w-4 flex-shrink-0 ${
                      session.is_pinned ? 'text-primary' : ''
                    }`} />
                    <span className={`text-sm truncate ${
                      session.is_pinned ? 'text-foreground' : ''
                    }`}>
                      {session.title || "New Chat"}
                      {session.status === 'deleted' && " (Deleted)"}
                      {session.status === 'archived' && " (Archived)"}
                    </span>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Toggle pin button - with direct hover on icon */}
                    <div className={`isolate transition-all duration-200 ${
                      session.is_pinned 
                        ? "opacity-100 -rotate-12 scale-110" 
                        : ""
                    }`}>
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTogglePin(session);
                        }}
                        title={session.is_pinned ? "Unpin" : "Pin"}
                      >
                        {session.is_pinned ? (
                          <div className="p-1.5 rounded-full hover:bg-primary/20">
                            <Pin className="h-4 w-4 text-primary hover:text-primary/80 transition-all duration-150 drop-shadow-sm" fill="currentColor" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-full hover:bg-zinc-800">
                            <Pin className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-150" />
                          </div>
                        )}
                        <span className="sr-only">{session.is_pinned ? "Unpin" : "Pin"}</span>
                      </div>
                    </div>
                    
                    {/* Edit title button - with direct hover on icon */}
                    <div className="isolate">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startEditingSession(session);
                        }}
                        title="Edit title"
                      >
                        <div className="p-1.5 rounded-full hover:bg-zinc-800">
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-150" />
                        </div>
                        <span className="sr-only">Edit</span>
                      </div>
                    </div>
                    
                    {/* Archive/Unarchive button - with direct hover on icon */}
                    <div className="isolate">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleArchive(session);
                        }}
                        title={session.status === 'archived' ? "Unarchive" : "Archive"}
                      >
                        {session.status === 'archived' ? (
                          <div className="p-1.5 rounded-full hover:bg-zinc-800">
                            <RotateCcw className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-150" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-full hover:bg-zinc-800">
                            <Archive className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-150" />
                          </div>
                        )}
                        <span className="sr-only">
                          {session.status === 'archived' ? "Unarchive" : "Archive"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Delete button - with direct hover on icon */}
                    <div className="isolate">
                      <div 
                        className="flex items-center justify-center h-6 w-6 rounded-full cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Delete wrapper clicked");
                          
                          // Use a state-based approach to show/hide dialog
                          const dialogId = `delete-dialog-${session.id}`;
                          const dialog = document.getElementById(dialogId) as HTMLDialogElement;
                          
                          if (dialog) {
                            console.log("Opening dialog manually");
                            dialog.showModal();
                            toast({
                              title: "Debug",
                              description: "Dialog opened manually",
                              variant: "default"
                            });
                          } else {
                            console.log("Dialog element not found");
                            toast({
                              title: "Debug Error",
                              description: "Dialog element not found",
                              variant: "destructive"
                            });
                          }
                        }}
                        title="Delete"
                      >
                        <div className="p-1.5 rounded-full hover:bg-destructive/20">
                          <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80 transition-colors duration-150" />
                        </div>
                      
                        {/* Native dialog for reliable opening */}
                        <dialog 
                          id={`delete-dialog-${session.id}`}
                          className="w-full max-w-md rounded-lg p-6 shadow-lg backdrop:bg-black/50"
                      >
                        <div className="mb-4">
                          <h2 className="text-lg font-bold">Delete chat</h2>
                          <p className="text-muted-foreground">
                            {session.status === 'deleted' ? (
                              "This will permanently delete this chat and all its messages. This action cannot be undone."
                            ) : (
                              "Do you want to move this chat to trash or permanently delete it?"
                            )}
                          </p>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => {
                              console.log("Cancel clicked");
                              const dialog = document.getElementById(`delete-dialog-${session.id}`) as HTMLDialogElement;
                              if (dialog) dialog.close();
                            }}
                          >
                            Cancel
                          </Button>
                          
                          {session.status !== 'deleted' && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                console.log("Move to trash clicked");
                                deleteSession(session.id, false);
                                const dialog = document.getElementById(`delete-dialog-${session.id}`) as HTMLDialogElement;
                                if (dialog) dialog.close();
                              }}
                            >
                              Move to Trash
                            </Button>
                          )}
                          
                          <Button
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                              console.log("Permanently delete clicked");
                              deleteSession(session.id, true);
                              const dialog = document.getElementById(`delete-dialog-${session.id}`) as HTMLDialogElement;
                              if (dialog) dialog.close();
                            }}
                          >
                            Permanently Delete
                          </Button>
                        </div>
                        </dialog>
                      </div>
                    </div>
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