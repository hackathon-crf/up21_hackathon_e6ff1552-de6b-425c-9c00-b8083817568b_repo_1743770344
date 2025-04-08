"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Clock, Eye, ThumbsDown, ThumbsUp, Trophy, User, Users } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Input } from "~/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { useToast } from "~/hooks/use-toast"
import { ConnectionStatus } from "../components/connection-status"
import { PlayerAvatar } from "../components/player-avatar"
import { GameChat } from "../components/game-chat"
import { GameNotificationsProvider, useGameNotifications } from "../components/game-notifications-provider"
import { cn } from "~/lib/utils"

// Define types for better type safety
interface Player {
  id: number | string
  name: string
  avatar: string
  score: number
  rank: number
  streak: number
  isCurrentUser: boolean
  status?: "idle" | "typing" | "answered" | "thinking" | "away"
}

interface Flashcard {
  id: number
  question: string
  answer: string
  category: string
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number
  keywords: string[]
  explanation?: string
}

export default function CardClashPage({ params }: { params: { id: string } }) {
  return (
    <GameNotificationsProvider>
      <CardClashContent params={params} />
    </GameNotificationsProvider>
  )
}

function CardClashContent({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { showNotification } = useGameNotifications()
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [answer, setAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [result, setResult] = useState<"correct" | "incorrect" | "timeout" | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [chatCollapsed, setChatCollapsed] = useState(true)
  const [countdownValue, setCountdownValue] = useState(3)
  const [showCountdown, setShowCountdown] = useState(true)

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

  // Mock data for the flashcards
  const flashcards: Flashcard[] = [
    {
      id: 1,
      question: "What is the correct compression rate for adult CPR?",
      answer: "100-120 compressions per minute",
      category: "CPR Technique",
      difficulty: "medium",
      timeLimit: 60,
      keywords: ["100", "120", "compressions", "minute"],
      explanation:
        "The American Heart Association recommends a compression rate of 100-120 compressions per minute for adult CPR to ensure adequate blood circulation.",
    },
    {
      id: 2,
      question: "How deep should chest compressions be for an adult?",
      answer: "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
      category: "CPR Technique",
      difficulty: "medium",
      timeLimit: 60,
      keywords: ["2 inches", "5 cm", "2.4 inches", "6 cm"],
      explanation:
        "Proper compression depth is at least 2 inches (5 cm) but not more than 2.4 inches (6 cm) for adults. This ensures adequate blood circulation without causing injury.",
    },
    {
      id: 3,
      question: "What is the first step in treating a severe bleeding wound?",
      answer: "Apply direct pressure to the wound with a clean cloth or bandage",
      category: "Bleeding Control",
      difficulty: "easy",
      timeLimit: 60,
      keywords: ["direct pressure", "wound", "cloth", "bandage"],
      explanation:
        "Direct pressure is the most effective first step to control bleeding. It helps slow blood flow and allows clotting to begin.",
    },
    {
      id: 4,
      question: "What are the signs of shock?",
      answer: "Pale, cold, clammy skin; rapid, weak pulse; rapid breathing; nausea; and altered mental status",
      category: "Emergency Response",
      difficulty: "hard",
      timeLimit: 60,
      keywords: ["pale", "cold", "clammy", "rapid", "weak pulse", "breathing", "mental status"],
      explanation:
        "Recognizing shock early is critical. These signs indicate the body's compensatory mechanisms are trying to maintain blood flow to vital organs.",
    },
    {
      id: 5,
      question: "What is the recovery position and when should it be used?",
      answer:
        "A stable position where the patient lies on their side with the lower arm forward and head tilted back. Used for unconscious patients who are breathing normally and have no suspected spinal injuries.",
      category: "Patient Positioning",
      difficulty: "hard",
      timeLimit: 60,
      keywords: ["side", "unconscious", "breathing", "spinal injuries"],
      explanation:
        "The recovery position helps maintain an open airway and prevents aspiration if the patient vomits. It should only be used when spinal injury is not suspected.",
    },
  ]

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

  const totalCards = flashcards.length
  const currentCardData = flashcards[currentCard]
  const progress = ((currentCard + 1) / totalCards) * 100

  // Show welcome notification when game starts
  useEffect(() => {
    if (gameStarted && currentCard === 0) {
      showNotification(
        "info",
        "Game started!",
        "Type your answer or flip the card. Hints are available but will reduce your score.",
        5000,
      )
    }
  }, [gameStarted, currentCard, showNotification])

  // Focus input when card changes
  useEffect(() => {
    if (inputRef.current && !flipped && result === null && gameStarted && !showCountdown) {
      inputRef.current.focus()
    }
  }, [currentCard, flipped, result, gameStarted, showCountdown])

  // Simulate other players typing and answering
  useEffect(() => {
    if (!gameStarted || gameEnded || result !== null || showCountdown) return

    // Simulate typing indicators
    const typingInterval = setInterval(() => {
      setPlayers((prevPlayers) => {
        return prevPlayers.map((player) => {
          if (!player.isCurrentUser) {
            // Randomly change typing status
            const newStatus =
              Math.random() > 0.7
                ? "typing"
                : player.status === "typing" && Math.random() > 0.3
                  ? "answered"
                  : player.status === "answered"
                    ? "answered"
                    : "idle"

            return {
              ...player,
              status: newStatus,
            }
          }
          return player
        })
      })
    }, 2000)

    // Simulate players answering
    const answerInterval = setInterval(() => {
      setPlayers((prevPlayers) => {
        return prevPlayers
          .map((player) => {
            if (!player.isCurrentUser && player.status === "typing" && Math.random() > 0.6) {
              // Simulate player answering correctly or incorrectly
              const gotItRight = Math.random() > 0.4
              const basePoints = gotItRight ? 1000 : 0
              const timeBonus = Math.floor(Math.random() * 300)
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
    }, 5000)

    return () => {
      clearInterval(typingInterval)
      clearInterval(answerInterval)
    }
  }, [gameStarted, gameEnded, result, showCountdown])

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameEnded || result !== null || showCountdown) return

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // Time's up
      setResult("timeout")
      setFlipped(true)
      setStreak(0) // Reset streak on timeout

      showNotification("timer", "Time's up!", `The correct answer was: ${currentCardData.answer}`, 3000)

      // Simulate other players answering
      simulateOtherPlayersAnswers()

      // Show leaderboard after feedback
      setTimeout(() => {
        setShowLeaderboard(true)
      }, 2000)

      // Move to next card after delay
      setTimeout(() => {
        handleNextCard()
      }, 5000)
    }
  }, [timeLeft, gameStarted, gameEnded, result, showCountdown, currentCardData])

  // Simulate other players answering
  const simulateOtherPlayersAnswers = useCallback(() => {
    setPlayers((prevPlayers) => {
      return prevPlayers
        .map((player) => {
          if (!player.isCurrentUser && player.status !== "answered") {
            // 60% chance of getting it right for AI players
            const gotItRight = Math.random() > 0.4
            const basePoints = gotItRight ? 1000 : 0
            const timeBonus = Math.floor(Math.random() * 300)
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

  const handleFlip = () => {
    if (!flipped && result === null) {
      setFlipped(true)
      setResult("timeout") // Treat manual flip as a timeout/skip
      setStreak(0) // Reset streak

      showNotification("info", "Card flipped", `The answer is: ${currentCardData.answer}`, 3000)

      // Simulate other players answering
      simulateOtherPlayersAnswers()

      // Show leaderboard after feedback
      setTimeout(() => {
        setShowLeaderboard(true)
      }, 2000)

      // Move to next card after delay
      setTimeout(() => {
        handleNextCard()
      }, 5000)
    }
  }

  const checkAnswer = (userAnswer: string): boolean => {
    if (!userAnswer.trim()) return false

    const normalizedUserAnswer = userAnswer.toLowerCase().trim()
    const normalizedCorrectAnswer = currentCardData.answer.toLowerCase()

    // Check for exact match or keyword matches
    if (normalizedUserAnswer === normalizedCorrectAnswer) return true

    // Check if answer contains enough keywords
    const keywordMatches = currentCardData.keywords.filter((keyword) =>
      normalizedUserAnswer.includes(keyword.toLowerCase()),
    )

    // If more than half of keywords match, consider it correct
    return keywordMatches.length >= Math.ceil(currentCardData.keywords.length / 2)
  }

  const handleSubmitAnswer = () => {
    if (answer.trim() && result === null) {
      // Check if answer is correct
      const isCorrect = checkAnswer(answer)

      // Set result
      setResult(isCorrect ? "correct" : "incorrect")

      // Flip card to show answer
      setFlipped(true)

      // Show notification
      if (isCorrect) {
        showNotification("success", "Correct answer!", currentCardData.explanation, 4000)
      } else {
        showNotification(
          "error",
          "Incorrect answer",
          `The correct answer was: ${currentCardData.answer}. ${currentCardData.explanation}`,
          4000,
        )
      }

      // Update streak
      if (isCorrect) {
        const newStreak = streak + 1
        setStreak(newStreak)

        if (newStreak > 1) {
          showNotification("achievement", `${newStreak}x Streak!`, "Keep it up for bonus points!", 2000)
        }
      } else {
        setStreak(0)
      }

      // Calculate score based on correctness, time left, and streak
      if (isCorrect) {
        // Correct answer: base points + time bonus + streak bonus - hint penalty
        const basePoints = 1000
        const timeBonus = timeLeft * 5
        const streakBonus = streak * 100
        const hintPenalty = hintsUsed * 200
        const cardScore = basePoints + timeBonus + streakBonus - hintPenalty

        setPointsEarned(cardScore)
        setScore((prev) => prev + cardScore)

        // Update player score
        setPlayers((prevPlayers) => {
          const updatedPlayers = prevPlayers
            .map((player) => {
              if (player.isCurrentUser) {
                return {
                  ...player,
                  score: player.score + cardScore,
                  streak: player.streak + 1,
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
          return updatedPlayers
        })
      } else {
        setPointsEarned(0)
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
      }

      // Simulate other players answering
      simulateOtherPlayersAnswers()

      // Show leaderboard after feedback
      setTimeout(() => {
        setShowLeaderboard(true)
      }, 2000)

      // Move to next card after delay
      setTimeout(() => {
        handleNextCard()
      }, 5000)
    }
  }

  const handleNextCard = useCallback(() => {
    setFlipped(false)
    setShowLeaderboard(false)
    setAnswer("")
    setResult(null)
    setPointsEarned(0)
    setShowHint(false)
    setHintsUsed(0)

    // Reset player statuses
    setPlayers((prevPlayers) => {
      return prevPlayers.map((player) => ({
        ...player,
        status: "idle",
      }))
    })

    if (currentCard < totalCards - 1) {
      setCurrentCard((prev) => prev + 1)
      setTimeLeft(flashcards[currentCard + 1]?.timeLimit || 60)
    } else {
      // Game completed, navigate to results
      setGameEnded(true)

      showNotification("success", "Game completed!", "Redirecting to results page...", 3000)

      setTimeout(() => {
        if (router) {
          router.push(`/multiplayer/results/${params.id}`)
        }
      }, 3000)
    }
  }, [currentCard, totalCards, flashcards, router, params.id, showNotification])

  const handleShowHint = () => {
    setShowHint(true)
    setHintsUsed((prev) => prev + 1)

    showNotification("info", "Hint used", "Using hints reduces your score for this card", 3000)
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

  // Generate hint from answer
  const generateHint = (answer: string): string => {
    const words = answer.split(" ")
    return words.map((word) => (word.length > 3 ? word[0] + "___" + word[word.length - 1] : "___")).join(" ")
  }

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
            <h1 className="text-lg sm:text-xl font-bold">Card Clash: First Aid Basics</h1>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Badge variant="outline">{currentCardData.category}</Badge>
              <span>•</span>
              <Badge variant="outline">{currentCardData.difficulty}</Badge>
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
                  Flashcard {currentCard + 1} of {totalCards}
                </span>
                <Badge variant="outline" className={getDifficultyColor(currentCardData.difficulty)}>
                  {currentCardData.difficulty}
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

          <Card
            className={cn(
              "w-full h-48 sm:h-64 cursor-pointer transition-all duration-500 perspective-1000",
              flipped ? "bg-primary/5" : "",
            )}
            onClick={handleFlip}
          >
            <div
              className={cn(
                "relative w-full h-full transition-all duration-500 transform-style-3d",
                flipped && "rotate-y-180",
              )}
            >
              <div className="absolute inset-0 w-full h-full flex flex-col justify-center backface-hidden">
                <CardHeader>
                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>Question</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShowHint()
                      }}
                      disabled={showHint}
                      className="text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Show Hint
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium text-center">{currentCardData.question}</div>

                  {showHint && (
                    <div className="mt-4 p-2 bg-muted rounded-md text-center text-sm">
                      <p className="text-muted-foreground mb-1">Hint:</p>
                      <p>{generateHint(currentCardData.answer)}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-center text-sm text-muted-foreground">
                  Type your answer below or click to reveal
                </CardFooter>
              </div>

              <div className="absolute inset-0 w-full h-full flex flex-col justify-center backface-hidden rotate-y-180">
                <CardHeader>
                  <div className="text-sm text-muted-foreground">Answer</div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-medium text-center">{currentCardData.answer}</div>
                  {currentCardData.explanation && (
                    <p className="mt-4 text-sm text-muted-foreground text-center">{currentCardData.explanation}</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                  {result === "correct" ? (
                    <div className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5" />
                      Correct! +{pointsEarned} points
                    </div>
                  ) : result === "incorrect" ? (
                    <div className="text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                      <ThumbsDown className="h-5 w-5" />
                      Incorrect
                    </div>
                  ) : result === "timeout" ? (
                    <div className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Time's Up
                    </div>
                  ) : null}
                </CardFooter>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                // Update current user status to typing
                if (e.target.value && !flipped && result === null) {
                  setPlayers((prevPlayers) => {
                    return prevPlayers.map((player) => {
                      if (player.isCurrentUser) {
                        return {
                          ...player,
                          status: "typing",
                        }
                      }
                      return player
                    })
                  })
                }
              }}
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
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card shadow-lg rounded-full px-4 py-2 border flex items-center gap-2 z-20">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">Your Rank: #{currentUserRank}</span>
            <Separator orientation="vertical" className="h-6" />
            <Trophy className="h-4 w-4 text-primary" />
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
