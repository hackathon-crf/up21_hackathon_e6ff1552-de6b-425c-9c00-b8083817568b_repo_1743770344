import Link from "next/link"
import { BookOpen, Clock, Lightbulb, Plus, Search, Star, TrendingUp } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Progress } from "~/components/ui/progress"
import { Badge } from "~/components/ui/badge"

export default function FlashcardsPage() {
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
            />
          </div>
          <Button className="w-full sm:w-auto group relative overflow-hidden" size="lg">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary to-primary-foreground opacity-0 group-hover:opacity-20 transition-opacity" />
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
            Create New Deck
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-background/80 backdrop-blur-sm border w-full justify-start p-1 h-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">All Decks</TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Recently Studied</TabsTrigger>
            <TabsTrigger value="due" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Due Today</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30">
                <div className="absolute right-3 top-3">
                  <Badge variant="secondary" className="flex items-center gap-1 font-medium">
                    <TrendingUp className="h-3 w-3" />
                    65% Mastery
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center group-hover:text-primary transition-colors">
                    CPR & AED
                  </CardTitle>
                  <CardDescription>Cardiopulmonary Resuscitation and Automated External Defibrillator</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                          Total cards:
                        </span>
                        <span className="font-medium">156</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          Due today:
                        </span>
                        <span className="font-medium text-amber-500 dark:text-amber-400">42</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span>Mastery progress</span>
                        <span>65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 border-t bg-muted/30 px-6 py-4">
                  <Button variant="outline" size="sm" asChild className="transition-all hover:bg-background">
                    <Link href="/flashcards/manage/cpr-aed">Manage</Link>
                  </Button>
                  <Button size="sm" asChild className="bg-primary hover:bg-primary/90 transition-all">
                    <Link href="/flashcards/study/cpr-aed" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30">
                <div className="absolute right-3 top-3">
                  <Badge variant="secondary" className="flex items-center gap-1 font-medium">
                    <Star className="h-3 w-3 text-yellow-500" />
                    78% Mastery
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center group-hover:text-primary transition-colors">
                    First Aid Basics
                  </CardTitle>
                  <CardDescription>Wound care, bandaging, and basic first aid procedures</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                          Total cards:
                        </span>
                        <span className="font-medium">124</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          Due today:
                        </span>
                        <span className="font-medium text-amber-500 dark:text-amber-400">23</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span>Mastery progress</span>
                        <span>78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 border-t bg-muted/30 px-6 py-4">
                  <Button variant="outline" size="sm" asChild className="transition-all hover:bg-background">
                    <Link href="/flashcards/manage/first-aid">Manage</Link>
                  </Button>
                  <Button size="sm" asChild className="bg-primary hover:bg-primary/90 transition-all">
                    <Link href="/flashcards/study/first-aid" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30">
                <div className="absolute right-3 top-3">
                  <Badge variant="secondary" className="flex items-center gap-1 font-medium">
                    <Lightbulb className="h-3 w-3 text-orange-500" />
                    42% Mastery
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center group-hover:text-primary transition-colors">
                    Emergency Response
                  </CardTitle>
                  <CardDescription>Scene assessment, triage, and emergency protocols</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                          Total cards:
                        </span>
                        <span className="font-medium">98</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          Due today:
                        </span>
                        <span className="font-medium text-amber-500 dark:text-amber-400">36</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span>Mastery progress</span>
                        <span>42%</span>
                      </div>
                      <Progress value={42} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 border-t bg-muted/30 px-6 py-4">
                  <Button variant="outline" size="sm" asChild className="transition-all hover:bg-background">
                    <Link href="/flashcards/manage/emergency">Manage</Link>
                  </Button>
                  <Button size="sm" asChild className="bg-primary hover:bg-primary/90 transition-all">
                    <Link href="/flashcards/study/emergency" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30">
                <div className="absolute right-3 top-3">
                  <Badge className="bg-green-500/20 text-green-700 dark:bg-green-700/20 dark:text-green-400 hover:bg-green-500/30 flex items-center gap-1 font-medium">
                    Last studied today
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="group-hover:text-primary transition-colors">First Aid Basics</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Today at 10:24 AM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                          Cards reviewed:
                        </span>
                        <span className="font-medium">32</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <Star className="h-3.5 w-3.5" />
                          Accuracy:
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">85%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span>Session progress</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 px-6 py-4">
                  <Button className="w-full bg-primary hover:bg-primary/90 transition-all" asChild>
                    <Link href="/flashcards/study/first-aid" className="flex items-center justify-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Continue Studying
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30">
                <div className="absolute right-3 top-3">
                  <Badge variant="outline" className="flex items-center gap-1 font-medium">
                    Last studied yesterday
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="group-hover:text-primary transition-colors">Emergency Response</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Yesterday at 3:45 PM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                          Cards reviewed:
                        </span>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                          <Star className="h-3.5 w-3.5" />
                          Accuracy:
                        </span>
                        <span className="font-medium text-amber-500 dark:text-amber-400">72%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span>Session progress</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 px-6 py-4">
                  <Button className="w-full bg-primary hover:bg-primary/90 transition-all" asChild>
                    <Link href="/flashcards/study/emergency" className="flex items-center justify-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Continue Studying
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="due" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 border-l-4 border-l-amber-400">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="group-hover:text-primary transition-colors">CPR & AED</CardTitle>
                    <Badge className="bg-amber-500/20 text-amber-700 dark:bg-amber-700/20 dark:text-amber-400">
                      42 cards due
                    </Badge>
                  </div>
                  <CardDescription>Prioritize this deck for most effective learning</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary/80" />
                          Estimated time:
                        </span>
                        <span className="font-medium">25 minutes</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                          Difficulty:
                        </span>
                        <span className="font-medium text-amber-500">Medium</span>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>These cards need to be reviewed today for optimal retention</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 px-6 py-4">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white transition-all" asChild>
                    <Link href="/flashcards/study/cpr-aed" className="flex items-center justify-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 border-l-4 border-l-red-400">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="group-hover:text-primary transition-colors">Emergency Response</CardTitle>
                    <Badge className="bg-red-500/20 text-red-700 dark:bg-red-700/20 dark:text-red-400">
                      36 cards due
                    </Badge>
                  </div>
                  <CardDescription>High priority deck with challenging content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary/80" />
                          Estimated time:
                        </span>
                        <span className="font-medium">20 minutes</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-red-500" />
                          Difficulty:
                        </span>
                        <span className="font-medium text-red-500">Hard</span>
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md text-xs text-red-800 dark:text-red-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>These cards need additional attention based on your past performance</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 px-6 py-4">
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white transition-all" asChild>
                    <Link href="/flashcards/study/emergency" className="flex items-center justify-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden group border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 border-l-4 border-l-green-400">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="group-hover:text-primary transition-colors">First Aid Basics</CardTitle>
                    <Badge className="bg-green-500/20 text-green-700 dark:bg-green-700/20 dark:text-green-400">
                      23 cards due
                    </Badge>
                  </div>
                  <CardDescription>Quick review of well-practiced material</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary/80" />
                          Estimated time:
                        </span>
                        <span className="font-medium">15 minutes</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-green-500" />
                          Difficulty:
                        </span>
                        <span className="font-medium text-green-500">Easy</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md text-xs text-green-800 dark:text-green-300 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>You're making great progress with these cards!</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 px-6 py-4">
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white transition-all" asChild>
                    <Link href="/flashcards/study/first-aid" className="flex items-center justify-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study Now
                    </Link>
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
