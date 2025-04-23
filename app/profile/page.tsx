"use client";

import {
	Award,
	BookOpen,
	Calendar,
	Edit,
	Heart,
	Mail,
	MapPin,
	Phone,
	Shield,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";

import { DashboardHeader } from "~/components/dashboard-header";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge as UIBadge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

export default function ProfilePage() {
	const toast = useToast();
	const [isEditing, setIsEditing] = useState(false);

	// Fetch user profile data
	const { data: profile, isLoading } = api.user.getDetailedProfile.useQuery();

	// Compute initials for avatar fallback
	const initials = profile?.email
		? profile.email.substring(0, 2).toUpperCase()
		: "??";

	const handleSaveProfile = () => {
		// TODO: Implement profile update mutation
		setIsEditing(false);
		toast.success({
			title: "Profile updated",
			description: "Your profile information has been saved successfully.",
		});
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen flex-col">
				<DashboardHeader
					title="Profile"
					description="View and manage your personal information"
				/>
				<main className="flex-1 p-6">
					<div className="mx-auto max-w-6xl space-y-6">
						<div className="grid gap-6 md:grid-cols-3">
							<Card className="md:col-span-1">
								<CardContent className="pt-6">
									<div className="flex flex-col items-center text-center">
										<div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
										<div className="mt-4 h-6 w-32 animate-pulse rounded bg-muted" />
										<div className="mt-2 h-4 w-24 animate-pulse rounded bg-muted" />
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			<DashboardHeader
				title="Profile"
				description="View and manage your personal information"
			/>

			<main className="flex-1 p-6">
				<div className="mx-auto max-w-6xl space-y-6">
					<div className="grid gap-6 md:grid-cols-3">
						<Card className="md:col-span-1">
							<CardContent className="pt-6">
								<div className="flex flex-col items-center text-center">
									<Avatar className="mb-4 h-24 w-24">
										<AvatarImage src="/avatar.svg" alt={profile?.email} />
										<AvatarFallback>{initials}</AvatarFallback>
									</Avatar>
									<h2 className="font-bold text-2xl">{profile?.email}</h2>
									<p className="text-muted-foreground text-sm">
										First Responder
									</p>
									<UIBadge className="mt-2">
										{profile?.emailVerified
											? "Verified Member"
											: "Pending Verification"}
									</UIBadge>

									<div className="mt-6 w-full space-y-2">
										<div className="flex items-center gap-2 text-sm">
											<Mail className="h-4 w-4 text-muted-foreground" />
											<span>{profile?.email}</span>
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<span>
												Member since{" "}
												{profile?.joinDate
													? new Date(profile.joinDate).toLocaleDateString()
													: "Unknown"}
											</span>
										</div>
									</div>

									<Separator className="my-6" />

									<div className="w-full text-left">
										<h3 className="mb-2 font-medium text-sm">About</h3>
										<p className="text-muted-foreground text-sm">
											Red Cross volunteer dedicated to helping others and
											teaching life-saving skills.
										</p>
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
												<DialogDescription>
													Update your personal information
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4 py-4">
												<div className="space-y-2">
													<Label htmlFor="email">Email</Label>
													<Input
														id="email"
														type="email"
														defaultValue={profile?.email}
														disabled
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="bio">Bio</Label>
													<Textarea
														id="bio"
														defaultValue="Red Cross volunteer dedicated to helping others and teaching life-saving skills."
													/>
												</div>
											</div>
											<DialogFooter>
												<Button
													variant="outline"
													onClick={() => setIsEditing(false)}
												>
													Cancel
												</Button>
												<Button onClick={handleSaveProfile}>
													Save Changes
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle>Training Statistics</CardTitle>
								<CardDescription>
									Your training activity and achievements
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
								<div className="flex flex-col items-center justify-center rounded-lg bg-muted p-3 sm:p-4">
									<div className="font-bold text-xl sm:text-3xl">
										{profile?.stats.coursesCompleted ?? 0}
									</div>
									<p className="text-muted-foreground text-xs sm:text-sm">
										Courses Completed
									</p>
								</div>
								<div className="flex flex-col items-center justify-center rounded-lg bg-muted p-3 sm:p-4">
									<div className="font-bold text-xl sm:text-3xl">
										{profile?.stats.trainingHours ?? 0}
									</div>
									<p className="text-muted-foreground text-xs sm:text-sm">
										Training Hours
									</p>
								</div>
								<div className="flex flex-col items-center justify-center rounded-lg bg-muted p-3 sm:p-4">
									<div className="font-bold text-xl sm:text-3xl">
										{profile?.stats.badgesEarned ?? 0}
									</div>
									<p className="text-muted-foreground text-xs sm:text-sm">
										Badges Earned
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
