"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Award, BookOpen, Calendar, Edit, Heart, Mail, MapPin, Phone, Shield } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Progress } from "~/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Badge as UIBadge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { DashboardHeader } from "~/components/dashboard-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { useToast } from "~/hooks/use-toast"

interface Certificate {
  id: string
  title: string
  issuedDate: string
  expiryDate: string
  status: "Valid" | "Expiring Soon" | "Expired"
  icon: React.ReactNode
}

interface BadgeType {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  date: string
}

interface Course {
  id: string
  title: string
  progress: number
  lastAccessed: string
  icon: React.ReactNode
}

export default function ProfilePage() {
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)

  // Mock user data
  const user = {
    name: "John Doe",
    role: "First Responder",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    bio: "Dedicated Red Cross volunteer with 5 years of experience in emergency response and first aid training. Passionate about helping others and teaching life-saving skills.",
    joinDate: "January 2018",
    avatar: "/avatar.svg?height=128&width=128",
  }

  // Mock certificates data
  const certificates: Certificate[] = [
    {
      id: "cert-1",
      title: "CPR & AED Certification",
      issuedDate: "June 15, 2023",
      expiryDate: "June 15, 2025",
      status: "Valid",
      icon: <Heart className="h-5 w-5 text-primary" />,
    },
    {
      id: "cert-2",
      title: "First Aid Basics",
      issuedDate: "August 22, 2022",
      expiryDate: "August 22, 2024",
      status: "Valid",
      icon: <Shield className="h-5 w-5 text-primary" />,
    },
    {
      id: "cert-3",
      title: "Emergency Medical Response",
      issuedDate: "March 10, 2022",
      expiryDate: "March 10, 2024",
      status: "Expiring Soon",
      icon: <Shield className="h-5 w-5 text-yellow-500" />,
    },
    {
      id: "cert-4",
      title: "Bloodborne Pathogens",
      issuedDate: "January 5, 2022",
      expiryDate: "January 5, 2023",
      status: "Expired",
      icon: <Shield className="h-5 w-5 text-red-500" />,
    },
  ]

  // Mock badges data
  const badges: BadgeType[] = [
    {
      id: "badge-1",
      title: "First Responder Elite",
      description: "Completed 50+ emergency response calls",
      icon: <Award className="h-8 w-8 text-yellow-500" />,
      date: "December 2022",
    },
    {
      id: "badge-2",
      title: "CPR Master",
      description: "Successfully taught CPR to 100+ individuals",
      icon: <Award className="h-8 w-8 text-blue-500" />,
      date: "August 2022",
    },
    {
      id: "badge-3",
      title: "Disaster Relief Volunteer",
      description: "Participated in 5+ disaster relief operations",
      icon: <Award className="h-8 w-8 text-green-500" />,
      date: "March 2022",
    },
    {
      id: "badge-4",
      title: "Blood Drive Champion",
      description: "Organized 10+ successful blood drives",
      icon: <Award className="h-8 w-8 text-red-500" />,
      date: "January 2022",
    },
  ]

  // Mock courses data
  const courses: Course[] = [
    {
      id: "course-1",
      title: "Advanced Bleeding Control",
      progress: 75,
      lastAccessed: "Yesterday",
      icon: <Shield className="h-5 w-5 text-primary" />,
    },
    {
      id: "course-2",
      title: "Disaster Preparedness",
      progress: 45,
      lastAccessed: "3 days ago",
      icon: <Shield className="h-5 w-5 text-primary" />,
    },
    {
      id: "course-3",
      title: "Psychological First Aid",
      progress: 20,
      lastAccessed: "1 week ago",
      icon: <Heart className="h-5 w-5 text-primary" />,
    },
  ]

  // Mock upcoming courses
  const upcomingCourses = [
    {
      id: "upcoming-1",
      title: "Wilderness First Aid",
      date: "June 15-16, 2023",
      location: "Central Park Training Center",
      icon: <Shield className="h-5 w-5 text-primary" />,
    },
    {
      id: "upcoming-2",
      title: "Emergency Vehicle Operations",
      date: "July 8, 2023",
      location: "Red Cross Regional Headquarters",
      icon: <Shield className="h-5 w-5 text-primary" />,
    },
  ]

  const handleSaveProfile = () => {
    // In a real app, this would save the profile data
    setIsEditing(false)
    toast.success({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Profile" description="View and manage your personal information" />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                  <UIBadge className="mt-2">Active Member</UIBadge>

                  <div className="w-full mt-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{user.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Member since {user.joinDate}</span>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="w-full text-left">
                    <h3 className="text-sm font-medium mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">{user.bio}</p>
                  </div>

                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button className="mt-6 w-full" variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>Update your personal information</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" defaultValue={user.name} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" defaultValue={user.email} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" defaultValue={user.phone} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" defaultValue={user.location} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea id="bio" defaultValue={user.bio} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-2 space-y-6">
              <Tabs defaultValue="certifications" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="certifications">
                    <span className="hidden sm:inline">Certifications</span>
                    <span className="sm:hidden">Certs</span>
                  </TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                </TabsList>

                <TabsContent value="certifications" className="space-y-4">
                  {certificates.map((certificate) => (
                    <Card key={certificate.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-2 rounded-full ${
                                certificate.status === "Valid"
                                  ? "bg-green-100 dark:bg-green-900/30"
                                  : certificate.status === "Expiring Soon"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                                    : "bg-red-100 dark:bg-red-900/30"
                              }`}
                            >
                              {certificate.icon}
                            </div>
                            <div>
                              <h3 className="font-medium">{certificate.title}</h3>
                              <div className="text-sm text-muted-foreground">
                                <p>Issued: {certificate.issuedDate}</p>
                                <p>Expires: {certificate.expiryDate}</p>
                              </div>
                            </div>
                          </div>
                          <UIBadge
                            variant={
                              certificate.status === "Valid"
                                ? "default"
                                : certificate.status === "Expiring Soon"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {certificate.status}
                          </UIBadge>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/50 border-t px-4 py-2">
                        <div className="flex justify-between w-full">
                          <Button variant="ghost" size="sm">
                            View Certificate
                          </Button>
                          {certificate.status === "Expired" && <Button size="sm">Renew</Button>}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="badges" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {badges.map((badge) => (
                      <Card key={badge.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center text-center p-4">
                            <div className="p-3 rounded-full bg-muted mb-4">{badge.icon}</div>
                            <h3 className="font-medium">{badge.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">Earned in {badge.date}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="courses" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">In Progress</h3>
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <Card key={course.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="p-2 rounded-full bg-primary/10">{course.icon}</div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h3 className="font-medium">{course.title}</h3>
                                  <span className="text-sm">{course.progress}%</span>
                                </div>
                                <Progress value={course.progress} className="h-2 mt-2" />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Last accessed: {course.lastAccessed}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="bg-muted/50 border-t px-4 py-2">
                            <Button className="w-full" asChild>
                              <Link href={`/courses/${course.id}`}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                Continue Learning
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Upcoming Courses</h3>
                    <div className="space-y-4">
                      {upcomingCourses.map((course) => (
                        <Card key={course.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="p-2 rounded-full bg-primary/10">{course.icon}</div>
                              <div>
                                <h3 className="font-medium">{course.title}</h3>
                                <div className="text-sm text-muted-foreground">
                                  <p>Date: {course.date}</p>
                                  <p>Location: {course.location}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="bg-muted/50 border-t px-4 py-2">
                            <div className="flex gap-2 w-full">
                              <Button variant="outline" className="flex-1">
                                View Details
                              </Button>
                              <Button className="flex-1">Add to Calendar</Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Training Statistics</CardTitle>
                <CardDescription>Your training activity and achievements</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="text-xl sm:text-3xl font-bold">24</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Courses Completed</p>
                </div>
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="text-xl sm:text-3xl font-bold">156</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Training Hours</p>
                </div>
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="text-xl sm:text-3xl font-bold">4</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Certifications</p>
                </div>
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="text-xl sm:text-3xl font-bold">12</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Badges Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
