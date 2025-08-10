"use client";

import { Bell, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { api } from "~/trpc/react";

import { LanguageSwitcher } from "~/components/language-switcher";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/hooks/use-toast";

export default function SettingsPage() {
	const { toast } = useToast();
	const t = useTranslations("common");

	// tRPC hooks
	const { data: preferences, isLoading } = api.preferences.get.useQuery();
	const updatePreferences = api.preferences.update.useMutation({
		onSuccess: () => {
			toast({
				title: "Settings saved",
				description: "Your settings have been updated successfully.",
				variant: "success",
			});
		},
		onError: (error) => {
			toast({
				title: "Failed to save",
				description:
					error.message ||
					"There was an error saving your settings. Please try again.",
				variant: "destructive",
			});
		},
	});

	// Local state for form values
	const [localPrefs, setLocalPrefs] = useState({
		study_reminder_time: 18,
		cards_per_day: 20,
		weekend_reminders: true,
		theme: "system" as "light" | "dark" | "system",
		study_notifications: true,
		achievement_notifications: true,
		email_notifications: false,
		share_activity: true,
		data_collection: true,
	});

	// Update local state when preferences are loaded
	useEffect(() => {
		if (preferences) {
			setLocalPrefs(preferences);
		}
	}, [preferences]);

	const handleSaveSettings = () => {
		updatePreferences.mutate(localPrefs);
	};

	const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
		setLocalPrefs((prev) => ({ ...prev, theme: newTheme }));
		toast({
			title: "Theme updated",
			description: `Theme changed to ${newTheme}.`,
			variant: "info",
		});
	};

	const handleLearningPrefChange = (
		key: string,
		value: string | number | boolean,
	) => {
		setLocalPrefs((prev) => ({ ...prev, [key]: value }));
	};

	const handleNotificationChange = (key: string, enabled: boolean) => {
		setLocalPrefs((prev) => ({ ...prev, [key]: enabled }));
		const setting = key
			.replace("_", " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
		toast({
			title: enabled ? `${setting} enabled` : `${setting} disabled`,
			description: enabled
				? `You will now receive ${setting.toLowerCase()} notifications.`
				: `You will no longer receive ${setting.toLowerCase()} notifications.`,
			variant: enabled ? "success" : "info",
		});
	};

	const handlePrivacyChange = (key: string, enabled: boolean) => {
		setLocalPrefs((prev) => ({ ...prev, [key]: enabled }));
		const setting = key
			.replace("_", " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
		toast({
			title: enabled ? `${setting} enabled` : `${setting} disabled`,
			description: enabled
				? `${setting} is now enabled.`
				: `${setting} is now disabled.`,
			variant: enabled ? "success" : "info",
		});
	};

	const handleDownloadData = () => {
		toast({
			title: "Preparing data",
			description:
				"Your data is being prepared for download. This may take a moment.",
			variant: "info",
		});

		// Simulate a delay for data preparation
		setTimeout(() => {
			toast({
				title: "Data ready",
				description: "Your data has been prepared and is ready to download.",
				variant: "success",
			});
			// In a real app, this would trigger the actual download
		}, 2000);
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="mt-2 text-muted-foreground">Loading settings...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			{/* Custom Settings Header */}
			<div className="sticky top-0 z-10 border-b bg-background">
				<div className="flex flex-col px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
					<div className="mb-2 sm:mb-0">
						<h1 className="font-bold text-xl sm:text-2xl">Settings</h1>
						<p className="text-muted-foreground text-xs sm:text-sm">
							Manage your account settings and preferences
						</p>
					</div>
					<div className="ml-auto flex items-center gap-2">
						<LanguageSwitcher />
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8 sm:h-9 sm:w-9"
						>
							<Bell className="h-4 w-4" />
							<span className="sr-only">{t("notifications")}</span>
						</Button>
						<ModeToggle />
					</div>
				</div>
			</div>

			<main className="flex-1 p-6">
				<div className="mx-auto max-w-4xl space-y-6">
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
									<CardTitle>Learning Preferences</CardTitle>
									<CardDescription>
										Customize your learning experience
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="study-reminder">Daily study reminder</Label>
										<Select
											value={localPrefs.study_reminder_time.toString()}
											onValueChange={(value) =>
												handleLearningPrefChange(
													"study_reminder_time",
													Number.parseInt(value),
												)
											}
										>
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
										<Label htmlFor="cards-per-day">
											Cards to review per day
										</Label>
										<Select
											value={localPrefs.cards_per_day.toString()}
											onValueChange={(value) =>
												handleLearningPrefChange(
													"cards_per_day",
													Number.parseInt(value),
												)
											}
										>
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
										<Switch
											id="weekend-reminders"
											checked={localPrefs.weekend_reminders}
											onCheckedChange={(checked) =>
												handleLearningPrefChange("weekend_reminders", checked)
											}
										/>
									</div>
								</CardContent>
								<CardFooter>
									<Button
										onClick={handleSaveSettings}
										disabled={updatePreferences.isPending}
									>
										{updatePreferences.isPending ? "Saving..." : "Save Changes"}
									</Button>
								</CardFooter>
							</Card>
						</TabsContent>

						<TabsContent value="appearance" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Theme</CardTitle>
									<CardDescription>
										Customize the appearance of the application
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<RadioGroup
										value={localPrefs.theme}
										onValueChange={handleThemeChange}
										className="grid grid-cols-3 gap-4"
									>
										<div>
											<RadioGroupItem
												value="light"
												id="theme-light"
												className="sr-only"
											/>
											<Label
												htmlFor="theme-light"
												className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
											>
												<Sun className="mb-3 h-6 w-6" />
												Light
											</Label>
										</div>
										<div>
											<RadioGroupItem
												value="dark"
												id="theme-dark"
												className="sr-only"
											/>
											<Label
												htmlFor="theme-dark"
												className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
											>
												<Moon className="mb-3 h-6 w-6" />
												Dark
											</Label>
										</div>
										<div>
											<RadioGroupItem
												value="system"
												id="theme-system"
												className="sr-only"
											/>
											<Label
												htmlFor="theme-system"
												className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
											>
												<div className="mb-3 flex h-6 w-6 items-center justify-center">
													<Sun className="dark:-rotate-90 h-4 w-4 rotate-0 scale-100 transition-all dark:scale-0" />
													<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
												</div>
												System
											</Label>
										</div>
									</RadioGroup>
								</CardContent>
								<CardFooter>
									<Button
										onClick={handleSaveSettings}
										disabled={updatePreferences.isPending}
									>
										{updatePreferences.isPending ? "Saving..." : "Save Changes"}
									</Button>
								</CardFooter>
							</Card>
						</TabsContent>

						<TabsContent value="notifications" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Notification Settings</CardTitle>
									<CardDescription>
										Manage how you receive notifications
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="study-notifications">
												Study reminders
											</Label>
											<p className="text-muted-foreground text-sm">
												Receive notifications for daily study reminders
											</p>
										</div>
										<Switch
											id="study-notifications"
											checked={localPrefs.study_notifications}
											onCheckedChange={(checked) =>
												handleNotificationChange("study_notifications", checked)
											}
										/>
									</div>
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="achievement-notifications">
												Achievements
											</Label>
											<p className="text-muted-foreground text-sm">
												Receive notifications when you earn achievements
											</p>
										</div>
										<Switch
											id="achievement-notifications"
											checked={localPrefs.achievement_notifications}
											onCheckedChange={(checked) =>
												handleNotificationChange(
													"achievement_notifications",
													checked,
												)
											}
										/>
									</div>
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="email-notifications">
												Email notifications
											</Label>
											<p className="text-muted-foreground text-sm">
												Receive weekly summary emails about your progress
											</p>
										</div>
										<Switch
											id="email-notifications"
											checked={localPrefs.email_notifications}
											onCheckedChange={(checked) =>
												handleNotificationChange("email_notifications", checked)
											}
										/>
									</div>
								</CardContent>
								<CardFooter>
									<Button
										onClick={handleSaveSettings}
										disabled={updatePreferences.isPending}
									>
										{updatePreferences.isPending ? "Saving..." : "Save Changes"}
									</Button>
								</CardFooter>
							</Card>
						</TabsContent>

						<TabsContent value="privacy" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Privacy Settings</CardTitle>
									<CardDescription>
										Manage your privacy and data settings
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="share-activity">Share activity</Label>
											<p className="text-muted-foreground text-sm">
												Share your learning activity with friends
											</p>
										</div>
										<Switch
											id="share-activity"
											checked={localPrefs.share_activity}
											onCheckedChange={(checked) =>
												handlePrivacyChange("share_activity", checked)
											}
										/>
									</div>
									<div className="flex items-center justify-between">
										<div className="space-y-0.5">
											<Label htmlFor="data-collection">Data collection</Label>
											<p className="text-muted-foreground text-sm">
												Allow anonymous data collection to improve the platform
											</p>
										</div>
										<Switch
											id="data-collection"
											checked={localPrefs.data_collection}
											onCheckedChange={(checked) =>
												handlePrivacyChange("data_collection", checked)
											}
										/>
									</div>
								</CardContent>
								<CardFooter className="flex justify-between">
									<Button variant="outline" onClick={handleDownloadData}>
										Download My Data
									</Button>
									<Button
										onClick={handleSaveSettings}
										disabled={updatePreferences.isPending}
									>
										{updatePreferences.isPending ? "Saving..." : "Save Changes"}
									</Button>
								</CardFooter>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</main>
		</div>
	);
}
