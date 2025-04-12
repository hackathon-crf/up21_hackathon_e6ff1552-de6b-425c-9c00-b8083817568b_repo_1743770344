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
  console.log('⚠️ SIDEBAR MOUNTING ⚠️');
  
  // Add immediate DOM visibility for errors
  try {
    document.body.insertAdjacentHTML('afterbegin', 
      `<div id="debug-marker" style="position:fixed; top:0; left:0; background:green; color:white; padding:2px; z-index:9999;">
        SIDEBAR LOADED: ${new Date().toISOString().substring(11, 19)}
      </div>`
    );
  } catch (e) {
    // May fail in SSR context, that's okay
    console.log('Failed to add debug marker:', e);
  }
  
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
    
  // Add component-level error boundary
  useEffect(() => {
    console.log('⚠️ SIDEBAR MOUNTED ⚠️');
    console.log('Pathname:', pathname);
    console.log('CurrentSessionId:', currentSessionId);
    
    // Add global window error handlers just in case
    window.addEventListener('error', (event) => {
      console.log('GLOBAL ERROR EVENT:', event);
      
      // Show the error visibly on screen
      try {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = '0';
        errorDiv.style.left = '0';
        errorDiv.style.right = '0';
        errorDiv.style.backgroundColor = 'red';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.zIndex = '10000';
        errorDiv.textContent = `ERROR: ${event.message} at ${event.filename}:${event.lineno}`;
        document.body.appendChild(errorDiv);
      } catch (e) {
        // Last resort - alert
        alert(`ERROR: ${event.message}`);
      }
    });
    
    // Test that query parameters are working
    try {
      console.log('TRPC API object available:', !!api);
    } catch (e) {
      console.error('TRPC API NOT AVAILABLE:', e);
    }
  }, [pathname, currentSessionId]);
  
  // Add a safe error wrapper
  const safeQuery = (fn: Function, fallback: any) => {
    try {
      return fn();
    } catch (e: any) {
      console.error('Safe query error:', e);
      
      // Show a visual error indication
      try {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '40px';
        errorDiv.style.left = '0';
        errorDiv.style.right = '0';
        errorDiv.style.backgroundColor = 'orange';
        errorDiv.style.color = 'black';
        errorDiv.style.padding = '10px';
        errorDiv.style.zIndex = '10000';
        errorDiv.textContent = `TRPC QUERY ERROR: ${e.message} - Using fallback data`;
        document.body.appendChild(errorDiv);
      } catch (domErr) {
        console.error('DOM error showing error indication:', domErr);
      }
      
      // Try to use mock client if available
      if ((window as any).__mockTRPC?.chat?.getSessions?.useQuery) {
        console.log('🚨 Using emergency mock tRPC client 🚨');
        try {
          return (window as any).__mockTRPC.chat.getSessions.useQuery();
        } catch (mockErr) {
          console.error('Mock client error:', mockErr);
        }
      }
      
      // Return fallback data
      return fallback;
    }
  };

  // Get chat sessions with new filtering options
  // Use a simpler approach to avoid syntax errors
  const sessionsData = (() => {
    try {
      // Try to get the real data
      return api.chat.getSessions.useQuery({
        status: showArchived ? 'archived' : 'active',
        includeDeleted: showDeleted,
        sortBy: 'position',
        sortOrder: 'asc'
      }, {
        // Fallback data for debugging - with correct column names
        placeholderData: [
          { 
            id: 'mock-session-1', 
            title: 'Mock Chat 1', 
            created_at: new Date(), 
            updated_at: new Date(), 
            user_id: 'mock-user-id',
            position: 0,
            is_pinned: false,
            status: 'active'
          },
          { 
            id: 'mock-session-2', 
            title: 'Mock Chat 2', 
            created_at: new Date(), 
            updated_at: new Date(), 
            user_id: 'mock-user-id',
            position: 1,
            is_pinned: true,
            status: 'active'
          }
        ],
        onError: (error) => {
          console.error("Error fetching sessions [DETAILED]:", {
            message: error.message,
            name: error.name,
            cause: error.cause
          });
          
          // Alert with error details for visibility
          try {
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '20px';
            errorDiv.style.left = '20px';
            errorDiv.style.backgroundColor = 'red';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '10px';
            errorDiv.style.zIndex = '9999';
            errorDiv.textContent = `Error: ${error.message}`;
            document.body.appendChild(errorDiv);
          } catch (e) {
            // Silent failure - already in error state
          }
        },
        onSuccess: (data) => {
          console.log("Sessions fetched successfully:", 
            Array.isArray(data) ? `${data.length} items` : typeof data);
        }
      });
    } catch (e) {
      console.error("Failed to fetch sessions, using emergency data:", e);
      
      // Show visible error on screen
      setTimeout(() => {
        try {
          const errorDiv = document.createElement('div');
          errorDiv.style.position = 'fixed';
          errorDiv.style.top = '0';
          errorDiv.style.left = '0';
          errorDiv.style.right = '0';
          errorDiv.style.backgroundColor = 'orange';
          errorDiv.style.color = 'black';
          errorDiv.style.padding = '10px';
          errorDiv.style.zIndex = '10000';
          errorDiv.textContent = `Using emergency data due to error: ${e.message}`;
          document.body.appendChild(errorDiv);
        } catch (domErr) {
          // Silent failure - we're already handling an error
        }
      }, 100);
      
      // Return emergency data
      return {
        data: [
          { 
            id: 'emergency-session-1', 
            title: 'Emergency Chat 1', 
            created_at: new Date(), 
            updated_at: new Date(), 
            user_id: 'emergency-user-id',
            position: 0,
            is_pinned: false,
            status: 'active'
          },
          { 
            id: 'emergency-session-2', 
            title: 'Emergency Chat 2', 
            created_at: new Date(), 
            updated_at: new Date(), 
            user_id: 'emergency-user-id',
            position: 1,
            is_pinned: true,
            status: 'active'
          }
        ],
        isLoading: false,
        refetch: () => console.log('Emergency refetch called'),
        error: null
      };
    }
  })();
  
  // Extract session data from the result
  const { 
    data: sessions, 
    isLoading, 
    refetch,
    error: sessionsError
  } = sessionsData;
  
  // Create new session - full rewrite with detailed debugging
  const createSessionMutation = api.chat.createSession.useMutation({
    onMutate: (variables) => {
      console.log("[createSession] Starting mutation with variables:", variables);
      setCreating(true);
    },
    onSuccess: (data) => {
      console.log("[createSession] Success! Created session:", data);
      
      // Log session structure
      if (data) {
        console.log("[createSession] Result data type:", typeof data);
        if (typeof data === 'object' && data !== null) {
          console.log("[createSession] Result object keys:", Object.keys(data));
          console.log("[createSession] Full data object:", JSON.stringify(data));
        }
      } else {
        console.log("[createSession] Result data is null or undefined");
      }
      
      refetch();
      setCreating(false);
      
      // Navigate to the new session
      if (data && data.id) {
        console.log(`[createSession] Navigating to /chat/${data.id}`);
        router.push(`/chat/${data.id}`);
      } else {
        console.error("[createSession] Success but missing data.id:", data);
      }
    },
    onError: (error) => {
      console.error("[createSession] Error creating session:", error);
      
      // Advanced error diagnostics
      console.error("[createSession] Detailed error:", {
        message: error.message,
        name: error.name,
        // For TRPCClientError
        data: (error as any).data,
        shape: (error as any).shape,
        // Log the error object properties
        properties: Object.getOwnPropertyNames(error).filter(p => p !== 'stack'),
        // Extract the stack only first 500 chars
        stack: error.stack?.substring(0, 500)
      });
      
      // Try to parse the error context
      if (error.message.includes("is not iterable")) {
        console.error("[createSession] ITERABLE ERROR CONTEXT:", {
          route: "/api/trpc/chat.createSession",
          requestBody: JSON.stringify({ 
            title: "New Chat", 
            is_pinned: false 
          })
        });
      }
      
      setCreating(false);
    },
    onSettled: () => {
      console.log("[createSession] Mutation settled");
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
    onSuccess: (data) => {
      refetch();
      if (data.permanent && currentSessionId && sessions?.some(s => s.id === currentSessionId)) {
        router.push('/chat');
      }
    },
    onError: (error) => {
      console.error("Failed to delete session:", error);
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
    try {
      console.log("[handleNewChat] Creating new chat session");
      setCreating(true);
      
      // Use the mutation hook with extensive logging
      console.log("[handleNewChat] About to call createSessionMutation.mutate()");
      createSessionMutation.mutate({ 
        title: "New Chat",
        is_pinned: false // Explicitly set is_pinned to match the server schema
      }, {
        onMutate: (variables) => {
          console.log("[handleNewChat] Mutation starting with variables:", variables);
          try {
            // Add debugging info to localStorage for diagnostics
            localStorage.setItem('debug_create_session_input', JSON.stringify(variables));
          } catch (e) {
            console.error("[handleNewChat] Failed to store debug info:", e);
          }
        },
        onSuccess: (data) => {
          console.log("[handleNewChat] Chat session created successfully:", data);
          setCreating(false);
          
          // Store successful response for later diagnosis
          try {
            localStorage.setItem('debug_create_session_success', JSON.stringify(data));
          } catch (e) {
            console.error("[handleNewChat] Failed to store success debug info:", e);
          }
          
          // Navigate to the new session
          if (data && data.id) {
            console.log(`[handleNewChat] Navigating to /chat/${data.id}`);
            router.push(`/chat/${data.id}`);
          } else {
            console.error("[handleNewChat] Success response missing ID:", data);
          }
        },
        onError: (error) => {
          console.error("[handleNewChat] Failed to create chat session:", error);
          
          // Enhanced error diagnostics
          console.error("[handleNewChat] Detailed error:", {
            message: error.message,
            name: error.name,
            // For TRPCClientError
            data: (error as any).data,
            shape: (error as any).shape,
            // Log the error object properties
            properties: Object.getOwnPropertyNames(error).filter(p => p !== 'stack'),
            // Extract the stack only first 500 chars
            stack: error.stack?.substring(0, 500)
          });
          
          // Store error for later diagnosis
          try {
            localStorage.setItem('debug_create_session_error', JSON.stringify({
              message: error.message,
              name: error.name,
              timestamp: new Date().toISOString()
            }));
          } catch (e) {
            console.error("[handleNewChat] Failed to store error debug info:", e);
          }
          
          setCreating(false);
          
          console.log("[handleNewChat] Attempting fallback via direct API call");
          // If mutation fails, try direct API approach as fallback
          fetch('/api/chat/stream/route', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: "Hello",
              session_id: undefined
            })
          })
          .then(async response => {
            console.log("[handleNewChat] API response status:", response.status);
            
            // Try to read the response body for more details
            try {
              const textResponse = await response.clone().text();
              console.log("[handleNewChat] API response body:", 
                textResponse.length > 200 ? textResponse.substring(0, 200) + '...' : textResponse);
              
              // Try to parse as JSON for more detailed logging
              try {
                const jsonResponse = JSON.parse(textResponse);
                console.log("[handleNewChat] API response JSON:", jsonResponse);
              } catch (jsonErr) {
                console.log("[handleNewChat] API response is not valid JSON");
              }
            } catch (parseErr) {
              console.error("[handleNewChat] Failed to parse API response:", parseErr);
            }
            
            if (response.ok) {
              console.log("[handleNewChat] Created session via direct API successfully");
              // Update UI with mock data if needed
              refetch();
              // Force a reload after a short delay to ensure the session is visible
              setTimeout(() => {
                window.location.href = '/chat';
              }, 500);
            } else {
              console.error("[handleNewChat] Failed to create session via direct API:", response.statusText);
              // Even if the direct API fails, try to continue by refreshing the sessions list
              refetch();
            }
          })
          .catch(apiError => {
            console.error("[handleNewChat] Exception making direct API call:", apiError);
            // Even on complete failure, refresh the UI
            refetch();
          });
        },
        onSettled: () => {
          console.log("[handleNewChat] Mutation settled");
        }
      });
    } catch (error) {
      setCreating(false);
      console.error("[handleNewChat] Exception in handleNewChat:", error);
      // Try to recover by refreshing the sessions list
      refetch();
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
                    ${session.is_pinned ? "border-l-2 border-primary " : ""}
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
                      {session.status === 'deleted' && " (Deleted)"}
                      {session.status === 'archived' && " (Archived)"}
                    </span>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    {/* Toggle pin button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTogglePin(session);
                      }}
                      title={session.is_pinned ? "Unpin" : "Pin"}
                    >
                      {session.is_pinned ? (
                        <span className="text-primary font-bold text-sm">📌</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">📌</span>
                      )}
                      <span className="sr-only">{session.is_pinned ? "Unpin" : "Pin"}</span>
                    </Button>
                    
                    {/* Edit title button */}
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
                    
                    {/* Archive/Unarchive button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleArchive(session);
                      }}
                      title={session.status === 'archived' ? "Unarchive" : "Archive"}
                    >
                      {session.status === 'archived' ? (
                        <span className="text-sm">🔄</span>
                      ) : (
                        <span className="text-sm">📦</span>
                      )}
                      <span className="sr-only">
                        {session.status === 'archived' ? "Unarchive" : "Archive"}
                      </span>
                    </Button>
                    
                    {/* Delete button with dialog */}
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
                            {session.status === 'deleted' ? (
                              "This will permanently delete this chat and all its messages. This action cannot be undone."
                            ) : (
                              "Do you want to move this chat to trash or permanently delete it?"
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex justify-between">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          
                          {session.status !== 'deleted' && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                deleteSession(session.id, false);
                                document.querySelector('[role="dialog"]')?.parentElement?.click(); // Close dialog
                              }}
                            >
                              Move to Trash
                            </Button>
                          )}
                          
                          <AlertDialogAction
                            onClick={() => deleteSession(session.id, true)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Permanently Delete
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