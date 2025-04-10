"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Clock, Lightbulb, Plus, Search, Star, TrendingUp, Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Progress } from "~/components/ui/progress"
import { Badge } from "~/components/ui/badge"
import { api } from "~/trpc/react"
import { formatDistanceToNow } from "date-fns"

export default function FlashcardsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch decks from the API
  const { data: decks, isLoading } = api.flashcard.getDecks.useQuery();
  const { data: dueCards } = api.flashcard.getDueCards.useQuery({ limit: 100 });
  
  // Filter decks based on search query
  const filteredDecks = decks?.filter(deck => 
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate mastery percentage for a deck (this could be enhanced with real calculation logic)
  const calculateMastery = (deck: typeof decks[0]) => {
    // This is a placeholder - in a real app, you might calculate this based on SRS data
    return Math.floor(Math.random() * 100); // Placeholder random value
  };

  // Calculate due cards for each deck
  const getDueCardsForDeck = (deckId: string) => {
    if (!dueCards) return 0;
    return dueCards.filter(card => card.deckId === deckId).length;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b">
        <div className="container py-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Flashcards</h1>
          <p className="text-muted-foreground max-w-2xl">
            Create, manage, and study your first aid flashcard decks to improve your emergency response skills
          </p>
        </div>
      </div>

      <main className="container py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search decks..." 
              className="w-full pl-9 transition-all focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="w-full sm:w-auto group relative overflow-hidden" size="lg" asChild>
            <Link href="/flashcards/create">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary to-primary-foreground opacity-0 group-hover:opacity-20 transition-opacity" />
              <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
              Create New Flashcard
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-background/80 backdrop-blur-sm border w-full justify-start p-1 h-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">All Decks</TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Recently Studied</TabsTrigger>
            <TabsTrigger value="due" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Due Today</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : filteredDecks && filteredDecks.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredDecks.map((deck) => {
                  const mastery = calculateMastery(deck);
                  const dueCardsCount = getDueCardsForDeck(deck.id);
                  
                  return (
                    <Card key={deck.id} className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30">
                      <div className="absolute right-3 top-3">
                        <Badge variant="secondary" className="flex items-center gap-1 font-medium">
                          <TrendingUp className="h-3 w-3" />
                          {mastery}% Mastery
                        </Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center group-hover:text-primary transition-colors">
                          {deck.name}
                        </CardTitle>
                        <CardDescription>{deck.description || "No description provided"}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground">
                            <div className="flex justify-between items-center py-1">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                                Total cards:
                              </span>
                              <span className="font-medium">{deck.cardCount}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                                <Clock className="h-3.5 w-3.5" />
                                Due today:
                              </span>
                              <span className="font-medium text-amber-500 dark:text-amber-400">{dueCardsCount}</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span>Mastery progress</span>
                              <span>{mastery}%</span>
                            </div>
                            <Progress value={mastery} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between gap-2 border-t bg-muted/30 px-6 py-4">
                        <Button variant="outline" size="sm" asChild className="transition-all hover:bg-background">
                          <Link href={`/flashcards/manage/${deck.id}`}>Manage</Link>
                        </Button>
                        <Button size="sm" asChild className="bg-primary hover:bg-primary/90 transition-all">
                          <Link href={`/flashcards/study/${deck.id}`} className="flex items-center">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Study Now
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-lg">
                  {searchQuery 
                    ? "No decks match your search query" 
                    : "You don't have any flashcard decks yet"}
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/flashcards/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Deck
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : filteredDecks && filteredDecks.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredDecks
                  .filter(deck => deck.updatedAt && new Date(deck.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) // Most recently updated first
                  .map((deck) => (
                    <Card key={deck.id} className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30">
                      <div className="absolute right-3 top-3">
                        <Badge className="bg-green-500/20 text-green-700 dark:bg-green-700/20 dark:text-green-400 hover:bg-green-500/30 flex items-center gap-1 font-medium">
                          {deck.updatedAt ? `Last studied ${formatDistanceToNow(new Date(deck.updatedAt), { addSuffix: true })}` : 'Recently studied'}
                        </Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="group-hover:text-primary transition-colors">{deck.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {deck.updatedAt ? formatDistanceToNow(new Date(deck.updatedAt), { addSuffix: true }) : 'Recently'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground">
                            <div className="flex justify-between items-center py-1">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                                Cards in deck:
                              </span>
                              <span className="font-medium">{deck.cardCount}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                <Star className="h-3.5 w-3.5" />
                                Due cards:
                              </span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {getDueCardsForDeck(deck.id)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/30 px-6 py-4">
                        <Button className="w-full bg-primary hover:bg-primary/90 transition-all" asChild>
                          <Link href={`/flashcards/study/${deck.id}`} className="flex items-center justify-center">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Continue Studying
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-lg">No recently studied decks found</p>
                <Button className="mt-4" asChild>
                  <Link href="/flashcards/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create a New Deck
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="due" className="space-y-6">
            {isLoading || !dueCards ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : (
              <>
                {filteredDecks && dueCards && dueCards.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {/* Group cards by deck and show decks with due cards */}
                    {filteredDecks
                      .filter(deck => getDueCardsForDeck(deck.id) > 0)
                      .sort((a, b) => getDueCardsForDeck(b.id) - getDueCardsForDeck(a.id))
                      .map((deck) => {
                        const dueCount = getDueCardsForDeck(deck.id);
                        const difficulty = dueCount > 30 ? 'Hard' : dueCount > 15 ? 'Medium' : 'Easy';
                        const colorClass = dueCount > 30 ? 'border-l-red-400' : dueCount > 15 ? 'border-l-amber-400' : 'border-l-green-400';
                        const buttonClass = dueCount > 30 ? 'bg-red-500 hover:bg-red-600' : dueCount > 15 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600';
                        const badgeClass = dueCount > 30 ? 'bg-red-500/20 text-red-700 dark:bg-red-700/20 dark:text-red-400' : 
                                        dueCount > 15 ? 'bg-amber-500/20 text-amber-700 dark:bg-amber-700/20 dark:text-amber-400' : 
                                        'bg-green-500/20 text-green-700 dark:bg-green-700/20 dark:text-green-400';
                        const iconColor = dueCount > 30 ? 'text-red-500' : dueCount > 15 ? 'text-amber-500' : 'text-green-500';
                        const bgColor = dueCount > 30 ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300' : 
                                    dueCount > 15 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300' : 
                                    'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300';
                        
                        return (
                          <Card key={deck.id} className={`overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 border-l-4 ${colorClass}`}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <CardTitle className="group-hover:text-primary transition-colors">{deck.name}</CardTitle>
                                <Badge className={badgeClass}>
                                  {dueCount} cards due
                                </Badge>
                              </div>
                              <CardDescription>{deck.description || "No description provided"}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                  <div className="flex justify-between items-center py-1">
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5 text-primary/80" />
                                      Estimated time:
                                    </span>
                                    <span className="font-medium">{Math.ceil(dueCount * 0.5)} minutes</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1">
                                    <span className="flex items-center gap-1.5">
                                      <Lightbulb className={`h-3.5 w-3.5 ${iconColor}`} />
                                      Difficulty:
                                    </span>
                                    <span className={`font-medium ${iconColor}`}>{difficulty}</span>
                                  </div>
                                </div>
                                <div className={`p-3 ${bgColor} rounded-md text-xs flex items-center gap-1.5`}>
                                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span>
                                    {dueCount > 30 ? 'These cards need additional attention based on your past performance' : 
                                     dueCount > 15 ? 'These cards need to be reviewed today for optimal retention' : 
                                     'Quick review of well-practiced material'}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/30 px-6 py-4">
                              <Button className={`w-full ${buttonClass} text-white transition-all`} asChild>
                                <Link href={`/flashcards/study/${deck.id}`} className="flex items-center justify-center">
                                  <BookOpen className="mr-2 h-4 w-4" />
                                  Study Now
                                </Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground text-lg">No cards due for review today!</p>
                    <Button className="mt-4" asChild>
                      <Link href="/flashcards/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Flashcards
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
