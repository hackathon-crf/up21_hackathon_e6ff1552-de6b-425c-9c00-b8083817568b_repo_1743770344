"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Edit, Plus, Search, Trash2, Upload } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { useToast } from "~/hooks/use-toast"

interface Flashcard {
  id: string
  question: string
  answer: string
  lastReviewed: string
  nextReview: string
  difficulty: "Easy" | "Medium" | "Hard"
}

export default function ManageDeckPage({ params }: { params: { deck: string } }) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")

  // Format the deck name for display
  const formatDeckName = (name: string) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" & ")
  }

  // Mock data for the flashcards - would be replaced with actual data in a real app
  const mockCards: Flashcard[] = [
    {
      id: "1",
      question: "What is the correct compression rate for adult CPR?",
      answer: "100-120 compressions per minute",
      lastReviewed: "2023-05-15",
      nextReview: "2023-05-18",
      difficulty: "Medium",
    },
    {
      id: "2",
      question: "How deep should chest compressions be for an adult?",
      answer: "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
      lastReviewed: "2023-05-14",
      nextReview: "2023-05-19",
      difficulty: "Hard",
    },
    {
      id: "3",
      question: "What is the correct hand placement for adult CPR?",
      answer:
        "Place the heel of one hand on the center of the chest (sternum), then place the other hand on top and interlock fingers",
      lastReviewed: "2023-05-16",
      nextReview: "2023-05-20",
      difficulty: "Easy",
    },
    {
      id: "4",
      question: "When should you use an AED?",
      answer: "As soon as it's available for a person who is unresponsive and not breathing normally",
      lastReviewed: "2023-05-13",
      nextReview: "2023-05-17",
      difficulty: "Medium",
    },
    {
      id: "5",
      question: "What should you do if the AED advises 'no shock'?",
      answer: "Resume CPR immediately, starting with compressions",
      lastReviewed: "2023-05-12",
      nextReview: "2023-05-16",
      difficulty: "Medium",
    },
  ]

  const filteredCards = mockCards.filter(
    (card) =>
      card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddCard = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({
        title: "Error",
        description: "Question and answer cannot be empty",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would add the card to the database
    toast({
      title: "Card added",
      description: "Your flashcard has been added to the deck",
    })

    // Reset form
    setNewQuestion("")
    setNewAnswer("")
  }

  const handleDeleteCard = (id: string) => {
    // In a real app, this would delete the card from the database
    toast({
      title: "Card deleted",
      description: "Your flashcard has been removed from the deck",
    })
  }

  const handleGenerateAI = () => {
    // In a real app, this would generate cards using AI
    toast({
      title: "AI generation started",
      description: "Generating new flashcards based on your settings",
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/flashcards">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to decks</span>
            </Link>
          </Button>
          <div className="ml-4 flex-1">
            <h1 className="text-2xl font-bold">{formatDeckName(params.deck)}</h1>
            <p className="text-sm text-muted-foreground">Manage your flashcards</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6">
        <Tabs defaultValue="cards" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Flashcard</DialogTitle>
                    <DialogDescription>
                      Create a new flashcard for your {formatDeckName(params.deck)} deck
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="question">Question</Label>
                      <Textarea
                        id="question"
                        placeholder="Enter your question here"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="answer">Answer</Label>
                      <Textarea
                        id="answer"
                        placeholder="Enter the answer here"
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewQuestion("")
                        setNewAnswer("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddCard}>Add Card</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Flashcards</DialogTitle>
                    <DialogDescription>Upload a CSV or JSON file to import flashcards</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium">Drag and drop your file here, or click to browse</p>
                      <p className="mt-1 text-xs text-muted-foreground">Supports CSV and JSON formats</p>
                      <Input type="file" className="hidden" accept=".csv,.json" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Import Cards</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <TabsContent value="cards" className="space-y-4">
            <div className="flex items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search cards..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Answer</TableHead>
                      <TableHead>Last Reviewed</TableHead>
                      <TableHead>Next Review</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCards.length > 0 ? (
                      filteredCards.map((card) => (
                        <TableRow key={card.id}>
                          <TableCell className="font-medium">{card.question}</TableCell>
                          <TableCell>{card.answer}</TableCell>
                          <TableCell>{new Date(card.lastReviewed).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(card.nextReview).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                card.difficulty === "Easy"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : card.difficulty === "Medium"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              }`}
                            >
                              {card.difficulty}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteCard(card.id)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No cards found. Try a different search term or add new cards.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                  <CardDescription>Overall mastery of this deck</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-3xl font-bold">65%</div>
                  <p className="text-xs text-muted-foreground">+5% improvement in the last 7 days</p>
                  <div className="mt-4 space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Mastered</span>
                        <span className="font-medium">32 cards</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-green-500 w-[32%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Learning</span>
                        <span className="font-medium">65 cards</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-yellow-500 w-[65%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Difficult</span>
                        <span className="font-medium">3 cards</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-red-500 w-[3%]" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Study Streak</CardTitle>
                  <CardDescription>Your consistent learning</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">7 days</div>
                  <p className="text-xs text-muted-foreground">Your longest streak was 14 days</p>
                  <div className="mt-4 grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-8 rounded-md ${
                          i < 5 ? "bg-primary/80" : "bg-primary"
                        } flex items-center justify-center text-xs font-medium text-primary-foreground`}
                      >
                        {["M", "T", "W", "T", "F", "S", "S"][i]}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Review Forecast</CardTitle>
                  <CardDescription>Upcoming card reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Today</p>
                        <p className="text-xs text-muted-foreground">May 17, 2023</p>
                      </div>
                      <div className="text-2xl font-bold">42</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Tomorrow</p>
                        <p className="text-xs text-muted-foreground">May 18, 2023</p>
                      </div>
                      <div className="text-2xl font-bold">28</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">This Week</p>
                        <p className="text-xs text-muted-foreground">Next 7 days</p>
                      </div>
                      <div className="text-2xl font-bold">103</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deck Settings</CardTitle>
                <CardDescription>Configure your flashcard deck</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deck-name">Deck Name</Label>
                  <Input id="deck-name" defaultValue={formatDeckName(params.deck)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deck-description">Description</Label>
                  <Textarea
                    id="deck-description"
                    defaultValue="Cardiopulmonary Resuscitation and Automated External Defibrillator training materials"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cards-per-session">Cards per study session</Label>
                  <select
                    id="cards-per-session"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="10">10 cards</option>
                    <option value="20" selected>
                      20 cards
                    </option>
                    <option value="30">30 cards</option>
                    <option value="50">50 cards</option>
                    <option value="0">All cards</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Generation</CardTitle>
                <CardDescription>Generate flashcards using AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-source">Source Material</Label>
                  <Textarea
                    id="ai-source"
                    placeholder="Paste text or provide a topic for AI to generate flashcards from"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-cards">Number of cards to generate</Label>
                  <select id="ai-cards" className="w-full rounded-md border border-input bg-background px-3 py-2">
                    <option value="5">5 cards</option>
                    <option value="10" selected>
                      10 cards
                    </option>
                    <option value="15">15 cards</option>
                    <option value="20">20 cards</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-difficulty">Difficulty level</Label>
                  <select id="ai-difficulty" className="w-full rounded-md border border-input bg-background px-3 py-2">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate" selected>
                      Intermediate
                    </option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleGenerateAI}>Generate Cards</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
