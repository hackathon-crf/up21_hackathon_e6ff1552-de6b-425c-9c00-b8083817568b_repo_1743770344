"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Clock, Trophy, User, Users, XCircle } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { useToast } from "~/hooks/use-toast"
import { ConnectionStatus } from "../../components/connection-status"
import { PlayerAvatar } from "../../components/player-avatar"
import { GameChat } from "../../components/game-chat"
import { cn } from "~/lib/utils"

// Define types for better type safety
interface Player {
  id: number
  name: string
  avatar: string
  score: number
  rank: number
  streak: number
  isCurrentUser: boolean
  status?: "idle" | "typing" | "answered" | "thinking" | "away"
}

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  category: string
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number
  explanation?: string
}

export default function RapidResponsePage({ params }: { params: { id: string } }) {
  return (
    <RapidResponseContent params={params} />
  )
}

function RapidResponseContent({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState<"correct" | "incorrect" | "timeout" | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [chatCollapsed, setChatCollapsed] = useState(true)
  const [countdownValue, setCountdownValue] = useState(3)
  const [showCountdown, setShowCountdown] = useState(true)
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([])

  // Start countdown before game begins
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setShowCountdown(false)
          setGameStarted(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [])

  // Mock data for the challenge
  const challenge = {
    id: params.id,
    title: "CPR & AED Challenge",
    totalQuestions: 5,
    category: "Emergency Response",
    difficulty: "Intermediate",
    questions: [
      {
        id: 1,
        question: "What is the correct compression rate for adult CPR?",
        options: [
          "60-80 compressions per minute",
          "100-120 compressions per minute",
          "140-160 compressions per minute",
          "As fast as possible",
        ],
        correctAnswer: 1,
        category: "CPR Technique",
        difficulty: "medium",
        timeLimit: 30,
        explanation:
          "The American Heart Association recommends a compression rate of 100-120 compressions per minute for adult CPR to ensure adequate blood circulation.",
      },
      {
        id: 2,
        question: "How deep should chest compressions be for an adult?",
        options: [
          "1-2 inches (2.5-5 cm)",
          "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
          "3-4 inches (7.5-10 cm)",
          "As deep as possible",
        ],
        correctAnswer: 1,
        category: "CPR Technique",
        difficulty: "medium",
        timeLimit: 30,
        explanation:
          "Proper compression depth is at least 2 inches (5 cm) but not more than 2.4 inches (6 cm) for adults. This ensures adequate blood circulation without causing injury.",
      },
      {
        id: 3,
        question: "When using an AED, what should you do before applying the pads?",
        options: [
          "Ensure the patient is wet",
          "Ensure the patient is breathing",
          "Ensure the patient's chest is dry and exposed",
          "Ensure the patient is conscious",
        ],
        correctAnswer: 2,
        category: "AED Usage",
        difficulty: "hard",
        timeLimit: 30,
        explanation:
          "Before applying AED pads, ensure the patient's chest is dry and exposed. Moisture can interfere with the electrical current and clothing can prevent proper pad contact.",
      },
      {
        id: 4,
        question: "What is the proper hand placement for adult CPR?",
        options: [
          "Two hands on the lower half of the sternum",
          "Two hands on the upper half of the sternum",
          "One hand in the center of the chest",
          "Two hands, one on top of the other, on the center of the chest",
        ],
        correctAnswer: 3,
        category: "CPR Technique",
        difficulty: "easy",
        timeLimit: 30,
        explanation:
          "Proper hand placement for adult CPR is two hands, one on top of the other, on the center of the chest (middle of the sternum). This position allows for the most effective compressions.",
      },
      {
        id: 5,
        question: "What is the recommended ratio of compressions to breaths in adult CPR?",
        options: ["15:2", "30:2", "15:1", "30:1"],
        correctAnswer: 1,
        category: "CPR Technique",
        difficulty: "medium",
        timeLimit: 30,
        explanation:
          "The recommended ratio is 30 compressions followed by 2 rescue breaths for adult CPR. This ratio maximizes blood circulation while providing necessary ventilation.",
      },
    ],
  }

  // Mock players data
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      name: "You",
      avatar: "/avatar.svg?height=40&width=40",
      score: 0,
      rank: 1,
      streak: 0,
      isCurrentUser: true,
      status: "idle",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      avatar: "/avatar.svg?height=40&width=40",
      score: 0,
      rank: 2,
      streak: 0,
      isCurrentUser: false,
      status: "idle",
    },
    {
      id: 3,
      name: "Michael Smith",
      avatar: "/avatar.svg?height=40&width=40",
      score: 0,
      rank: 3,
      streak: 0,
      isCurrentUser: false,
      status: "idle",
    },
    {
      id: 4,
      name: "Emily Davis",
      avatar: "/avatar.svg?height=40&width=40",
      score: 0,
      rank: 4,
      streak: 0,
      isCurrentUser: false,
      status: "idle",
    },
    {
      id: 5,
      name: "Robert Wilson",
      avatar: "/avatar.svg?height=40&width=40",
      score: 0,
      rank: 5,
      streak: 0,
      isCurrentUser: false,
      status: "idle",
    },
  ])

  const totalQuestions = challenge.questions.length
  const currentQuestionData = challenge.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / totalQuestions) * 100

  // Show welcome notification when game starts
  useEffect(() => {
    if (gameStarted && currentQuestion === 0) {
      toast({
        title: "Game started!",
        description: "Answer quickly for bonus points. Consecutive correct answers build your streak!",
        duration: 5000,
      })
    }
  }, [gameStarted, currentQuestion, toast])

  // Update player scores randomly to simulate real-time competition
  useEffect(() => {
    if (!gameStarted || gameEnded) return

    const interval = setInterval(() => {
      setPlayers((prevPlayers) => {
        return prevPlayers
          .map((player) => {
            if (!player.isCurrentUser && Math.random() > 0.7) {
              // Randomly increase other players' scores
              const pointsToAdd = Math.floor(Math.random() * 300) + 100
              return {
                ...player,
                score: player.score + pointsToAdd,
                streak: Math.random() > 0.8 ? player.streak + 1 : player.streak,
                status: Math.random() > 0.7 ? "thinking" : player.status,
              }
            }
            return player
          })
          .sort((a, b) => b.score - a.score)
          .map((player, index) => ({
            ...player,
            rank: index + 1,
          }))
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [gameStarted, gameEnded])

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameEnded || showFeedback || showCountdown) return

    if (timeLeft > 0 && selectedAnswer === null) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && selectedAnswer === null) {
      // Time's up
      setFeedbackType("timeout")
      setShowFeedback(true)
      setStreak(0) // Reset streak on timeout

      toast({
        title: "Time's up!",
        description: `The correct answer was: ${currentQuestionData.options[currentQuestionData.correctAnswer]}`,
        duration: 3000,
      })

      // Update other players
      simulateOtherPlayersAnswers()

      // Move to next question after delay
      const timer = setTimeout(() => {
        handleNextQuestion()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, selectedAnswer, gameStarted, gameEnded, showFeedback, showCountdown, currentQuestionData, toast])

  // Simulate other players answering
  const simulateOtherPlayersAnswers = useCallback(() => {
    setPlayers((prevPlayers) => {
      return prevPlayers
        .map((player) => {
          if (!player.isCurrentUser) {
            // 70% chance of getting it right for AI players
            const gotItRight = Math.random() > 0.3
            const basePoints = gotItRight ? 1000 : 0
            const timeBonus = Math.floor(Math.random() * 200)
            const streakBonus = player.streak > 0 ? player.streak * 100 : 0
            const pointsToAdd = basePoints + timeBonus + streakBonus

            return {
              ...player,
              score: player.score + pointsToAdd,
              streak: gotItRight ? player.streak + 1 : 0,
              status: "answered",
            }
          }
          return player
        })
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
          ...player,
          rank: index + 1,
        }))
    })
  }, [])

  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null || showFeedback) return

    setSelectedAnswer(index)

    // Update player status
    setPlayers((prevPlayers) => {
      return prevPlayers.map((player) => {
        if (player.isCurrentUser) {
          return {
            ...player,
            status: "answered",
          }
        }
        return player
      })
    })

    // Check if answer is correct
    const isCorrect = index === currentQuestionData.correctAnswer

    // Set feedback type
    setFeedbackType(isCorrect ? "correct" : "incorrect")
    setShowFeedback(true)

    // Show notification
    if (isCorrect) {
      toast({
        title: "Correct answer!",
        description: currentQuestionData.explanation,
        duration: 4000,
      })
    } else {
      toast({
        title: "Incorrect answer",
        description: `The correct answer was: ${currentQuestionData.options[currentQuestionData.correctAnswer]}. ${currentQuestionData.explanation}`,
        duration: 4000,
      })
    }

    // Update streak
    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)

      if (newStreak > 1) {
        toast({
          title: `${newStreak}x Streak!`,
          description: "Keep it up for bonus points!",
          duration: 2000,
        })
      }
    } else {
      setStreak(0)
    }

    // Calculate score based on correctness, time left, and streak
    if (isCorrect) {
      // Correct answer: base points + time bonus + streak bonus
      const basePoints = 1000
      const timeBonus = timeLeft * 10
      const streakBonus = streak * 100
      const questionScore = basePoints + timeBonus + streakBonus

      setPointsEarned(questionScore)
      setScore((prev) => prev + questionScore)

      // Update player score
      setPlayers((prevPlayers) => {
        const updatedPlayers = prevPlayers
          .map((player) => {
            if (player.isCurrentUser) {
              return {
                ...player,
                score: player.score + questionScore,
                streak: player.streak + 1,
              }
            }
            return player
          })
          .sort((a, b) => b.score - a.score)
          .map((player, index) => ({
            ...player,
            rank: index + 1,
          }))
        return updatedPlayers
      })
    } else {
      setPointsEarned(0)
    }

    // Simulate other players answering
    simulateOtherPlayersAnswers()

    // Show leaderboard after feedback
    setTimeout(() => {
      setShowLeaderboard(true)
    }, 2000)

    // Move to next question after delay
    setTimeout(() => {
      handleNextQuestion()
    }, 5000)
  }

  const handleNextQuestion = useCallback(() => {
    setShowFeedback(false)
    setShowLeaderboard(false)
    setSelectedAnswer(null)
    setPointsEarned(0)

    // Reset player statuses
    setPlayers((prevPlayers) => {
      return prevPlayers.map((player) => ({
        ...player,
        status: "idle",
      }))
    })

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setTimeLeft(challenge.questions[currentQuestion + 1]?.timeLimit || 30)
    } else {
      // Game completed, navigate to results
      setGameEnded(true)

      toast({
        title: "Game completed!",
        description: "Redirecting to results page...",
        duration: 3000,
      })

      setTimeout(() => {
        if (router) {
          router.push(`/multiplayer/results/${params.id}`)
        }
      }, 3000)
    }
  }, [currentQuestion, totalQuestions, challenge.questions, router, params.id, toast])

  const getButtonVariant = (index: number) => {
    if (!showFeedback) return "outline"

    if (index === currentQuestionData.correctAnswer) {
      return "success"
    }

    if (selectedAnswer === index) {
      return "destructive"
    }

    return "outline"
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "hard":
        return "text-red-500"
      default:
        return "text-blue-500"
    }
  }

  // Get current user's rank
  const currentUserRank = players.find((player) => player.isCurrentUser)?.rank || 0

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
      {/* Countdown overlay */}
      {showCountdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Get Ready!</h2>
            <div className="text-7xl font-bold text-primary animate-pulse">{countdownValue}</div>
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4 border-b bg-background sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-4xl mx-auto">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-lg sm:text-xl font-bold">{challenge.title}</h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Badge variant="outline">{challenge.category}</Badge>
              <span>•</span>
              <Badge variant="outline">{challenge.difficulty}</Badge>
              <ConnectionStatus />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm">{players.length} players</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold">{score}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
                <Badge variant="outline" className={getDifficultyColor(currentQuestionData.difficulty)}>
                  {currentQuestionData.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{timeLeft} seconds left</span>
                {streak > 1 && (
                  <Badge variant="default" className="bg-orange-500">
                    {streak}x Streak!
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card className="w-full relative overflow-hidden">
            {showFeedback && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="bg-card p-6 rounded-lg shadow-lg text-center max-w-md">
                  {feedbackType === "correct" && (
                    <>
                      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Correct!</h2>
                      <p className="text-lg mb-4">+{pointsEarned} points</p>
                      {streak > 1 && <Badge className="bg-orange-500 text-white">Streak: {streak}x</Badge>}
                      <p className="mt-4 text-sm text-muted-foreground">{currentQuestionData.explanation}</p>
                    </>
                  )}
                  {feedbackType === "incorrect" && (
                    <>
                      <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Incorrect</h2>
                      <p className="text-muted-foreground mb-4">
                        The correct answer was: {currentQuestionData.options[currentQuestionData.correctAnswer]}
                      </p>
                      <p className="text-sm text-muted-foreground">{currentQuestionData.explanation}</p>
                    </>
                  )}
                  {feedbackType === "timeout" && (
                    <>
                      <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Time's Up!</h2>
                      <p className="text-muted-foreground mb-4">
                        The correct answer was: {currentQuestionData.options[currentQuestionData.correctAnswer]}
                      </p>
                      <p className="text-sm text-muted-foreground">{currentQuestionData.explanation}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{currentQuestionData.category}</Badge>
              </div>
              <CardTitle className="text-xl md:text-2xl">{currentQuestionData.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {currentQuestionData.options.map((option, index) => (
                  <Button
                    key={index}
                    ref={(el) => (optionsRef.current[index] = el)}
                    variant={getButtonVariant(index) as any}
                    className={cn(
                      "h-auto py-4 sm:py-6 px-4 sm:px-6 text-sm sm:text-lg relative overflow-hidden transition-all",
                      showFeedback &&
                        index === currentQuestionData.correctAnswer &&
                        "ring-2 ring-green-500 ring-offset-2",
                      showFeedback &&
                        selectedAnswer === index &&
                        index !== currentQuestionData.correctAnswer &&
                        "ring-2 ring-red-500 ring-offset-2",
                    )}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={selectedAnswer !== null || showFeedback}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${
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

                    {/* Show checkmark or x for correct/incorrect answers during feedback */}
                    {showFeedback && index === currentQuestionData.correctAnswer && (
                      <CheckCircle2 className="absolute right-4 h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                    )}
                    {showFeedback && selectedAnswer === index && index !== currentQuestionData.correctAnswer && (
                      <XCircle className="absolute right-4 h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">Select the correct answer</div>
              {selectedAnswer !== null && !showLeaderboard && (
                <Button onClick={handleNextQuestion}>
                  {currentQuestion < totalQuestions - 1 ? "Next Question" : "Finish Challenge"}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Player avatars with status */}
          <div className="flex flex-wrap justify-center gap-4">
            {players.map((player) => (
              <PlayerAvatar key={player.id} player={player} showStatus={true} showName={true} />
            ))}
          </div>

          {showLeaderboard && (
            <Card className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Current Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players
                    .sort((a, b) => a.rank - b.rank)
                    .map((player) => (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all",
                          player.isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/50",
                          player.rank <= 3
                            ? "border-l-4 " +
                                (player.rank === 1
                                  ? "border-l-yellow-500"
                                  : player.rank === 2
                                    ? "border-l-slate-400"
                                    : "border-l-amber-600")
                            : "",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                            {player.rank}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback>{player.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player.name}</span>
                              {player.isCurrentUser && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            {player.streak > 1 && (
                              <div className="text-xs text-orange-500 font-medium">{player.streak}x streak</div>
                            )}
                          </div>
                        </div>
                        <div className="font-bold">{player.score}</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player rank indicator (always visible) */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card shadow-lg rounded-full px-3 py-1 sm:px-4 sm:py-2 border flex items-center gap-1 sm:gap-2 text-xs sm:text-sm z-20">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="font-medium">Rank: #{currentUserRank}</span>
            <Separator orientation="vertical" className="h-4 sm:h-6" />
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="font-medium">{score} pts</span>
          </div>
        </div>
      </main>

      {/* Floating chat */}
      <div className="fixed bottom-16 right-4 z-20">
        {!chatCollapsed ? (
          <div className="w-80 h-96">
            <GameChat sessionId={params.id} onToggleCollapse={() => setChatCollapsed(true)} />
          </div>
        ) : (
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setChatCollapsed(false)}>
            <span>Chat</span>
          </Button>
        )}
      </div>
    </div>
  )
}
