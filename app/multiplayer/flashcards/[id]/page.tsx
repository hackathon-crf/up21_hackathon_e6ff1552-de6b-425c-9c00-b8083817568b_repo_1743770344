"use client"

import { useState, useEffect } from "react"
import { Clock, ThumbsDown, ThumbsUp, Users } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Input } from "~/components/ui/input"

export default function FlashcardsRumblePage({ params }: { params: { id: string } }) {
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [answer, setAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)

  // Mock data for the flashcards
  const flashcards = [
    {
      question: "What is the correct compression rate for adult CPR?",
      answer: "100-120 compressions per minute",
    },
    {
      question: "How deep should chest compressions be for an adult?",
      answer: "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
    },
    {
      question: "What is the first step in treating a severe bleeding wound?",
      answer: "Apply direct pressure to the wound with a clean cloth or bandage",
    },
    {
      question: "What are the signs of shock?",
      answer: "Pale, cold, clammy skin; rapid, weak pulse; rapid breathing; nausea; and altered mental status",
    },
    {
      question: "What is the recovery position and when should it be used?",
      answer:
        "A stable position where the patient lies on their side with the lower arm forward and head tilted back. Used for unconscious patients who are breathing normally and have no suspected spinal injuries.",
    },
  ]

  const totalCards = flashcards.length
  const progress = ((currentCard + 1) / totalCards) * 100

  useEffect(() => {
    if (timeLeft > 0 && result === null) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && result === null) {
      // Time's up, mark as incorrect
      setResult("incorrect")

      // Move to next card after delay
      const timer = setTimeout(() => {
        handleNextCard()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, result])

  const handleFlip = () => {
    if (!flipped && result === null) {
      setFlipped(true)
    }
  }

  const handleSubmitAnswer = () => {
    if (answer.trim() && result === null) {
      // Simple string comparison - in a real app, you'd want more sophisticated matching
      const isCorrect = answer.toLowerCase().includes(flashcards[currentCard].answer.toLowerCase().substring(0, 10))

      setResult(isCorrect ? "correct" : "incorrect")

      // Calculate score based on correctness and time left
      if (isCorrect) {
        // Correct answer: base points + time bonus
        const basePoints = 500
        const timeBonus = timeLeft * 5
        const cardScore = basePoints + timeBonus
        setScore(score + cardScore)
      }

      // Flip card to show answer
      setFlipped(true)

      // Move to next card after delay
      setTimeout(() => {
        handleNextCard()
      }, 2000)
    }
  }

  const handleNextCard = () => {
    if (currentCard < totalCards - 1) {
      setCurrentCard(currentCard + 1)
      setFlipped(false)
      setAnswer("")
      setResult(null)
      setTimeLeft(60)
    } else {
      // Game completed, navigate to results
      // In a real app, we would redirect to results page
      console.log("Flashcards Rumble completed")
    }
  }

  // Mock leaderboard data
  const leaderboard = [
    { name: "John Doe", score: score, rank: 1 },
    { name: "Sarah Johnson", score: score - 150, rank: 2 },
    { name: "Michael Smith", score: score - 300, rank: 3 },
    { name: "Emily Davis", score: score - 450, rank: 4 },
    { name: "Robert Wilson", score: score - 600, rank: 5 },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <h1 className="text-xl font-bold">Flashcards Rumble: First Aid Basics</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">5 participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{timeLeft}s</span>
            </div>
            <div className="font-bold">Score: {score}</div>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Flashcard {currentCard + 1} of {totalCards}
              </span>
              <span className="font-medium">{timeLeft} seconds left</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card
            className={`w-full h-64 cursor-pointer transition-all duration-500 ${flipped ? "bg-primary/5" : ""}`}
            onClick={handleFlip}
          >
            <div className="relative w-full h-full">
              <div
                className={`absolute inset-0 w-full h-full flex flex-col justify-center transition-all duration-500 ${
                  flipped ? "opacity-0 rotate-y-180" : "opacity-100"
                }`}
              >
                <CardHeader>
                  <div className="text-sm text-muted-foreground">Question</div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium text-center">{flashcards[currentCard].question}</div>
                </CardContent>
                <CardFooter className="text-center text-sm text-muted-foreground">
                  Click to reveal answer or type your answer below
                </CardFooter>
              </div>

              <div
                className={`absolute inset-0 w-full h-full flex flex-col justify-center transition-all duration-500 ${
                  flipped ? "opacity-100" : "opacity-0 rotate-y-180"
                }`}
              >
                <CardHeader>
                  <div className="text-sm text-muted-foreground">Answer</div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium text-center">{flashcards[currentCard].answer}</div>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                  {result === "correct" ? (
                    <div className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5" />
                      Correct! +{500 + timeLeft * 5} points
                    </div>
                  ) : result === "incorrect" ? (
                    <div className="text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                      <ThumbsDown className="h-5 w-5" />
                      Incorrect
                    </div>
                  ) : null}
                </CardFooter>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Input
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmitAnswer()
                }
              }}
              disabled={flipped || result !== null}
              className="flex-1"
            />
            <Button onClick={handleSubmitAnswer} disabled={!answer.trim() || flipped || result !== null}>
              Submit
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                        {player.rank}
                      </div>
                      <span>{player.name}</span>
                    </div>
                    <span className="font-bold">{player.score}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
