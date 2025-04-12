"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Copy, Heart, MessageSquare, Play, Settings, Shield, Users, X } from "lucide-react"
import React from "react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { useToast } from "~/hooks/use-toast" // Assuming useToast returns { toast } or similar
import { ConnectionStatus } from "../../components/connection-status"
import { PlayerList } from "../../components/player-list"
import { GameChat } from "../../components/game-chat"
import { VoiceChatControls } from "../../components/voice-chat-controls"
import { cn } from "~/lib/utils"; // Assuming cn is correctly imported

// Define types (keep these outside or in a separate types file)
type PlayerRole = "host" | "player" | "moderator" | "observer";
type PlayerStatus = "idle" | "typing" | "away" | undefined;
type Player = {
  id: number | string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isCurrentUser?: boolean;
  role?: PlayerRole;
  status?: PlayerStatus;
}
type LobbyParams = {
  id: string;
}

// --- MOVE MOCK DATA BASE OUTSIDE ---
const mockSessionBase = {
  // Assuming id comes from props/params later
  code: "FIRST123",
  title: "CPR & AED Challenge",
  host: "John Doe",
  topic: "CPR & AED",
  difficulty: "Intermediate",
  questions: 10,
  timePerQuestion: 30,
  players: [
    {
      id: 1, name: "John Doe", avatar: "/avatar.svg?height=40&width=40", isHost: true, isReady: true, isCurrentUser: true, role: "host" as PlayerRole,
    },
    {
      id: 2, name: "Sarah Johnson", avatar: "/avatar.svg?height=40&width=40", isHost: false, isReady: true, status: "idle" as PlayerStatus, role: "player" as PlayerRole,
    },
    {
      id: 3, name: "Michael Smith", avatar: "/avatar.svg?height=40&width=40", isHost: false, isReady: false, status: "typing" as PlayerStatus, role: "player" as PlayerRole,
    },
    {
      id: 4, name: "Emily Davis", avatar: "/avatar.svg?height=40&width=40", isHost: false, isReady: true, status: "idle" as PlayerStatus, role: "player" as PlayerRole,
    },
    {
      id: 5, name: "Robert Wilson", avatar: "/avatar.svg?height=40&width=40", isHost: false, isReady: false, status: "away" as PlayerStatus, role: "observer" as PlayerRole,
    },
  ] as Player[],
}
// -----------------------------

export default function LobbyPage({ params }: { params: LobbyParams }) {
  // Unwrap params using React.use() as required in Next.js 15
  const unwrappedParams = React.use(params as any) as LobbyParams;
  return <LobbyContent gameId={unwrappedParams.id} />
}

function LobbyContent({ gameId }: { gameId: string }) {
  const router = useRouter()
  const { toast } = useToast() // Destructure toast function from the hook
  const [isHost, setIsHost] = useState(true) // This likely needs to be derived from real user/session data
  const [isReady, setIsReady] = useState(false)
  const [gameMode, setGameMode] = useState<"rapid" | "clash">("rapid")
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [showVoiceChat, setShowVoiceChat] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // --- Use Stable Session Data ---
  // Merge the stable base with the dynamic gameId using useMemo
  const session = useMemo(() => {
    // Find the current user player and mark them
    const playersWithCurrentUser = mockSessionBase.players.map(p => ({
        ...p,
        // Assuming player ID 1 is the current user for this mock setup
        // In a real app, you'd compare against the actual logged-in user ID
        isCurrentUser: p.id === 1
    }));

    return {
      ...mockSessionBase,
      id: gameId || "default-id",
      players: playersWithCurrentUser,
      // Update isHost based on the player marked as current user
      // host: playersWithCurrentUser.find(p => p.isHost)?.name || mockSessionBase.host // Optional: derive host name
    };
  }, [gameId]);

  // Update isHost state based on the session data (only if it changes)
  useEffect(() => {
    const currentUser = session.players.find(p => p.isCurrentUser);
    if (currentUser) {
        setIsHost(currentUser.isHost);
        // Optionally set initial ready state based on data
        // setIsReady(currentUser.isReady);
    }
  }, [session.players]);
  // ---------------------------

  // Show welcome notification on mount
  useEffect(() => {
    toast({ // Use the object syntax
      variant: 'success', // Make sure your toast component supports variants like this
      title: "Welcome to the lobby!",
      description: "Wait for all players to be ready before starting the game.",
      duration: 8000,
    })
  }, [toast]) // Effect runs once on mount

  // --- Wrap handlers in useCallback ---
  const handleCopyCode = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(session.code)
      toast({
        variant: 'success',
        title: "Session code copied",
        description: "Share this code with your team to join the training session",
      })
    } else {
      toast({
        variant: 'destructive', // Changed from 'error' to 'destructive'
        title: "Failed to copy",
        description: "Clipboard access is not available.",
      })
    }
  }, [session.code, toast])

  const handleStartGame = useCallback(async () => {
    setConnectionError(null)
    setIsStarting(true)
    toast({ variant: 'info', title: "Starting session", description: "Preparing the training session...", duration: 3000, })

    try {
      // Simulate network request with potential failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate a 20% chance of failure
          if (Math.random() > 0.8) {
            reject(new Error("Failed to connect to game server"))
          } else {
            resolve(true)
          }
        }, 2000)
      })

      // Success path
      toast({ variant: 'success', title: "Session started!", description: "Redirecting to game...", duration: 2000, })

      // Redirect to the appropriate game mode
      setTimeout(() => {
        if (router) { // Ensure router is available
          if (gameMode === "rapid") {
            router.push(`/multiplayer/rapid/${gameId}`)
          } else {
            router.push(`/multiplayer/clash/${gameId}`)
          }
        }
      }, 1000)
    } catch (error: unknown) {
        console.error("Failed to start game:", error)
        let errorMessage = "Failed to start the game. Please try again.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setConnectionError(errorMessage)
        toast({ variant: 'destructive', title: "Failed to start session", description: "There was a problem connecting to the game server. Please try again.", duration: 5000, })
    } finally {
      setIsStarting(false)
    }
  }, [toast, gameId, gameMode, router]); // Dependencies used inside the handler

  const handleToggleReady = useCallback(() => {
    const newReadyState = !isReady;
    setIsReady(newReadyState)
    // Here you would typically also send this update to the server
    toast({
        variant: 'info',
        title: newReadyState ? "You are now ready" : "Ready status canceled",
        description: newReadyState ? "Waiting for other players to be ready" : "You can change your mind at any time",
        duration: 3000,
    })
  }, [isReady, toast]);

  const handleKickPlayer = useCallback((playerId: number | string) => {
    // Add actual kick logic here (e.g., send request to server)
    console.log("Kicking player:", playerId);
    toast({ variant: 'destructive', title: "Player kicked", description: `Player ${playerId} has been removed (simulation).`, })
  }, [toast]);

  const handlePromotePlayer = useCallback((playerId: number | string) => {
     // Add actual promote logic here (e.g., send request to server)
     console.log("Promoting player:", playerId);
     toast({ variant: 'success', title: "Player promoted", description: `Player ${playerId} is now a host (simulation).`, })
  }, [toast]);

  const handleEditSettings = useCallback(() => {
    router.push(`/multiplayer/settings/${gameId}`)
  }, [router, gameId]);

  const handleSetGameMode = useCallback((mode: "rapid" | "clash") => {
      setGameMode(mode);
  }, []); // No dependencies needed as it only calls setGameMode

  const handleToggleChatCollapsed = useCallback(() => {
      setChatCollapsed(prev => !prev);
  }, []);

  const handleToggleShowVoiceChat = useCallback(() => {
      setShowVoiceChat(prev => !prev);
  }, []);
  // ---------------------------------

  // --- Derived values ---
  // These calculations are cheap, useMemo is likely overkill unless players array is huge
  const readyCount = useMemo(() => session.players.filter((player) => player.isReady).length, [session.players]);
  const totalPlayers = session.players.length;
  const allReady = useMemo(() => readyCount === totalPlayers, [readyCount, totalPlayers]);
  // --------------------

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <div className="p-3 sm:p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-5xl mx-auto">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-xl sm:text-2xl font-bold">{session.title}</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm text-muted-foreground">Waiting for all players to be ready</p>
              <ConnectionStatus /> {/* Ensure this component handles its own state or receives stable props */}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm">
                {readyCount}/{totalPlayers} ready
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/multiplayer">Leave</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          {/* Left Column (Player List, Voice Chat, Actions, Game Chat) */}
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            {/* Pass stable props derived from the memoized session and state */}
            <PlayerList
              players={session.players} // Stable prop
              showReadyStatus={true}
              showControls={isHost} // Stable state
              onKickPlayer={handleKickPlayer} // Stable callback
              onPromotePlayer={handlePromotePlayer} // Stable callback
              onToggleReady={handleToggleReady} // Stable callback (for non-hosts)
              isCurrentUserReady={isReady} // Stable state
              isCurrentUserHost={isHost} // Stable state
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <VoiceChatControls />

              <Card className="h-32 py-0 gap-0 pt-0 pb-0">
                <CardHeader className="p-3 pt-2 pb-1 gap-0">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={handleToggleShowVoiceChat}>
                      {showVoiceChat ? "Hide VC" : "Show VC"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToggleChatCollapsed}>
                      {chatCollapsed ? "Show Chat" : "Hide Chat"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyCode}>
                      Copy Code
                    </Button>
                    {isHost && (
                      <Button variant="outline" size="sm" onClick={handleEditSettings}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connection Error Display */}
            {connectionError && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="text-red-500 mt-1 flex-shrink-0">
                    <X className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-700 dark:text-red-400">Connection Error</h3>
                    <p className="text-sm text-red-600 dark:text-red-300">{connectionError}</p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Please check your internet connection and try again.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conditionally render GameChat */}
            {!chatCollapsed && (
              <GameChat
                sessionId={session.id} // Stable prop
                onToggleCollapse={handleToggleChatCollapsed} // Stable callback
                className="transition-opacity duration-300 ease-in-out"
                // Ensure GameChat fetches/manages its own messages or receives stable message props
              />
            )}
          </div>

          {/* Right Column (Session Info, Game Mode) */}
          <div className="space-y-4 sm:space-y-6">
            {/* Session Info Card */}
            <Card className="pt-0 pb-0 gap-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-2">
                {/* Session Code Display */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Session Code</p>
                      <p className="text-2xl font-bold tracking-wider mt-1">{session.code}</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleCopyCode}>
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy code</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this code with your team to join the session
                  </p>
                </div>

                {/* Other Session Details */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Topic</span>
                    <span className="text-sm font-medium">{session.topic}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Difficulty</span>
                    <span className="text-sm font-medium">{session.difficulty}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Questions</span>
                    <span className="text-sm font-medium">{session.questions}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Time per Question</span>
                    <span className="text-sm font-medium">{session.timePerQuestion} seconds</span>
                  </div>
                </div>
              </CardContent>
              {/* Edit Settings Button for Host */}
              {isHost && (
                <CardFooter className="p-4 pt-0">
                  <Button variant="outline" className="w-full" onClick={handleEditSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Settings
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Game Mode Selection Card */}
            <Card className="pt-0 pb-0 gap-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Game Mode</CardTitle>
                <CardDescription>Select the type of multiplayer session</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-4">
                  {/* Rapid Response Option */}
                  <div
                    className={cn(`p-4 rounded-lg border-2 cursor-pointer transition-all`,
                      gameMode === "rapid" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                    )}
                    onClick={() => handleSetGameMode("rapid")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Rapid Response</h3>
                        <p className="text-sm text-muted-foreground">Fast-paced challenge with real-time scoring</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Clash Option */}
                  <div
                     className={cn(`p-4 rounded-lg border-2 cursor-pointer transition-all`,
                       gameMode === "clash" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                     )}
                    onClick={() => handleSetGameMode("clash")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Card Clash</h3>
                        <p className="text-sm text-muted-foreground">Competitive flashcard review</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              {/* Start/Ready Button */}
              <CardFooter className="p-4 pt-2">
                {isHost ? (
                  <Button className="w-full" onClick={handleStartGame} disabled={!allReady || isStarting}>
                    {isStarting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        { allReady ? 'Start Session' : `Waiting for ${totalPlayers - readyCount} more...` }
                      </>
                    )}
                  </Button>
                ) : (
                  <Button className="w-full" variant={isReady ? "secondary" : "default"} onClick={handleToggleReady}>
                    {isReady ? "Cancel Ready" : "Ready Up"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Chat Button when collapsed */}
      {chatCollapsed && (
        <Button
          variant="outline"
          className="fixed bottom-4 right-4 z-50 flex h-12 items-center gap-2 rounded-full px-4 shadow-lg"
          onClick={handleToggleChatCollapsed}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">Chat</span>
          {/* Add a real notification count if available */}
          {/* <Badge variant="destructive" className="ml-1 absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">
            5
          </Badge> */}
        </Button>
      )}
    </div>
  )
}