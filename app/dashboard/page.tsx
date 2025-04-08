"use client"

import { useState, useEffect } from "react"
import { Activity, BookOpen, Clock, Gamepad2, Heart, MessageSquare, Shield, Stethoscope } from "lucide-react"
import dynamic from "next/dynamic"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { DashboardHeader } from "~/components/dashboard-header"
import { dashboardData, LearningProgress, UpcomingReview, Certification, Activity as ActivityType, Recommendation } from "./mock-data"

// Dynamically import the DashboardChart with no SSR to prevent hydration issues
const DynamicDashboardChart = dynamic(
  () => import("~/components/dashboard-chart").then((mod) => ({ default: mod.DashboardChart })),
  { ssr: false },
)

export default function DashboardPage() {
  // State to ensure client-side rendering for data-dependent components
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get data from our mock data source
  const {
    summaryCards,
    weeklyProgress,
    learningProgress,
    upcomingReviews,
    certifications,
    recentActivity,
    trainingRecommendations,
  } = dashboardData

  // Helper function to render the appropriate icon
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "heart":
        return <Heart className="w-4 h-4 text-accent" />
      case "shield":
        return <Shield className="w-4 h-4 text-accent" />
      case "stethoscope":
        return <Stethoscope className="w-4 h-4 text-accent" />
      case "book-open":
        return <BookOpen className="w-4 h-4 text-primary" />
      case "gamepad-2":
        return <Gamepad2 className="w-4 h-4 text-primary" />
      case "message-square":
        return <MessageSquare className="w-4 h-4 text-primary" />
      default:
        return <Shield className="w-4 h-4 text-primary" />
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Dashboard" description="Welcome back! Here's an overview of your training progress." />

      <main className="flex-1 p-6 space-y-6">
        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Training Streak</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryCards.trainingStreak.value} days</div>
              <p className="text-xs text-muted-foreground">{summaryCards.trainingStreak.changeText}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Cards Reviewed</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryCards.cardsReviewed.value}</div>
              <p className="text-xs text-muted-foreground">{summaryCards.cardsReviewed.changeText}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Game Score</CardTitle>
              <Gamepad2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryCards.gameScore.value}%</div>
              <p className="text-xs text-muted-foreground">{summaryCards.gameScore.changeText}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">AI Chats</CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryCards.aiChats.value}</div>
              <p className="text-xs text-muted-foreground">{summaryCards.aiChats.changeText}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList>
            <TabsTrigger value="progress">Learning Progress</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Reviews</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <CardTitle>Weekly Progress</CardTitle>
                  <CardDescription>Your training activity over the past 7 days</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-64 sm:h-80">
                {isClient && <DynamicDashboardChart data={weeklyProgress} />}
              </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {learningProgress.map((course: LearningProgress) => (
                <Card key={course.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">{course.dueCards} cards due today</div>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm" className="w-full">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Study Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Reviews</CardTitle>
                <CardDescription>Cards scheduled for review in the next few days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingReviews.map((review: UpcomingReview, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{review.period}</p>
                          <p className="text-xs text-muted-foreground">{review.dueCards} cards due</p>
                        </div>
                      </div>
                      <Button size="sm" variant={review.actionVariant}>
                        {review.actionText}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Certifications</CardTitle>
                <CardDescription>Track your Red Cross certifications and renewals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certifications.map((cert: Certification, index: number) => {
                    // Determine the icon based on the cert.icon property
                    let IconComponent
                    if (cert.icon === "heart") IconComponent = Heart
                    else if (cert.icon === "shield") IconComponent = Shield
                    else if (cert.icon === "stethoscope") IconComponent = Stethoscope
                    else IconComponent = Shield

                    // Determine color classes based on status
                    const bgColorClass =
                      cert.color === "green"
                        ? "bg-green-100 dark:bg-green-900"
                        : cert.color === "yellow"
                          ? "bg-yellow-100 dark:bg-yellow-900"
                          : "bg-red-100 dark:bg-red-900"

                    const textColorClass =
                      cert.color === "green"
                        ? "text-green-600 dark:text-green-400"
                        : cert.color === "yellow"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"

                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 ${bgColorClass} rounded-full`}>
                            <IconComponent className={`w-5 h-5 ${textColorClass}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{cert.title}</p>
                            <p className="text-xs text-muted-foreground">{cert.validUntil}</p>
                          </div>
                        </div>
                        <Button size="sm" variant={cert.status === "expiring" ? "default" : "outline"}>
                          {cert.status === "expiring" ? "Renew Now" : "View Certificate"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Certifications
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent training activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity: ActivityType, index: number) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">{renderIcon(activity.icon)}</div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.activity}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Training Recommendations</CardTitle>
              <CardDescription>Personalized suggestions based on your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingRecommendations.map((recommendation: Recommendation, index: number) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="p-2 bg-accent/10 rounded-full">{renderIcon(recommendation.icon)}</div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{recommendation.title}</p>
                      <p className="text-xs text-muted-foreground">{recommendation.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">View All Recommendations</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
