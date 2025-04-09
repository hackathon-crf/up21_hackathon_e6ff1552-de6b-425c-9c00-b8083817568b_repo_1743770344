"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Crown, Gamepad2, Users } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { DashboardHeader } from "~/components/dashboard-header"
import { useToast } from "~/hooks/use-toast"

export default function MultiplayerPage() {
  return <MultiplayerContent />
}

function MultiplayerContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [gameCode, setGameCode] = useState("")

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code)
      toast({
        title: "Game code copied",
        description: "Share this code with your team to join the training session",
      })
    }
  }

  const handleCreateGame = (mode: string) => {
    // In a real app, this would create a new game with a unique ID
    // For now, we'll simulate by redirecting to a lobby with a fixed ID
    const gameId = "new-game-123"

    toast({
      title: `${mode} created`,
      description: `Your ${mode.toLowerCase()} session has been created`,
    })

    // Redirect to the lobby page
    if (router) {
      router.push(`/multiplayer/lobby/${gameId}`)
    }
  }

  const handleJoinGame = () => {
    if (!gameCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a game code",
        variant: "destructive",
      })
      return
    }

    // For the demo, if the code is FIRST123, we'll simulate joining a game
    if (gameCode.toUpperCase() === "FIRST123") {
      toast({
        title: "Joining session",
        description: `Connecting to training session ${gameCode}...`,
      })

      // Redirect to the lobby page
      if (router) {
        router.push(`/multiplayer/lobby/demo-game-123`)
      }
    } else {
      toast({
        title: "Error",
        description: "Invalid game code. Try FIRST123 for the demo.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Multiplayer"
        description="Challenge your team and test your first aid knowledge together"
      />

      <main className="flex-1 p-6">
        <Tabs defaultValue="join" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join">Join Session</TabsTrigger>
            <TabsTrigger value="create">Create Session</TabsTrigger>
          </TabsList>

          <TabsContent value="join" className="space-y-4 mt-6">
            <Card className="p-4 px-0">
              <CardHeader>
                <CardTitle>Join an Existing Session</CardTitle>
                <CardDescription>Enter a session code to join a training activity with your team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter session code (e.g., FIRST123)"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleJoinGame()
                      }
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleJoinGame}>
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  Join Session
                </Button>
              </CardFooter>
            </Card>

            <Card className="p-4 px-0">
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your recently played training sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Crown className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">CPR & AED Challenge</p>
                        <p className="text-xs text-muted-foreground">
                          Yesterday at 3:45 PM • 5 participants • Rapid Response
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Results
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">First Aid Basics</p>
                        <p className="text-xs text-muted-foreground">3 days ago • 3 participants • Card Clash</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Gamepad2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Rapid Response</CardTitle>
                  </div>
                  <CardDescription>
                    Fast-paced challenge with real-time scoring based on speed and accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Your Session Code</p>
                          <p className="text-2xl font-bold tracking-wider mt-1">RAPID123</p>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => handleCopyCode("RAPID123")}>
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleCreateGame("Rapid Response")}>
                    Create Rapid Response
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Card Clash</CardTitle>
                  </div>
                  <CardDescription>
                    Team-based flashcard challenge where teams compete to answer correctly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Your Session Code</p>
                          <p className="text-2xl font-bold tracking-wider mt-1">CLASH123</p>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => handleCopyCode("CLASH123")}>
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleCreateGame("Card Clash")}>
                    Create Card Clash
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
