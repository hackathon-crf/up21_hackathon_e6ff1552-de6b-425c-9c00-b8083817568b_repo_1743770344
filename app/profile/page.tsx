"use client";

import type React from "react";

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

interface Certificate {
	id: string;
	title: string;
	issuedDate: string;
	expiryDate: string;
	status: "Valid" | "Expiring Soon" | "Expired";
	icon: React.ReactNode;
}

interface BadgeType {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	date: string;
}

interface Course {
	id: string;
	title: string;
	progress: number;
	lastAccessed: string;
	icon: React.ReactNode;
}

export default function ProfilePage() {
	const toast = useToast();
	const [isEditing, setIsEditing] = useState(false);

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
	};

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
	];

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
	];

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
	];

	const handleSaveProfile = () => {
		// In a real app, this would save the profile data
		setIsEditing(false);
		toast.success({
			title: "Profile updated",
			description: "Your profile information has been saved successfully.",
		});
	};

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
										<AvatarImage src={user.avatar} alt={user.name} />
										<AvatarFallback>JD</AvatarFallback>
									</Avatar>
									<h2 className="font-bold text-2xl">{user.name}</h2>
									<p className="text-muted-foreground text-sm">{user.role}</p>
									<UIBadge className="mt-2">Active Member</UIBadge>

									<div className="mt-6 w-full space-y-2">
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
										<h3 className="mb-2 font-medium text-sm">About</h3>
										<p className="text-muted-foreground text-sm">{user.bio}</p>
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
													<Label htmlFor="name">Full Name</Label>
													<Input id="name" defaultValue={user.name} />
												</div>
												<div className="space-y-2">
													<Label htmlFor="email">Email</Label>
													<Input
														id="email"
														type="email"
														defaultValue={user.email}
													/>
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
									<div className="font-bold text-xl sm:text-3xl">24</div>
									<p className="text-muted-foreground text-xs sm:text-sm">
										Courses Completed
									</p>
								</div>
								<div className="flex flex-col items-center justify-center rounded-lg bg-muted p-3 sm:p-4">
									<div className="font-bold text-xl sm:text-3xl">156</div>
									<p className="text-muted-foreground text-xs sm:text-sm">
										Training Hours
									</p>
								</div>
								<div className="flex flex-col items-center justify-center rounded-lg bg-muted p-3 sm:p-4">
									<div className="font-bold text-xl sm:text-3xl">12</div>
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
