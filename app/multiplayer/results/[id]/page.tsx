"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Heart,
  Medal,
  Share2,
  Shield,
  Users,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { PlayerAvatar } from "../../components/player-avatar";
import { useToast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";

export default function ResultsPage({ params }: { params: { id: string } }) {
  return <ResultsContent params={params} />;
}

function ResultsContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Mock data for session results
  const results = {
    sessionTitle: "CPR & AED Challenge",
    mode: "Rapid Response", // or "Card Clash"
    score: 85,
    correctAnswers: 17,
    totalQuestions: 20,
    timeTaken: "8:24",
    rank: 2,
    totalParticipants: 5,
    participants: [
      {
        id: 1,
        name: "Sarah Johnson",
        avatar: "/avatar.svg?height=40&width=40",
        score: 3450,
        rank: 1,
        streak: 3,
      },
      {
        id: 2,
        name: "John Doe",
        avatar: "/avatar.svg?height=40&width=40",
        score: 3200,
        rank: 2,
        streak: 2,
        isCurrentUser: true,
      },
      {
        id: 3,
        name: "Michael Smith",
        avatar: "/avatar.svg?height=40&width=40",
        score: 2800,
        rank: 3,
        streak: 0,
      },
      {
        id: 4,
        name: "Emily Davis",
        avatar: "/avatar.svg?height=40&width=40",
        score: 2350,
        rank: 4,
        streak: 0,
      },
      {
        id: 5,
        name: "Robert Wilson",
        avatar: "/avatar.svg?height=40&width=40",
        score: 1900,
        rank: 5,
        streak: 0,
      },
    ],
    categories: [
      { name: "CPR Technique", score: 90, total: 100 },
      { name: "AED Usage", score: 80, total: 100 },
      { name: "Patient Assessment", score: 85, total: 100 },
    ],
    answers: [
      {
        question: "What is the correct compression rate for adult CPR?",
        userAnswer: "100-120 compressions per minute",
        correctAnswer: "100-120 compressions per minute",
        isCorrect: true,
        explanation:
          "The American Heart Association recommends a compression rate of 100-120 compressions per minute for adult CPR.",
      },
      {
        question: "How deep should chest compressions be for an adult?",
        userAnswer:
          "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
        correctAnswer:
          "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
        isCorrect: true,
        explanation:
          "Proper compression depth ensures adequate blood circulation without causing injury.",
      },
      {
        question:
          "When using an AED, what should you do before applying the pads?",
        userAnswer: "Ensure the patient is breathing",
        correctAnswer: "Ensure the patient's chest is dry and exposed",
        isCorrect: false,
        explanation:
          "Moisture can interfere with the electrical current and clothing can prevent proper pad contact.",
      },
    ],
    achievements: [
      {
        name: "First Blood",
        description: "First to answer a question correctly",
        icon: "Award",
      },
      {
        name: "Streak Master",
        description: "Achieved a 3x answer streak",
        icon: "Flame",
      },
      {
        name: "Speed Demon",
        description: "Answered 5 questions in under 10 seconds each",
        icon: "Zap",
      },
    ],
  };

  const handleShareResults = () => {
    setShowShareOptions(!showShareOptions);

    toast.info({
      title: "Share your results",
      description: "Copy the link or share directly to social media",
      duration: 3000,
    });
  };

  const handlePlayAgain = () => {
    toast.info({
      title: "Starting new game",
      description: "Redirecting to multiplayer lobby...",
      duration: 2000,
    });

    setTimeout(() => {
      if (router) {
        router.push("/multiplayer");
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="border-b bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center h-auto sm:h-16 px-4 sm:px-6 py-3 sm:py-0 max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" asChild className="mb-2 sm:mb-0">
            <Link href="/multiplayer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Link>
          </Button>
          <div className="sm:ml-4 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">
              {results.sessionTitle} Results
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {results.mode} • Completed just now
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            <Card className="text-center overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Score</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative mx-auto my-4 h-36 w-36">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl font-bold">{results.score}%</div>
                  </div>
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="stroke-muted fill-none"
                      strokeWidth="10"
                      cx="50"
                      cy="50"
                      r="40"
                    />
                    <circle
                      className="stroke-primary fill-none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      strokeDasharray={`${results.score * 2.51} 251`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  {results.correctAnswers} of {results.totalQuestions} questions
                  correct
                </p>
              </CardContent>
            </Card>

            <Card className="text-center overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Rank</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col items-center justify-center h-36">
                  <Award className="h-12 w-12 text-primary mb-2" />
                  <div className="text-4xl font-bold">#{results.rank}</div>
                  <p className="text-sm text-muted-foreground">
                    of {results.totalParticipants} participants
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Time Taken</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col items-center justify-center h-36">
                  <div className="text-4xl font-bold">{results.timeTaken}</div>
                  <p className="text-sm text-muted-foreground">
                    minutes:seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="leaderboard" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="answers">Your Answers</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                  <CardDescription>
                    See how you ranked against other participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg transition-all",
                          participant.isCurrentUser
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-muted/50",
                          participant.rank <= 3
                            ? "border-l-4 " +
                                (participant.rank === 1
                                  ? "border-l-yellow-500"
                                  : participant.rank === 2
                                    ? "border-l-slate-400"
                                    : "border-l-amber-600")
                            : "",
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            {participant.rank}
                          </div>
                          <PlayerAvatar
                            player={participant}
                            showStatus={false}
                            showBadge={false}
                            size="sm"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{participant.name}</p>
                              {participant.isCurrentUser && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {participant.score} points
                              </p>
                              {participant.streak > 1 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-orange-500 border-orange-500"
                                >
                                  {participant.streak}x streak
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {participant.rank <= 3 && (
                          <Medal
                            className={cn(
                              "h-5 w-5",
                              participant.rank === 1
                                ? "text-yellow-500"
                                : participant.rank === 2
                                  ? "text-slate-400"
                                  : "text-amber-600",
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
                  <Button
                    variant="outline"
                    onClick={handleShareResults}
                    className="w-full sm:w-auto"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Results
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Category</CardTitle>
                  <CardDescription>
                    See how well you performed in each category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {results.categories.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {index === 0 ? (
                              <Heart className="h-4 w-4 text-primary" />
                            ) : index === 1 ? (
                              <Shield className="h-4 w-4 text-primary" />
                            ) : (
                              <Users className="h-4 w-4 text-primary" />
                            )}
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm">
                            {category.score}/{category.total}
                          </span>
                        </div>
                        <Progress
                          value={(category.score / category.total) * 100}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {category.score >= 90
                            ? "Excellent! You've mastered this category."
                            : category.score >= 70
                              ? "Good job! You have a solid understanding of this category."
                              : "Keep practicing this category to improve your knowledge."}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="answers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Answers</CardTitle>
                  <CardDescription>
                    Review your answers and see the correct solutions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {results.answers.map((answer, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <p className="font-medium">
                          {index + 1}. {answer.question}
                        </p>
                        <div
                          className={cn(
                            "mt-2 flex items-center text-sm",
                            answer.isCorrect
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400",
                          )}
                        >
                          <div
                            className={cn(
                              "mr-2 h-2 w-2 rounded-full",
                              answer.isCorrect
                                ? "bg-green-600 dark:bg-green-400"
                                : "bg-red-600 dark:bg-red-400",
                            )}
                          ></div>
                          Your answer: {answer.userAnswer} (
                          {answer.isCorrect ? "Correct" : "Incorrect"})
                        </div>
                        {!answer.isCorrect && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            Correct answer: {answer.correctAnswer}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          <span className="font-medium">Explanation:</span>{" "}
                          {answer.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Review All Answers</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Achievements Unlocked</CardTitle>
                  <CardDescription>
                    Special accomplishments from this session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {results.achievements.map((achievement, index) => (
                      <Card
                        key={index}
                        className="bg-primary/5 border-primary/20"
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-center">
                            {achievement.icon === "Award" ? (
                              <Award className="h-12 w-12 text-primary" />
                            ) : achievement.icon === "Flame" ? (
                              <div className="h-12 w-12 flex items-center justify-center text-2xl">
                                🔥
                              </div>
                            ) : (
                              <div className="h-12 w-12 flex items-center justify-center text-2xl">
                                ⚡
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 text-center">
                          <h3 className="font-bold">{achievement.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {achievement.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/multiplayer">Return to Multiplayer</Link>
            </Button>
            <Button onClick={handlePlayAgain} className="w-full sm:w-auto">
              Start New Game
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
