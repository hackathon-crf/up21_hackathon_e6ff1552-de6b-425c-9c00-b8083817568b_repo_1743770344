"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"

export default function StudyDeckPage({ params }: { params: { deck: string } }) {
  const [flipped, setFlipped] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)

  // Update the card interface to include titles
  const cards = {
    "cpr-aed": [
      {
        title: "CPR Compression Rate",
        question: "What is the correct compression rate for adult CPR?",
        answer: "100-120 compressions per minute",
      },
      {
        title: "Compression Depth",
        question: "How deep should chest compressions be for an adult?",
        answer: "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
      },
      {
        title: "Hand Placement",
        question: "What is the correct hand placement for adult CPR?",
        answer:
          "Place the heel of one hand on the center of the chest (sternum), then place the other hand on top and interlock fingers",
      },
    ],
    "first-aid": [
      {
        title: "Severe Bleeding",
        question: "What is the first step in treating a severe bleeding wound?",
        answer: "Apply direct pressure to the wound with a clean cloth or bandage",
      },
      {
        title: "Shock Symptoms",
        question: "What are the signs of shock?",
        answer: "Pale, cold, clammy skin; rapid, weak pulse; rapid breathing; nausea; and altered mental status",
      },
      {
        title: "Burn Treatment",
        question: "How should you treat a minor burn?",
        answer:
          "Cool the burn with cool (not cold) running water for 10-15 minutes, then cover with a clean, dry bandage",
      },
    ],
    emergency: [
      {
        title: "SAMPLE Assessment",
        question: "What does the acronym SAMPLE stand for in patient assessment?",
        answer:
          "Signs/Symptoms, Allergies, Medications, Past medical history, Last oral intake, Events leading to injury/illness",
      },
      {
        title: "Primary Assessment",
        question: "What is the correct sequence for the primary assessment?",
        answer: "Check for responsiveness, call for help, check breathing and pulse, check for severe bleeding",
      },
      {
        title: "Recovery Position",
        question: "What is the recovery position and when should it be used?",
        answer:
          "A stable position where the patient lies on their side with the lower arm forward and head tilted back. Used for unconscious patients who are breathing normally and have no suspected spinal injuries.",
      },
    ],
  }

  // Get the correct deck based on the URL parameter
  const deckName = params.deck as keyof typeof cards
  const currentDeck = cards[deckName] || cards["first-aid"] // Default to first-aid if deck not found

  const totalCards = currentDeck.length
  const progress = ((currentCard + 1) / totalCards) * 100

  const handleFlip = () => {
    setFlipped(!flipped)
  }

  const handleNext = () => {
    if (currentCard < totalCards - 1) {
      setCurrentCard(currentCard + 1)
      setFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setFlipped(false)
    }
  }

  // Format the deck name for display
  const formatDeckName = (name: string) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" & ")
  }

  // Replace the return statement with the enhanced flashcard design
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="border-b shadow-sm">
        <div className="flex h-16 items-center px-6">
          <Button variant="ghost" size="icon" asChild className="hover:bg-secondary/80">
            <Link href="/flashcards">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to decks</span>
            </Link>
          </Button>

          <div className="ml-4 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{formatDeckName(params.deck)}</h1>
            <p className="text-sm text-muted-foreground">
              Studying {currentCard + 1} of {totalCards} cards
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-secondary" />
          </div>

          <div className={`perspective-1000 w-full transition-all duration-300 ${flipped ? "scale-[1.02]" : ""}`}>
            <Card
              className={`
                w-full min-h-[300px] sm:min-h-[350px] md:min-h-[400px] 
                cursor-pointer transition-all duration-500 transform-style-3d relative
                hover:shadow-lg border-2 ${flipped ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20"}
              `}
              onClick={handleFlip}
            >
              {/* Front of card (Question) */}
              <div
                className={`absolute inset-0 w-full h-full flex flex-col backface-hidden transition-all duration-500 ${
                  flipped ? "rotate-y-180 opacity-0" : "rotate-y-0 opacity-100"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-muted-foreground">Question</div>
                    <div className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                      Card {currentCard + 1}/{totalCards}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-primary mt-2">{currentDeck[currentCard].title}</div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-6">
                  <div className="text-lg sm:text-xl font-medium text-center">{currentDeck[currentCard].question}</div>
                </CardContent>
                <CardFooter className="flex justify-center pb-6">
                  <Button
                    variant="outline"
                    className="group relative overflow-hidden border-primary/30 text-primary hover:text-primary-foreground"
                  >
                    <span className="relative z-10">Reveal Answer</span>
                    <span className="absolute inset-0 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  </Button>
                </CardFooter>
              </div>

              {/* Back of card (Answer) */}
              <div
                className={`absolute inset-0 w-full h-full flex flex-col backface-hidden transition-all duration-500 ${
                  flipped ? "rotate-y-0 opacity-100" : "rotate-y-180 opacity-0"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-primary">Answer</div>
                    <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      Card {currentCard + 1}/{totalCards}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-primary mt-2">{currentDeck[currentCard].title}</div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-6">
                  <div className="text-lg sm:text-xl font-medium text-center">{currentDeck[currentCard].answer}</div>
                </CardContent>
                <CardFooter className="flex justify-center gap-4 pb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Hard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 border-green-300 text-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Easy
                  </Button>
                </CardFooter>
              </div>
            </Card>
          </div>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentCard === 0}
              className="w-1/3 sm:w-auto transition-all duration-200 hover:translate-x-[-2px]"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentCard === totalCards - 1}
              className="w-1/3 sm:w-auto transition-all duration-200 hover:translate-x-[2px]"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
