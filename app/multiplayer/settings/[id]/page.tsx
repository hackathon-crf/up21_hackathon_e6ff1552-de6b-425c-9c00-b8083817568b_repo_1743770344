"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, HelpCircle, Save } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Slider } from "~/components/ui/slider"
import { Switch } from "~/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { useToast } from "~/hooks/use-toast"
import { GameNotificationsProvider, useGameNotifications } from "../../components/game-notifications-provider"
import { ConnectionStatus } from "../../components/connection-status"

export default function SettingsPage({ params }: { params: { id: string } }) {
  return (
    <GameNotificationsProvider>
      <SettingsContent params={params} />
    </GameNotificationsProvider>
  )
}

function SettingsContent({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { showNotification } = useGameNotifications()
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showUnsavedChangesWarning, setShowUnsavedChangesWarning] = useState(false)

  // Initial settings state
  const [settings, setSettings] = useState({
    general: {
      sessionName: "CPR & AED Challenge",
      difficulty: "intermediate",
      maxPlayers: 8,
      allowLateJoin: true,
      isPrivate: false,
      password: "",
    },
    gameplay: {
      gameMode: "rapid",
      questionsCount: 10,
      timePerQuestion: 30,
      showLeaderboardAfterEachQuestion: true,
      allowHints: true,
      hintPenalty: 200,
      streakBonusMultiplier: 1,
    },
    content: {
      topics: ["cpr", "aed", "choking"],
      includeImages: true,
      includeVideos: false,
      questionTypes: ["multiple-choice", "true-false"],
      difficultyProgression: "fixed",
    },
    advanced: {
      networkTimeout: 30,
      reconnectAttempts: 3,
      enableVoiceChat: false,
      enableTextChat: true,
      moderationLevel: "medium",
    },
  })

  // Track changes to settings
  useEffect(() => {
    setHasChanges(true)
  }, [settings])

  // Handle back button with unsaved changes
  const handleBack = () => {
    if (hasChanges) {
      setShowUnsavedChangesWarning(true)
    } else {
      router.push(`/multiplayer/lobby/${params.id}`)
    }
  }

  // Handle save settings
  const handleSaveSettings = async () => {
    setIsSaving(true)

    // Show notification
    showNotification("info", "Saving settings...", "Your session settings are being updated", 2000)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Success
      setIsSaving(false)
      setHasChanges(false)

      toast({
        title: "Settings saved",
        description: "Your session settings have been updated successfully",
      })

      showNotification("success", "Settings saved", "Your session settings have been updated successfully", 3000)

      // Navigate back to lobby
      setTimeout(() => {
        router.push(`/multiplayer/lobby/${params.id}`)
      }, 1000)
    } catch (error) {
      // Error handling
      setIsSaving(false)

      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      })

      showNotification(
        "error",
        "Error saving settings",
        "There was a problem saving your settings. Please try again.",
        5000,
      )
    }
  }

  // Handle discard changes
  const handleDiscardChanges = () => {
    setShowUnsavedChangesWarning(false)
    router.push(`/multiplayer/lobby/${params.id}`)
  }

  // Handle continue editing
  const handleContinueEditing = () => {
    setShowUnsavedChangesWarning(false)
  }

  // Update settings helper
  const updateSettings = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-3 sm:p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-5xl mx-auto">
          <div className="mb-2 sm:mb-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleBack} className="mr-1">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Session Settings</h1>
            </div>
            <div className="flex items-center gap-2 ml-9">
              <p className="text-xs sm:text-sm text-muted-foreground">Configure your multiplayer session</p>
              <ConnectionStatus />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {hasChanges && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
            <Button
              variant="default"
              onClick={handleSaveSettings}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                  <CardDescription>Configure basic session settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionName">Session Name</Label>
                    <Input
                      id="sessionName"
                      value={settings.general.sessionName}
                      onChange={(e) => updateSettings("general", "sessionName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={settings.general.difficulty}
                      onValueChange={(value) => updateSettings("general", "difficulty", value)}
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="maxPlayers">Maximum Players</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Set the maximum number of players that can join this session</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-sm font-medium">{settings.general.maxPlayers}</span>
                    </div>
                    <Slider
                      id="maxPlayers"
                      min={2}
                      max={16}
                      step={1}
                      value={[settings.general.maxPlayers]}
                      onValueChange={(value) => updateSettings("general", "maxPlayers", value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>2</span>
                      <span>16</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="allowLateJoin">Allow Late Join</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Allow players to join after the session has started</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      id="allowLateJoin"
                      checked={settings.general.allowLateJoin}
                      onCheckedChange={(checked) => updateSettings("general", "allowLateJoin", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPrivate">Private Session</Label>
                    <Switch
                      id="isPrivate"
                      checked={settings.general.isPrivate}
                      onCheckedChange={(checked) => updateSettings("general", "isPrivate", checked)}
                    />
                  </div>

                  {settings.general.isPrivate && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Session Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={settings.general.password}
                        onChange={(e) => updateSettings("general", "password", e.target.value)}
                        placeholder="Enter a password for your private session"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gameplay Settings */}
            <TabsContent value="gameplay" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Game Mode</CardTitle>
                  <CardDescription>Select the type of multiplayer session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={settings.gameplay.gameMode}
                    onValueChange={(value) => updateSettings("gameplay", "gameMode", value)}
                    className="space-y-4"
                  >
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="rapid" id="rapid" />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="rapid" className="font-medium">
                          Rapid Response
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Fast-paced challenge with real-time scoring based on speed and accuracy
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="clash" id="clash" />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="clash" className="font-medium">
                          Card Clash
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Competitive flashcard review where players race to answer correctly
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Game Parameters</CardTitle>
                  <CardDescription>Configure gameplay settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="questionsCount">Number of Questions</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Set the number of questions in this session</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-sm font-medium">{settings.gameplay.questionsCount}</span>
                    </div>
                    <Slider
                      id="questionsCount"
                      min={5}
                      max={30}
                      step={5}
                      value={[settings.gameplay.questionsCount]}
                      onValueChange={(value) => updateSettings("gameplay", "questionsCount", value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5</span>
                      <span>30</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="timePerQuestion">Time per Question (seconds)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Set the time limit for each question</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-sm font-medium">{settings.gameplay.timePerQuestion}s</span>
                    </div>
                    <Slider
                      id="timePerQuestion"
                      min={10}
                      max={120}
                      step={5}
                      value={[settings.gameplay.timePerQuestion]}
                      onValueChange={(value) => updateSettings("gameplay", "timePerQuestion", value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10s</span>
                      <span>120s</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showLeaderboard">Show Leaderboard After Each Question</Label>
                    <Switch
                      id="showLeaderboard"
                      checked={settings.gameplay.showLeaderboardAfterEachQuestion}
                      onCheckedChange={(checked) =>
                        updateSettings("gameplay", "showLeaderboardAfterEachQuestion", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowHints">Allow Hints</Label>
                    <Switch
                      id="allowHints"
                      checked={settings.gameplay.allowHints}
                      onCheckedChange={(checked) => updateSettings("gameplay", "allowHints", checked)}
                    />
                  </div>

                  {settings.gameplay.allowHints && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="hintPenalty">Hint Penalty (points)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Points deducted when a player uses a hint</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="text-sm font-medium">{settings.gameplay.hintPenalty}</span>
                      </div>
                      <Slider
                        id="hintPenalty"
                        min={0}
                        max={500}
                        step={50}
                        value={[settings.gameplay.hintPenalty]}
                        onValueChange={(value) => updateSettings("gameplay", "hintPenalty", value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>500</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="streakBonus">Streak Bonus Multiplier</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Multiplier for consecutive correct answers</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-sm font-medium">{settings.gameplay.streakBonusMultiplier}x</span>
                    </div>
                    <Slider
                      id="streakBonus"
                      min={0}
                      max={3}
                      step={0.5}
                      value={[settings.gameplay.streakBonusMultiplier]}
                      onValueChange={(value) => updateSettings("gameplay", "streakBonusMultiplier", value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0x</span>
                      <span>3x</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Settings */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Selection</CardTitle>
                  <CardDescription>Choose what content to include in your session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Topics</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="topic-cpr"
                          checked={settings.content.topics.includes("cpr")}
                          onChange={(e) => {
                            const newTopics = e.target.checked
                              ? [...settings.content.topics, "cpr"]
                              : settings.content.topics.filter((t) => t !== "cpr")
                            updateSettings("content", "topics", newTopics)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="topic-cpr" className="text-sm font-normal">
                          CPR
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="topic-aed"
                          checked={settings.content.topics.includes("aed")}
                          onChange={(e) => {
                            const newTopics = e.target.checked
                              ? [...settings.content.topics, "aed"]
                              : settings.content.topics.filter((t) => t !== "aed")
                            updateSettings("content", "topics", newTopics)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="topic-aed" className="text-sm font-normal">
                          AED
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="topic-choking"
                          checked={settings.content.topics.includes("choking")}
                          onChange={(e) => {
                            const newTopics = e.target.checked
                              ? [...settings.content.topics, "choking"]
                              : settings.content.topics.filter((t) => t !== "choking")
                            updateSettings("content", "topics", newTopics)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="topic-choking" className="text-sm font-normal">
                          Choking
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="topic-bleeding"
                          checked={settings.content.topics.includes("bleeding")}
                          onChange={(e) => {
                            const newTopics = e.target.checked
                              ? [...settings.content.topics, "bleeding"]
                              : settings.content.topics.filter((t) => t !== "bleeding")
                            updateSettings("content", "topics", newTopics)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="topic-bleeding" className="text-sm font-normal">
                          Bleeding Control
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="topic-shock"
                          checked={settings.content.topics.includes("shock")}
                          onChange={(e) => {
                            const newTopics = e.target.checked
                              ? [...settings.content.topics, "shock"]
                              : settings.content.topics.filter((t) => t !== "shock")
                            updateSettings("content", "topics", newTopics)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="topic-shock" className="text-sm font-normal">
                          Shock
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="topic-burns"
                          checked={settings.content.topics.includes("burns")}
                          onChange={(e) => {
                            const newTopics = e.target.checked
                              ? [...settings.content.topics, "burns"]
                              : settings.content.topics.filter((t) => t !== "burns")
                            updateSettings("content", "topics", newTopics)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="topic-burns" className="text-sm font-normal">
                          Burns
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeImages">Include Images</Label>
                    <Switch
                      id="includeImages"
                      checked={settings.content.includeImages}
                      onCheckedChange={(checked) => updateSettings("content", "includeImages", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeVideos">Include Videos</Label>
                    <Switch
                      id="includeVideos"
                      checked={settings.content.includeVideos}
                      onCheckedChange={(checked) => updateSettings("content", "includeVideos", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Question Types</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="type-multiple-choice"
                          checked={settings.content.questionTypes.includes("multiple-choice")}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...settings.content.questionTypes, "multiple-choice"]
                              : settings.content.questionTypes.filter((t) => t !== "multiple-choice")
                            updateSettings("content", "questionTypes", newTypes)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="type-multiple-choice" className="text-sm font-normal">
                          Multiple Choice
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="type-true-false"
                          checked={settings.content.questionTypes.includes("true-false")}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...settings.content.questionTypes, "true-false"]
                              : settings.content.questionTypes.filter((t) => t !== "true-false")
                            updateSettings("content", "questionTypes", newTypes)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="type-true-false" className="text-sm font-normal">
                          True/False
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="type-short-answer"
                          checked={settings.content.questionTypes.includes("short-answer")}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...settings.content.questionTypes, "short-answer"]
                              : settings.content.questionTypes.filter((t) => t !== "short-answer")
                            updateSettings("content", "questionTypes", newTypes)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="type-short-answer" className="text-sm font-normal">
                          Short Answer
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="type-scenario"
                          checked={settings.content.questionTypes.includes("scenario")}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...settings.content.questionTypes, "scenario"]
                              : settings.content.questionTypes.filter((t) => t !== "scenario")
                            updateSettings("content", "questionTypes", newTypes)
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="type-scenario" className="text-sm font-normal">
                          Scenario-based
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficultyProgression">Difficulty Progression</Label>
                    <Select
                      value={settings.content.difficultyProgression}
                      onValueChange={(value) => updateSettings("content", "difficultyProgression", value)}
                    >
                      => updateSettings('content', 'difficultyProgression', value)} >
                      <SelectTrigger id="difficultyProgression">
                        <SelectValue placeholder="Select progression" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed (Same difficulty throughout)</SelectItem>
                        <SelectItem value="increasing">Increasing (Easy to Hard)</SelectItem>
                        <SelectItem value="decreasing">Decreasing (Hard to Easy)</SelectItem>
                        <SelectItem value="mixed">Mixed (Random difficulty)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Network Settings</CardTitle>
                  <CardDescription>Configure network and connection parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="networkTimeout">Network Timeout (seconds)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Time to wait before considering a connection lost</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-sm font-medium">{settings.advanced.networkTimeout}s</span>
                    </div>
                    <Slider
                      id="networkTimeout"
                      min={10}
                      max={60}
                      step={5}
                      value={[settings.advanced.networkTimeout]}
                      onValueChange={(value) => updateSettings("advanced", "networkTimeout", value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10s</span>
                      <span>60s</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="reconnectAttempts">Reconnection Attempts</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Number of times to attempt reconnection before giving up</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-sm font-medium">{settings.advanced.reconnectAttempts}</span>
                    </div>
                    <Slider
                      id="reconnectAttempts"
                      min={1}
                      max={10}
                      step={1}
                      value={[settings.advanced.reconnectAttempts]}
                      onValueChange={(value) => updateSettings("advanced", "reconnectAttempts", value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Communication Settings</CardTitle>
                  <CardDescription>Configure player communication options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableVoiceChat">Enable Voice Chat</Label>
                    <Switch
                      id="enableVoiceChat"
                      checked={settings.advanced.enableVoiceChat}
                      onCheckedChange={(checked) => updateSettings("advanced", "enableVoiceChat", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableTextChat">Enable Text Chat</Label>
                    <Switch
                      id="enableTextChat"
                      checked={settings.advanced.enableTextChat}
                      onCheckedChange={(checked) => updateSettings("advanced", "enableTextChat", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="moderationLevel">Moderation Level</Label>
                    <Select
                      value={settings.advanced.moderationLevel}
                      onValueChange={(value) => updateSettings("advanced", "moderationLevel", value)}
                    >
                      <SelectTrigger id="moderationLevel">
                        <SelectValue placeholder="Select moderation level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Controls automatic filtering of inappropriate content in chat
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Unsaved changes warning dialog */}
      {showUnsavedChangesWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-bold">Unsaved Changes</h2>
            </div>
            <p className="mb-6">
              You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleContinueEditing}>
                Continue Editing
              </Button>
              <Button variant="destructive" onClick={handleDiscardChanges}>
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
