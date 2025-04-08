"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Filter, Heart, Search, Shield, Stethoscope, Users } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Badge } from "~/components/ui/badge"
import { DashboardHeader } from "~/components/dashboard-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

// Define the training category interface
interface TrainingCategory {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  level: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  modules: number
  enrolled: number
  tags: string[]
  certification: boolean
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Mock data for training categories
  const categories: TrainingCategory[] = [
    {
      id: "cpr-aed",
      title: "CPR & AED",
      description:
        "Learn life-saving cardiopulmonary resuscitation techniques and how to use an automated external defibrillator.",
      icon: <Heart className="h-6 w-6 text-primary" />,
      level: "Beginner",
      duration: "4 hours",
      modules: 5,
      enrolled: 1245,
      tags: ["Life-saving", "Emergency", "Certification"],
      certification: true,
    },
    {
      id: "first-aid-basics",
      title: "First Aid Basics",
      description: "Master essential first aid skills including wound care, bandaging, and basic emergency procedures.",
      icon: <Shield className="h-6 w-6 text-primary" />,
      level: "Beginner",
      duration: "6 hours",
      modules: 8,
      enrolled: 2130,
      tags: ["Fundamentals", "Emergency", "Certification"],
      certification: true,
    },
    {
      id: "emergency-response",
      title: "Emergency Response",
      description: "Develop advanced skills for responding to emergencies, including scene assessment and triage.",
      icon: <Shield className="h-6 w-6 text-primary" />,
      level: "Intermediate",
      duration: "8 hours",
      modules: 10,
      enrolled: 876,
      tags: ["Advanced", "Emergency", "Certification"],
      certification: true,
    },
    {
      id: "bleeding-control",
      title: "Bleeding Control",
      description: "Learn techniques to control bleeding in emergency situations, including the use of tourniquets.",
      icon: <Stethoscope className="h-6 w-6 text-primary" />,
      level: "Intermediate",
      duration: "3 hours",
      modules: 4,
      enrolled: 654,
      tags: ["Specialized", "Emergency", "Trauma"],
      certification: false,
    },
    {
      id: "pediatric-first-aid",
      title: "Pediatric First Aid",
      description: "Specialized first aid techniques for infants and children in emergency situations.",
      icon: <Users className="h-6 w-6 text-primary" />,
      level: "Intermediate",
      duration: "5 hours",
      modules: 6,
      enrolled: 789,
      tags: ["Specialized", "Children", "Certification"],
      certification: true,
    },
    {
      id: "disaster-preparedness",
      title: "Disaster Preparedness",
      description:
        "Prepare for natural disasters and large-scale emergencies with comprehensive planning and response techniques.",
      icon: <Shield className="h-6 w-6 text-primary" />,
      level: "Advanced",
      duration: "10 hours",
      modules: 12,
      enrolled: 432,
      tags: ["Advanced", "Disaster", "Planning"],
      certification: false,
    },
  ]

  // Get all unique tags from categories
  const allTags = Array.from(new Set(categories.flatMap((category) => category.tags)))

  // Filter categories based on search term and filters
  const filteredCategories = categories.filter((category) => {
    // Search term filter
    const matchesSearch =
      searchTerm === "" ||
      category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    // Level filter
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(category.level)

    // Tags filter
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => category.tags.includes(tag))

    return matchesSearch && matchesLevel && matchesTags
  })

  // Toggle level selection
  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
  }

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Training Categories" description="Browse and enroll in Red Cross training programs" />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search training categories..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2 w-1/2 md:w-auto">
                  <Filter className="h-4 w-4" />
                  <span>Level</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={selectedLevels.includes("Beginner")}
                  onCheckedChange={() => toggleLevel("Beginner")}
                >
                  Beginner
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedLevels.includes("Intermediate")}
                  onCheckedChange={() => toggleLevel("Intermediate")}
                >
                  Intermediate
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedLevels.includes("Advanced")}
                  onCheckedChange={() => toggleLevel("Advanced")}
                >
                  Advanced
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2 w-1/2 md:w-auto">
                  <Filter className="h-4 w-4" />
                  <span>Tags</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {allTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Categories</TabsTrigger>
            <TabsTrigger value="certification">Certification Courses</TabsTrigger>
            <TabsTrigger value="popular">Most Popular</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <Card key={category.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-primary/10 rounded-md">{category.icon}</div>
                        <Badge variant={category.certification ? "default" : "outline"}>
                          {category.certification ? "Certification" : "Training"}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Level</span>
                          <span className="font-medium">{category.level}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{category.duration}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Modules</span>
                          <span className="font-medium">{category.modules}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Enrolled</span>
                          <span className="font-medium">{category.enrolled.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {category.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 border-t">
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" asChild>
                          <Link href={`/categories/${category.id}`}>Details</Link>
                        </Button>
                        <Button className="flex-1" asChild>
                          <Link href={`/categories/${category.id}/enroll`}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Enroll
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No categories found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certification" className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories
                .filter((category) => category.certification)
                .map((category) => (
                  <Card key={category.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-primary/10 rounded-md">{category.icon}</div>
                        <Badge>Certification</Badge>
                      </div>
                      <CardTitle className="mt-2">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Level</span>
                          <span className="font-medium">{category.level}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{category.duration}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Modules</span>
                          <span className="font-medium">{category.modules}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Enrolled</span>
                          <span className="font-medium">{category.enrolled.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {category.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 border-t">
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" asChild>
                          <Link href={`/categories/${category.id}`}>Details</Link>
                        </Button>
                        <Button className="flex-1" asChild>
                          <Link href={`/categories/${category.id}/enroll`}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Enroll
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories
                .sort((a, b) => b.enrolled - a.enrolled)
                .slice(0, 6)
                .map((category) => (
                  <Card key={category.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-primary/10 rounded-md">{category.icon}</div>
                        <Badge variant={category.certification ? "default" : "outline"}>
                          {category.certification ? "Certification" : "Training"}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Level</span>
                          <span className="font-medium">{category.level}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{category.duration}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Modules</span>
                          <span className="font-medium">{category.modules}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Enrolled</span>
                          <span className="font-medium">{category.enrolled.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {category.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 border-t">
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" asChild>
                          <Link href={`/categories/${category.id}`}>Details</Link>
                        </Button>
                        <Button className="flex-1" asChild>
                          <Link href={`/categories/${category.id}/enroll`}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Enroll
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
