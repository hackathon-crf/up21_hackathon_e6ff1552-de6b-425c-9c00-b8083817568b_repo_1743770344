import Link from "next/link"
import { BookOpen, Plus, Search } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { DashboardHeader } from "~/components/dashboard-header"

export default function FlashcardsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Flashcards" description="Create, manage, and study your first aid flashcard decks" />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search decks..." className="w-full pl-8" />
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Deck
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Decks</TabsTrigger>
            <TabsTrigger value="recent">Recently Studied</TabsTrigger>
            <TabsTrigger value="due">Due Today</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>CPR & AED</CardTitle>
                  <CardDescription>Cardiopulmonary Resuscitation and Automated External Defibrillator</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Total cards:</span>
                      <span className="font-medium">156</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Due today:</span>
                      <span className="font-medium">42</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Mastery level:</span>
                      <span className="font-medium">65%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/flashcards/manage/cpr-aed">Manage</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/flashcards/study/cpr-aed">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>First Aid Basics</CardTitle>
                  <CardDescription>Wound care, bandaging, and basic first aid procedures</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Total cards:</span>
                      <span className="font-medium">124</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Due today:</span>
                      <span className="font-medium">23</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Mastery level:</span>
                      <span className="font-medium">78%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/flashcards/manage/first-aid">Manage</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/flashcards/study/first-aid">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Emergency Response</CardTitle>
                  <CardDescription>Scene assessment, triage, and emergency protocols</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Total cards:</span>
                      <span className="font-medium">98</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Due today:</span>
                      <span className="font-medium">36</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Mastery level:</span>
                      <span className="font-medium">42%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/flashcards/manage/emergency">Manage</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/flashcards/study/emergency">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>First Aid Basics</CardTitle>
                  <CardDescription>Last studied: Today at 10:24 AM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Cards reviewed:</span>
                      <span className="font-medium">32</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Accuracy:</span>
                      <span className="font-medium">85%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/flashcards/study/first-aid">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Continue Studying
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Emergency Response</CardTitle>
                  <CardDescription>Last studied: Yesterday at 3:45 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Cards reviewed:</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Accuracy:</span>
                      <span className="font-medium">72%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/flashcards/study/emergency">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Continue Studying
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="due" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>CPR & AED</CardTitle>
                  <CardDescription>42 cards due today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Estimated time:</span>
                      <span className="font-medium">25 minutes</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Difficulty:</span>
                      <span className="font-medium">Medium</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/flashcards/study/cpr-aed">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Emergency Response</CardTitle>
                  <CardDescription>36 cards due today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Estimated time:</span>
                      <span className="font-medium">20 minutes</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Difficulty:</span>
                      <span className="font-medium">Hard</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/flashcards/study/emergency">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>First Aid Basics</CardTitle>
                  <CardDescription>23 cards due today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Estimated time:</span>
                      <span className="font-medium">15 minutes</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Difficulty:</span>
                      <span className="font-medium">Easy</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/flashcards/study/first-aid">
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
