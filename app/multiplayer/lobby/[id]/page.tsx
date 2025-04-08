"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Copy, Heart, MessageSquare, Play, Settings, Shield, Users, X } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { useToast } from "~/hooks/use-toast"
import { ConnectionStatus } from "../../components/connection-status"
import { PlayerList } from "../../components/player-list"
import { GameChat } from "../../components/game-chat"
import { VoiceChatControls } from "../../components/voice-chat-controls"
import { GameNotificationsProvider, useGameNotifications } from "../../components/game-notifications-provider"

export default function LobbyPage({ params }: { params: { id: string } }) {
  return (
    <GameNotificationsProvider>
      <LobbyContent params={params} />
    </GameNotificationsProvider>
  )
}

function LobbyContent({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { showNotification } = useGameNotifications()
  const [isHost, setIsHost] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [gameMode, setGameMode] = useState<"rapid" | "clash">("rapid")
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [showVoiceChat, setShowVoiceChat] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Mock data for the session
  const session = {
    id: params?.id || "default-id",
    code: "FIRST123",
    title: "CPR & AED Challenge",
    host: "John Doe",
    topic: "CPR & AED",
    difficulty: "Intermediate",
    questions: 10,
    timePerQuestion: 30,
    players: [
      {
        id: 1,
        name: "John Doe",
        avatar: "/avatar.svg?height=40&width=40",
        isHost: true,
        isReady: true,
        isCurrentUser: true,
        role: "host",
      },
      {
        id: 2,
        name: "Sarah Johnson",
        avatar: "/avatar.svg?height=40&width=40",
        isHost: false,
        isReady: true,
        status: "idle",
      },
      {
        id: 3,
        name: "Michael Smith",
        avatar: "/avatar.svg?height=40&width=40",
        isHost: false,
        isReady: false,
        status: "typing",
      },
      {
        id: 4,
        name: "Emily Davis",
        avatar: "/avatar.svg?height=40&width=40",
        isHost: false,
        isReady: true,
        status: "idle",
      },
      {
        id: 5,
        name: "Robert Wilson",
        avatar: "/avatar.svg?height=40&width=40",
        isHost: false,
        isReady: false,
        status: "away",
      },
    ],
  }

  // Show welcome notification on mount
  useEffect(() => {
    showNotification(
      "info",
      "Welcome to the lobby!",
      "Wait for all players to be ready before starting the game.",
      8000,
    )
  }, [showNotification])

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(session.code)
      toast({
        title: "Session code copied",
        description: "Share this code with your team to join the training session",
      })

      showNotification("success", "Session code copied", "Share this code with your team to join the training session")
    }
  }

  const handleStartGame = async () => {
    // Reset any previous errors
    setConnectionError(null)
    setIsStarting(true)

    // Show notification
    showNotification("info", "Starting session", "Preparing the training session...", 3000)

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
      showNotification("success", "Session started!", "Redirecting to game...", 2000)

      // Redirect to the appropriate game mode
      setTimeout(() => {
        if (router) {
          if (gameMode === "rapid") {
            router.push(`/multiplayer/rapid/${params?.id || "default-id"}`)
          } else {
            router.push(`/multiplayer/clash/${params?.id || "default-id"}`)
          }
        }
      }, 1000)
    } catch (error) {
      // Error handling
      console.error("Failed to start game:", error)
      setConnectionError(error.message || "Failed to start the game. Please try again.")

      showNotification(
        "error",
        "Failed to start session",
        "There was a problem connecting to the game server. Please try again.",
        5000,
      )
    } finally {
      setIsStarting(false)
    }
  }

  const handleToggleReady = () => {
    setIsReady(!isReady)

    showNotification(
      "success",
      isReady ? "Ready status canceled" : "You are now ready",
      isReady ? "You can change your mind at any time" : "Waiting for other players to be ready",
      3000,
    )
  }

  const handleKickPlayer = (playerId: number | string) => {
    toast({
      title: "Player kicked",
      description: `Player has been removed from the session`,
      variant: "destructive",
    })

    showNotification("info", "Player kicked", "Player has been removed from the session", 3000)
  }

  const handlePromotePlayer = (playerId: number | string) => {
    toast({
      title: "Player promoted",
      description: `Player is now a host`,
    })

    showNotification("success", "Player promoted", "Player is now a host", 3000)
  }

  const handleEditSettings = () => {
    router.push(`/multiplayer/settings/${params.id}`)
  }

  const readyCount = session.players.filter((player) => player.isReady).length
  const totalPlayers = session.players.length
  const allReady = readyCount === totalPlayers

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-3 sm:p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-5xl mx-auto">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-xl sm:text-2xl font-bold">{session.title}</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm text-muted-foreground">Waiting for all players to be ready</p>
              <ConnectionStatus />
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

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <PlayerList
              players={session.players}
              showReadyStatus={true}
              showControls={isHost}
              onKickPlayer={handleKickPlayer}
              onPromotePlayer={handlePromotePlayer}
              onToggleReady={handleToggleReady}
              isCurrentUserReady={isReady}
              isCurrentUserHost={isHost}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <VoiceChatControls />

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowVoiceChat(!showVoiceChat)}>
                      {showVoiceChat ? "Hide Voice Chat" : "Show Voice Chat"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setChatCollapsed(!chatCollapsed)}>
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

            {!chatCollapsed && (
              <GameChat sessionId={session.id.toString()} onToggleCollapse={() => setChatCollapsed(true)} />
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-2">
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
              {isHost && (
                <CardFooter className="p-4 pt-0">
                  <Button variant="outline" className="w-full" onClick={handleEditSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Settings
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Game Mode</CardTitle>
                <CardDescription>Select the type of multiplayer session</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      gameMode === "rapid" ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                    onClick={() => setGameMode("rapid")}
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

                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      gameMode === "clash" ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                    onClick={() => setGameMode("clash")}
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
                        Start Session
                      </>
                    )}
                  </Button>
                ) : (
                  <Button className="w-full" variant={isReady ? "outline" : "default"} onClick={handleToggleReady}>
                    {isReady ? "Cancel Ready" : "Ready Up"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating chat button when collapsed */}
      {chatCollapsed && (
        <Button
          variant="outline"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2"
          onClick={() => setChatCollapsed(false)}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat</span>
          <Badge variant="secondary" className="ml-1">
            5
          </Badge>
        </Button>
      )}
    </div>
  )
}
