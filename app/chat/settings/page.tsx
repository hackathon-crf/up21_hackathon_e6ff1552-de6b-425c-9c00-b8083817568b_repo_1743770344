"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Book,
  Brain,
  Check,
  Database,
  FileText,
  Globe,
  HardDrive,
  Key,
  MessageSquare,
  Plus,
  Save,
  Settings,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  Download,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Textarea } from "~/components/ui/textarea"
import { Switch } from "~/components/ui/switch"
import { Slider } from "~/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { DashboardHeader } from "~/components/dashboard-header"
import { useToast } from "~/hooks/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion"
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
} from "~/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { motion } from "framer-motion"

export default function AIAssistantSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Model Settings State
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4000)
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)

  // Prompt Settings State
  const [defaultPrompt, setDefaultPrompt] = useState(
    "You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately.",
  )
  const [promptPrefix, setPromptPrefix] = useState("")
  const [promptSuffix, setPromptSuffix] = useState(
    "Please provide reliable information based on official Red Cross guidelines.",
  )
  const [savedPrompts, setSavedPrompts] = useState([
    { id: 1, name: "First Aid Basics", prompt: "Explain basic first aid procedures for common injuries." },
    { id: 2, name: "CPR Instructions", prompt: "Provide step-by-step CPR instructions for adults." },
    { id: 3, name: "Emergency Response", prompt: "Outline emergency response protocols for disaster situations." },
  ])
  const [newPromptName, setNewPromptName] = useState("")
  const [newPromptContent, setNewPromptContent] = useState("")

  // RAG Settings State
  const [ragEnabled, setRagEnabled] = useState(true)
  const [chunkSize, setChunkSize] = useState(1000)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.75)
  const [dataSources, setDataSources] = useState([
    { id: 1, name: "Red Cross First Aid Manual", type: "pdf", enabled: true },
    { id: 2, name: "Emergency Response Guidelines", type: "pdf", enabled: true },
    { id: 3, name: "CPR & AED Training Materials", type: "pdf", enabled: true },
  ])
  const [newDataSource, setNewDataSource] = useState("")
  const [newDataSourceType, setNewDataSourceType] = useState("pdf")

  // Other Settings State
  const [darkMode, setDarkMode] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoSaveHistory, setAutoSaveHistory] = useState(true)
  const [historyRetentionDays, setHistoryRetentionDays] = useState(30)
  const [streamingEnabled, setStreamingEnabled] = useState(true)
  const [citationsEnabled, setCitationsEnabled] = useState(true)

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real app, this would save settings to a database or local storage
    toast({
      title: "Settings saved",
      description: "Your AI Assistant settings have been updated successfully.",
    })
  }

  // Handle adding a new saved prompt
  const handleAddSavedPrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a name and content for the prompt.",
        variant: "destructive",
      })
      return
    }

    const newPrompt = {
      id: savedPrompts.length + 1,
      name: newPromptName,
      prompt: newPromptContent,
    }

    setSavedPrompts([...savedPrompts, newPrompt])
    setNewPromptName("")
    setNewPromptContent("")

    toast({
      title: "Prompt saved",
      description: "Your prompt template has been saved successfully.",
    })
  }

  // Handle deleting a saved prompt
  const handleDeleteSavedPrompt = (id: number) => {
    setSavedPrompts(savedPrompts.filter((prompt) => prompt.id !== id))

    toast({
      title: "Prompt deleted",
      description: "The prompt template has been removed.",
    })
  }

  // Handle adding a new data source
  const handleAddDataSource = () => {
    if (!newDataSource.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for the data source.",
        variant: "destructive",
      })
      return
    }

    const newSource = {
      id: dataSources.length + 1,
      name: newDataSource,
      type: newDataSourceType,
      enabled: true,
    }

    setDataSources([...dataSources, newSource])
    setNewDataSource("")

    toast({
      title: "Data source added",
      description: "The new data source has been added successfully.",
    })
  }

  // Handle toggling a data source
  const handleToggleDataSource = (id: number) => {
    setDataSources(dataSources.map((source) => (source.id === id ? { ...source, enabled: !source.enabled } : source)))
  }

  // Handle deleting a data source
  const handleDeleteDataSource = (id: number) => {
    setDataSources(dataSources.filter((source) => source.id !== id))

    toast({
      title: "Data source removed",
      description: "The data source has been removed successfully.",
    })
  }

  // Handle resetting all settings to defaults
  const handleResetSettings = () => {
    // Reset model settings
    setSelectedModel("gpt-4o")
    setTemperature(0.7)
    setMaxTokens(4000)

    // Reset prompt settings
    setDefaultPrompt(
      "You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately.",
    )
    setPromptPrefix("")
    setPromptSuffix("Please provide reliable information based on official Red Cross guidelines.")

    // Reset RAG settings
    setRagEnabled(true)
    setChunkSize(1000)
    setSimilarityThreshold(0.75)

    // Reset other settings
    setDarkMode(false)
    setNotificationsEnabled(true)
    setAutoSaveHistory(true)
    setHistoryRetentionDays(30)
    setStreamingEnabled(true)
    setCitationsEnabled(true)

    toast({
      title: "Settings reset",
      description: "All settings have been reset to their default values.",
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/80">
      <DashboardHeader
        title="AI Assistant Settings"
        description="Configure your AI assistant's behavior and capabilities"
      />

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="mb-4 group">
              <Link href="/chat">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Chat
              </Link>
            </Button>

            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="transition-all hover:bg-destructive/10">
                    Reset to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-2">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all AI Assistant settings to their default values. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetSettings}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button onClick={handleSaveSettings} className="relative overflow-hidden group">
                <span className="relative z-10 flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </span>
                <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="model" className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="model" className="flex items-center gap-2 data-[state=active]:bg-background">
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">Model Settings</span>
                <span className="md:hidden">Model</span>
              </TabsTrigger>
              <TabsTrigger value="prompt" className="flex items-center gap-2 data-[state=active]:bg-background">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden md:inline">Prompt Settings</span>
                <span className="md:hidden">Prompt</span>
              </TabsTrigger>
              <TabsTrigger value="rag" className="flex items-center gap-2 data-[state=active]:bg-background">
                <Database className="h-4 w-4" />
                <span className="hidden md:inline">RAG Settings</span>
                <span className="md:hidden">RAG</span>
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-2 data-[state=active]:bg-background">
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Other Settings</span>
                <span className="md:hidden">Other</span>
              </TabsTrigger>
            </TabsList>

            {/* Model Settings Tab */}
            <TabsContent value="model" className="space-y-4">
              <Card className="border-2 shadow-md overflow-hidden">
                <CardHeader className="bg-card/50 backdrop-blur-sm border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Model Configuration
                  </CardTitle>
                  <CardDescription>
                    Select the AI model and adjust parameters to control the assistant's behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="model-select" className="text-base font-medium">
                      AI Model
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger id="model-select" className="border-2 h-11">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">
                          <div className="flex items-center gap-2">
                            <span>GPT-4o</span>
                            <Badge className="ml-2 bg-primary/20 text-primary hover:bg-primary/30">Recommended</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="llama-3">Llama 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      The AI model determines the quality, capabilities, and cost of responses
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature-slider" className="text-base font-medium">
                        Temperature: {temperature}
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              Controls randomness: Lower values (0.1-0.5) for more focused, deterministic responses.
                              Higher values (0.7-1.0) for more creative, varied responses.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Slider
                      id="temperature-slider"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[temperature]}
                      onValueChange={(value) => setTemperature(value[0])}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Precise (0)</span>
                      <span>Balanced (1)</span>
                      <span>Creative (2)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-tokens" className="text-base font-medium">
                      Maximum Output Length
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="max-tokens"
                        type="number"
                        min={100}
                        max={32000}
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(Number.parseInt(e.target.value) || 4000)}
                        className="w-full border-2 h-11"
                      />
                      <Select
                        value={maxTokens.toString()}
                        onValueChange={(value) => setMaxTokens(Number.parseInt(value))}
                        className="w-full sm:w-[180px]"
                      >
                        <SelectTrigger className="border-2 h-11">
                          <SelectValue placeholder="Preset lengths" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1000">Short (1,000)</SelectItem>
                          <SelectItem value="4000">Medium (4,000)</SelectItem>
                          <SelectItem value="8000">Long (8,000)</SelectItem>
                          <SelectItem value="16000">Very Long (16,000)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum number of tokens (words/characters) in the AI's response
                    </p>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="flex items-center gap-2 text-base font-medium">
                      <Key className="h-4 w-4" />
                      API Key Management
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="api-key"
                          type={showApiKey ? "text" : "password"}
                          placeholder="Enter your API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="border-2 h-11 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showApiKey ? "Hide API key" : "Show API key"}</span>
                        </Button>
                      </div>
                      <Button variant="outline" className="w-full sm:w-auto border-2 h-11 hover:bg-muted/50">
                        Verify
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your API key is stored securely and used to authenticate requests to the AI provider
                    </p>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="advanced" className="border-2 rounded-md">
                      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md">
                        Advanced Model Settings
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 px-4 py-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="top-p-slider">Top P: 0.95</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Controls diversity via nucleus sampling: Only consider tokens with the top P
                                    probability mass.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Slider
                            id="top-p-slider"
                            min={0.1}
                            max={1}
                            step={0.05}
                            defaultValue={[0.95]}
                            className="py-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="frequency-penalty-slider">Frequency Penalty: 0.0</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Reduces repetition by penalizing tokens that have already appeared in the text.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Slider
                            id="frequency-penalty-slider"
                            min={-2}
                            max={2}
                            step={0.1}
                            defaultValue={[0]}
                            className="py-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="presence-penalty-slider">Presence Penalty: 0.0</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    Encourages the model to talk about new topics by penalizing tokens that have
                                    appeared at all.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Slider
                            id="presence-penalty-slider"
                            min={-2}
                            max={2}
                            step={0.1}
                            defaultValue={[0]}
                            className="py-2"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prompt Settings Tab */}
            <TabsContent value="prompt" className="space-y-4">
              <Card className="border-2 shadow-md overflow-hidden">
                <CardHeader className="bg-card/50 backdrop-blur-sm border-b">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Prompt Configuration
                  </CardTitle>
                  <CardDescription>Customize how the AI assistant interprets and responds to queries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt" className="text-base font-medium">
                      Default System Prompt
                    </Label>
                    <Textarea
                      id="system-prompt"
                      placeholder="Enter the default system prompt for the AI assistant"
                      value={defaultPrompt}
                      onChange={(e) => setDefaultPrompt(e.target.value)}
                      className="min-h-[100px] border-2 resize-y"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      The system prompt defines the AI's personality, knowledge base, and behavior
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="prompt-prefix" className="text-base font-medium">
                        Prompt Prefix
                      </Label>
                      <Input
                        id="prompt-prefix"
                        placeholder="Text to add before each user prompt"
                        value={promptPrefix}
                        onChange={(e) => setPromptPrefix(e.target.value)}
                        className="border-2 h-11"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Added before each user message</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prompt-suffix" className="text-base font-medium">
                        Prompt Suffix
                      </Label>
                      <Input
                        id="prompt-suffix"
                        placeholder="Text to add after each user prompt"
                        value={promptSuffix}
                        onChange={(e) => setPromptSuffix(e.target.value)}
                        className="border-2 h-11"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Added after each user message</p>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Saved Prompt Templates</h3>
                      <Badge variant="outline" className="border-2">
                        {savedPrompts.length} Templates
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      {savedPrompts.map((prompt) => (
                        <motion.div
                          key={prompt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start justify-between p-4 border-2 rounded-md hover:bg-muted/30 transition-colors"
                        >
                          <div className="space-y-1">
                            <h4 className="font-medium">{prompt.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{prompt.prompt}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setDefaultPrompt(prompt.prompt)
                                toast({
                                  title: "Prompt applied",
                                  description: `"${prompt.name}" has been set as the default prompt.`,
                                })
                              }}
                            >
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Use Prompt</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSavedPrompt(prompt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete Prompt</span>
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-2 border-2 rounded-md p-4 bg-card/50">
                      <h4 className="font-medium">Add New Prompt Template</h4>
                      <div className="space-y-2">
                        <Input
                          placeholder="Template Name"
                          value={newPromptName}
                          onChange={(e) => setNewPromptName(e.target.value)}
                          className="border-2 h-11"
                        />
                        <Textarea
                          placeholder="Prompt Content"
                          value={newPromptContent}
                          onChange={(e) => setNewPromptContent(e.target.value)}
                          className="min-h-[80px] border-2 resize-y"
                        />
                        <Button
                          onClick={handleAddSavedPrompt}
                          className="w-full relative overflow-hidden group"
                          disabled={!newPromptName.trim() || !newPromptContent.trim()}
                        >
                          <span className="relative z-10 flex items-center">
                            <Plus className="mr-2 h-4 w-4" />
                            Save Template
                          </span>
                          <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RAG Settings Tab */}
            <TabsContent value="rag" className="space-y-4">
              <Card className="border-2 shadow-md overflow-hidden">
                <CardHeader className="bg-card/50 backdrop-blur-sm border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Retrieval-Augmented Generation (RAG)
                  </CardTitle>
                  <CardDescription>
                    Configure how the AI retrieves and uses information from your knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="rag-toggle" className="text-base font-medium">
                        Enable RAG
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow the AI to retrieve information from your knowledge base
                      </p>
                    </div>
                    <Switch
                      id="rag-toggle"
                      checked={ragEnabled}
                      onCheckedChange={setRagEnabled}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className={ragEnabled ? "" : "opacity-50 pointer-events-none"}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="chunk-size" className="text-base font-medium">
                            Chunk Size: {chunkSize}
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  The size of text chunks for processing documents. Smaller chunks are more precise but
                                  may lose context.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Slider
                          id="chunk-size"
                          min={100}
                          max={2000}
                          step={100}
                          value={[chunkSize]}
                          onValueChange={(value) => setChunkSize(value[0])}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Small (100)</span>
                          <span>Medium (1000)</span>
                          <span>Large (2000)</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="similarity-threshold" className="text-base font-medium">
                            Similarity Threshold: {similarityThreshold}
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Minimum similarity score required for retrieved content to be included. Higher values
                                  mean more relevant but potentially fewer results.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Slider
                          id="similarity-threshold"
                          min={0.1}
                          max={1.0}
                          step={0.05}
                          value={[similarityThreshold]}
                          onValueChange={(value) => setSimilarityThreshold(value[0])}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Broad (0.1)</span>
                          <span>Balanced (0.5)</span>
                          <span>Strict (1.0)</span>
                        </div>
                      </div>

                      <Separator className="my-2" />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Data Sources</h3>
                          <Badge variant="outline" className="border-2">
                            {dataSources.filter((s) => s.enabled).length} Active
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {dataSources.map((source) => (
                            <motion.div
                              key={source.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between p-4 border-2 rounded-md hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {source.type === "pdf" ? (
                                  <FileText className="h-5 w-5 text-red-500" />
                                ) : source.type === "web" ? (
                                  <Globe className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <HardDrive className="h-5 w-5 text-green-500" />
                                )}
                                <div>
                                  <p className="font-medium">{source.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {source.type.toUpperCase()} • {source.enabled ? "Active" : "Inactive"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Switch
                                  checked={source.enabled}
                                  onCheckedChange={() => handleToggleDataSource(source.id)}
                                  className="data-[state=checked]:bg-primary"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteDataSource(source.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete Source</span>
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="space-y-2 border-2 rounded-md p-4 bg-card/50">
                          <h4 className="font-medium">Add New Data Source</h4>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Data Source Name"
                              value={newDataSource}
                              onChange={(e) => setNewDataSource(e.target.value)}
                              className="flex-1 border-2 h-11"
                            />
                            <Select value={newDataSourceType} onValueChange={setNewDataSourceType}>
                              <SelectTrigger className="w-[120px] border-2 h-11">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="web">Web</SelectItem>
                                <SelectItem value="database">Database</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" className="flex-1 border-2 h-11 hover:bg-muted/50">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload File
                            </Button>
                            <Button
                              onClick={handleAddDataSource}
                              className="flex-1 relative overflow-hidden group"
                              disabled={!newDataSource.trim()}
                            >
                              <span className="relative z-10 flex items-center">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Source
                              </span>
                              <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="advanced-rag" className="border-2 rounded-md">
                          <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md">
                            Advanced RAG Settings
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 px-4 py-3">
                            <div className="space-y-2">
                              <Label htmlFor="embedding-model" className="text-base font-medium">
                                Embedding Model
                              </Label>
                              <Select defaultValue="text-embedding-3-large">
                                <SelectTrigger id="embedding-model" className="border-2 h-11">
                                  <SelectValue placeholder="Select embedding model" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                                  <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                                  <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-sm text-muted-foreground mt-1">
                                Model used to convert text into vector embeddings for similarity search
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="retrieval-count" className="text-base font-medium">
                                Maximum Retrievals
                              </Label>
                              <Input
                                id="retrieval-count"
                                type="number"
                                min={1}
                                max={20}
                                defaultValue={5}
                                className="border-2 h-11"
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                Maximum number of chunks to retrieve per query
                              </p>
                            </div>

                            <div className="flex items-center justify-between space-y-0 pb-2">
                              <div className="space-y-0.5">
                                <Label htmlFor="rerank-toggle" className="text-base font-medium">
                                  Enable Re-ranking
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Apply a secondary ranking to improve retrieval relevance
                                </p>
                              </div>
                              <Switch
                                id="rerank-toggle"
                                defaultChecked={true}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Settings Tab */}
            <TabsContent value="other" className="space-y-4">
              <Card className="border-2 shadow-md overflow-hidden">
                <CardHeader className="bg-card/50 backdrop-blur-sm border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    General Settings
                  </CardTitle>
                  <CardDescription>Configure general preferences and behavior of the AI assistant</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-y-0 p-3 border-2 rounded-md hover:bg-muted/30 transition-colors">
                        <div className="space-y-0.5">
                          <Label htmlFor="dark-mode-toggle" className="text-base font-medium">
                            Dark Mode
                          </Label>
                          <p className="text-sm text-muted-foreground">Switch between light and dark theme</p>
                        </div>
                        <Switch
                          id="dark-mode-toggle"
                          checked={darkMode}
                          onCheckedChange={setDarkMode}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between space-y-0 p-3 border-2 rounded-md hover:bg-muted/30 transition-colors">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifications-toggle" className="text-base font-medium">
                            Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">Enable notifications for AI responses</p>
                        </div>
                        <Switch
                          id="notifications-toggle"
                          checked={notificationsEnabled}
                          onCheckedChange={setNotificationsEnabled}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between space-y-0 p-3 border-2 rounded-md hover:bg-muted/30 transition-colors">
                        <div className="space-y-0.5">
                          <Label htmlFor="streaming-toggle" className="text-base font-medium">
                            Streaming Responses
                          </Label>
                          <p className="text-sm text-muted-foreground">Show AI responses as they are generated</p>
                        </div>
                        <Switch
                          id="streaming-toggle"
                          checked={streamingEnabled}
                          onCheckedChange={setStreamingEnabled}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-y-0 p-3 border-2 rounded-md hover:bg-muted/30 transition-colors">
                        <div className="space-y-0.5">
                          <Label htmlFor="autosave-toggle" className="text-base font-medium">
                            Auto-save History
                          </Label>
                          <p className="text-sm text-muted-foreground">Automatically save chat history</p>
                        </div>
                        <Switch
                          id="autosave-toggle"
                          checked={autoSaveHistory}
                          onCheckedChange={setAutoSaveHistory}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between space-y-0 p-3 border-2 rounded-md hover:bg-muted/30 transition-colors">
                        <div className="space-y-0.5">
                          <Label htmlFor="citations-toggle" className="text-base font-medium">
                            Show Citations
                          </Label>
                          <p className="text-sm text-muted-foreground">Display source citations in AI responses</p>
                        </div>
                        <Switch
                          id="citations-toggle"
                          checked={citationsEnabled}
                          onCheckedChange={setCitationsEnabled}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>

                      <div className="space-y-2 p-3 border-2 rounded-md hover:bg-muted/30 transition-colors">
                        <Label htmlFor="history-retention" className="text-base font-medium">
                          History Retention (Days)
                        </Label>
                        <Input
                          id="history-retention"
                          type="number"
                          min={1}
                          max={365}
                          value={historyRetentionDays}
                          onChange={(e) => setHistoryRetentionDays(Number.parseInt(e.target.value) || 30)}
                          className="border-2 h-11"
                        />
                        <p className="text-sm text-muted-foreground mt-1">Number of days to keep chat history</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Chat Interface</h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 p-3 border-2 rounded-md hover:bg-muted/30 transition-colors">
                        <Label htmlFor="font-size" className="text-base font-medium">
                          Font Size
                        </Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="font-size" className="border-2 h-11">
                            <SelectValue placeholder="Select font size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 p-3 border-2 rounded-md hover:bg-muted/30 transition-colors">
                        <Label htmlFor="code-theme" className="text-base font-medium">
                          Code Syntax Highlighting
                        </Label>
                        <Select defaultValue="github-dark">
                          <SelectTrigger id="code-theme" className="border-2 h-11">
                            <SelectValue placeholder="Select code theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="github-dark">GitHub Dark</SelectItem>
                            <SelectItem value="github-light">GitHub Light</SelectItem>
                            <SelectItem value="dracula">Dracula</SelectItem>
                            <SelectItem value="nord">Nord</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2 p-3 border-2 rounded-md hover:bg-muted/30 transition-colors">
                      <Label htmlFor="message-display" className="text-base font-medium">
                        Message Display
                      </Label>
                      <Select defaultValue="bubbles">
                        <SelectTrigger id="message-display" className="border-2 h-11">
                          <SelectValue placeholder="Select message display style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bubbles">Chat Bubbles</SelectItem>
                          <SelectItem value="blocks">Message Blocks</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Export & Import</h3>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 border-2 h-11 hover:bg-muted/50">
                        <Upload className="mr-2 h-4 w-4" />
                        Import Settings
                      </Button>
                      <Button variant="outline" className="flex-1 border-2 h-11 hover:bg-muted/50">
                        <Download className="mr-2 h-4 w-4" />
                        Export Settings
                      </Button>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear All Data
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-2">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all your chat history, saved prompts, and custom settings. This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground">
                            Yes, delete everything
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-md overflow-hidden">
                <CardHeader className="bg-card/50 backdrop-blur-sm border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5 text-primary" />
                    Documentation & Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border-2 rounded-md p-4 hover:bg-muted/30 transition-colors group">
                      <h3 className="font-medium mb-2 flex items-center">
                        AI Model Documentation
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Learn about the AI models and their capabilities
                      </p>
                      <Button variant="outline" className="w-full border-2 hover:bg-muted/50">
                        View Documentation
                      </Button>
                    </div>
                    <div className="border-2 rounded-md p-4 hover:bg-muted/30 transition-colors group">
                      <h3 className="font-medium mb-2 flex items-center">
                        RAG Configuration Guide
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Best practices for setting up retrieval-augmented generation
                      </p>
                      <Button variant="outline" className="w-full border-2 hover:bg-muted/50">
                        Read Guide
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
