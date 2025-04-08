"use client"

import { useState, useEffect } from "react"
import { Clock, Users } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"

export default function KahootGamePage({ params }: { params: { id: string } }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)

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

      // Calculate score based on correctness and time left
      if (index === game.questions[currentQuestion].correctAnswer) {
        // Correct answer: base points + time bonus
        const basePoints = 1000
        const timeBonus = timeLeft * 10
        const questionScore = basePoints + timeBonus
        setScore(score + questionScore)
      }

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
          <h1 className="text-xl font-bold">{game.title}</h1>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {game.questions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant={getButtonVariant(index) as any}
                    className="h-auto py-6 px-6 text-lg"
                    onClick={() => handleSelectAnswer(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          index === 0
                            ? "bg-red-500"
                            : index === 1
                              ? "bg-blue-500"
                              : index === 2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                        } text-white`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{option}</span>
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

          {selectedAnswer !== null && (
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
          )}
        </div>
      </main>
    </div>
  )
}
