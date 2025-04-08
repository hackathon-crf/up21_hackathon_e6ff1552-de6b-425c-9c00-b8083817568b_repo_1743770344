"use client"

import { useState, useEffect } from "react"
import { Clock, Users } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"

export default function GameGamePage({ params }: { params: { id: string } }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  // Mock data for the game
  const game = {
    title: "CPR & AED Challenge",
    questions: [
      {
        question: "What is the correct compression rate for adult CPR?",
        options: [
          "60-80 compressions per minute",
          "100-120 compressions per minute",
          "140-160 compressions per minute",
          "As fast as possible",
        ],
        correctAnswer: 1,
      },
      {
        question: "How deep should chest compressions be for an adult?",
        options: [
          "1-2 inches (2.5-5 cm)",
          "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
          "3-4 inches (7.5-10 cm)",
          "As deep as possible",
        ],
        correctAnswer: 1,
      },
      {
        question: "When using an AED, what should you do before applying the pads?",
        options: [
          "Ensure the patient is wet",
          "Ensure the patient is breathing",
          "Ensure the patient's chest is dry and exposed",
          "Ensure the patient is conscious",
        ],
        correctAnswer: 2,
      },
    ],
  }

  const totalQuestions = game.questions.length
  const progress = ((currentQuestion + 1) / totalQuestions) * 100

  useEffect(() => {
    if (timeLeft > 0 && selectedAnswer === null) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && selectedAnswer === null) {
      // Time's up, auto-select wrong answer
      setSelectedAnswer(-1)

      // Move to next question after delay
      const timer = setTimeout(() => {
        handleNextQuestion()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, selectedAnswer])

  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(index)

      // Move to next question after delay
      setTimeout(() => {
        handleNextQuestion()
      }, 1500)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setTimeLeft(30)
    } else {
      // Game completed, navigate to results
      // In a real app, we would redirect to results page
      console.log("Game completed")
    }
  }

  const getButtonVariant = (index: number) => {
    if (selectedAnswer === null) return "outline"

    if (index === game.questions[currentQuestion].correctAnswer) {
      return "success"
    }

    if (selectedAnswer === index) {
      return "destructive"
    }

    return "outline"
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="p-3 sm:p-4 border-b bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-3xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0">{game.title}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm">5 participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm">{timeLeft}s</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Question {currentQuestion + 1} of {totalQuestions}
              </span>
              <span className="font-medium">{timeLeft} seconds left</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl">{game.questions[currentQuestion].question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {game.questions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant={getButtonVariant(index) as any}
                    className="w-full justify-start text-left h-auto py-3 sm:py-4 px-4 sm:px-6"
                    onClick={() => handleSelectAnswer(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-sm sm:text-base">{option}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">Select the correct answer</div>
              {selectedAnswer !== null && (
                <Button onClick={handleNextQuestion}>
                  {currentQuestion < totalQuestions - 1 ? "Next Question" : "Finish Game"}
                </Button>
              )}
            </CardFooter>
          </Card>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }).map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full ${
                  index < currentQuestion
                    ? "bg-primary"
                    : index === currentQuestion
                      ? "bg-primary animate-pulse"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
