"use client"

import { useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Switch } from "~/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { DashboardHeader } from "~/components/dashboard-header"
import { useToast } from "~/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [theme, setTheme] = useState("system")
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveSettings = (section: string) => {
    setIsSaving(true)

    // Simulate API call with promise toast
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: {
          title: "Saving changes",
          description: `Updating your ${section.toLowerCase()} settings...`
        },
        success: {
          title: "Settings saved",
          description: `Your ${section.toLowerCase()} settings have been updated successfully.`
        },
        error: {
          title: "Failed to save",
          description: "There was an error saving your settings. Please try again."
        }
      }
    ).finally(() => setIsSaving(false))
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast({
      title: "Theme updated",
      description: `Theme changed to ${newTheme}.`,
      variant: "info"
    })
  }

  const handleDownloadData = () => {
    toast({
      title: "Preparing data",
      description: "Your data is being prepared for download. This may take a moment.",
      variant: "info"
    })

    // Simulate a delay for data preparation
    setTimeout(() => {
      toast({
        title: "Data ready",
        description: "Your data has been prepared and is ready to download.",
        variant: "success"
      })
      // In a real app, this would trigger the actual download
    }, 2000)
  }

  const handleToggleNotification = (setting: string, enabled: boolean) => {
    toast({
      title: enabled ? `${setting} enabled` : `${setting} disabled`,
      description: enabled 
        ? `You will now receive ${setting.toLowerCase()} notifications.` 
        : `You will no longer receive ${setting.toLowerCase()} notifications.`,
      variant: enabled ? "success" : "info"
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Settings" description="Manage your account settings and preferences" />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input id="first-name" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input id="last-name" defaultValue="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="john.doe@example.com" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleSaveSettings("Profile")} 
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Learning Preferences</CardTitle>
                  <CardDescription>Customize your learning experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="study-reminder">Daily study reminder</Label>
                    <Select defaultValue="18">
                      <SelectTrigger id="study-reminder">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8:00 AM</SelectItem>
                        <SelectItem value="12">12:00 PM</SelectItem>
                        <SelectItem value="18">6:00 PM</SelectItem>
                        <SelectItem value="21">9:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cards-per-day">Cards to review per day</Label>
                    <Select defaultValue="20">
                      <SelectTrigger id="cards-per-day">
                        <SelectValue placeholder="Select amount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 cards</SelectItem>
                        <SelectItem value="20">20 cards</SelectItem>
                        <SelectItem value="50">50 cards</SelectItem>
                        <SelectItem value="100">100 cards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekend-reminders">Weekend reminders</Label>
                    <Switch id="weekend-reminders" defaultChecked />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleSaveSettings("Learning Preferences")}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>Customize the appearance of the application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup 
                    defaultValue={theme} 
                    onValueChange={handleThemeChange} 
                    className="grid grid-cols-3 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                      <Label
                        htmlFor="theme-light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                      >
                        <Sun className="mb-3 h-6 w-6" />
                        Light
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                      <Label
                        htmlFor="theme-dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                      >
                        <Moon className="mb-3 h-6 w-6" />
                        Dark
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                      <Label
                        htmlFor="theme-system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="mb-3 flex h-6 w-6 items-center justify-center">
                          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </div>
                        System
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleSaveSettings("Theme")}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="study-notifications">Study reminders</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications for daily study reminders</p>
                    </div>
                    <Switch 
                      id="study-notifications" 
                      defaultChecked 
                      onCheckedChange={(checked) => handleToggleNotification("Study reminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="game-notifications">Game invitations</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when invited to multiplayer games
                      </p>
                    </div>
                    <Switch 
                      id="game-notifications" 
                      defaultChecked 
                      onCheckedChange={(checked) => handleToggleNotification("Game invitations", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="achievement-notifications">Achievements</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications when you earn achievements</p>
                    </div>
                    <Switch 
                      id="achievement-notifications" 
                      defaultChecked 
                      onCheckedChange={(checked) => handleToggleNotification("Achievement", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly summary emails about your progress</p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      onCheckedChange={(checked) => handleToggleNotification("Email", checked)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleSaveSettings("Notification")}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Manage your privacy and data settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="public-profile">Public profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your profile and learning progress
                      </p>
                    </div>
                    <Switch 
                      id="public-profile" 
                      onCheckedChange={(checked) => handleToggleNotification("Public profile visibility", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="share-activity">Share activity</Label>
                      <p className="text-sm text-muted-foreground">Share your learning activity with friends</p>
                    </div>
                    <Switch 
                      id="share-activity" 
                      defaultChecked 
                      onCheckedChange={(checked) => handleToggleNotification("Activity sharing", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="data-collection">Data collection</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anonymous data collection to improve the platform
                      </p>
                    </div>
                    <Switch 
                      id="data-collection" 
                      defaultChecked 
                      onCheckedChange={(checked) => handleToggleNotification("Data collection", checked)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleDownloadData}>Download My Data</Button>
                  <Button 
                    onClick={() => handleSaveSettings("Privacy")}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
