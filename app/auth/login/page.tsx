"use client";

import type React from "react";

import { Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/hooks/use-toast";

export default function LoginPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			// Simulate API call delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In a real app, we'd handle authentication here
			toast({
				title: "Login successful",
				description: "Welcome back! You've been logged in.",
				variant: "success",
			});

			router.push("/dashboard");
		} catch (error) {
			toast({
				title: "Login failed",
				description: "Please check your credentials and try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			// Simulate API call delay
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// In a real app, we'd handle registration here
			toast({
				title: "Registration successful",
				description: "Your account has been created! You can now log in.",
				variant: "success",
			});

			// Switch to login tab after successful registration
			document.querySelector('[data-value="login"]')?.click();
		} catch (error) {
			toast({
				title: "Registration failed",
				description:
					"There was an error creating your account. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSocialLogin = (provider: string) => {
		toast.promise(
			// This would be your actual authentication logic
			new Promise((resolve) => setTimeout(resolve, 2000)),
			{
				loading: {
					title: `Signing in with ${provider}`,
					description: "Please wait while we connect to your account...",
				},
				success: {
					title: "Login successful",
					description: `You've successfully signed in with ${provider}.`,
				},
				error: {
					title: "Authentication failed",
					description: `Could not authenticate with ${provider}. Please try again.`,
				},
			},
		);
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
			<div className="w-full max-w-md">
				<div className="mb-6 text-center sm:mb-8">
					<div className="flex justify-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-600 sm:h-16 sm:w-16">
							<Shield className="h-8 w-8 text-white sm:h-10 sm:w-10" />
						</div>
					</div>
					<h1 className="mt-3 font-bold text-2xl sm:mt-4 sm:text-3xl">
						Red Cross Training Hub
					</h1>
					<p className="mt-1 text-muted-foreground text-sm sm:mt-2">
						Educational platform for First Responders and First Aiders
					</p>
				</div>

				<Tabs defaultValue="login" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="login" data-value="login">
							Login
						</TabsTrigger>
						<TabsTrigger value="register">Register</TabsTrigger>
					</TabsList>

					<TabsContent value="login">
						<Card>
							<CardHeader>
								<CardTitle>Welcome back</CardTitle>
								<CardDescription>
									Sign in to your account to continue your training
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleLogin} className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											placeholder="name@example.com"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="password">Password</Label>
										<div className="relative">
											<Input
												id="password"
												type={showPassword ? "text" : "password"}
												placeholder="••••••••"
												required
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute top-0 right-0 h-full px-3"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
												<span className="sr-only">
													{showPassword ? "Hide password" : "Show password"}
												</span>
											</Button>
										</div>
									</div>
									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading ? "Signing in..." : "Sign in"}
									</Button>
								</form>

								<div className="mt-4 text-center text-sm">
									<Link
										href="/auth/forgot-password"
										className="text-primary hover:underline"
									>
										Forgot your password?
									</Link>
								</div>

								<div className="relative mt-6">
									<div className="absolute inset-0 flex items-center">
										<Separator className="w-full" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-card px-2 text-muted-foreground">
											Or continue with
										</span>
									</div>
								</div>

								<div className="mt-6 grid grid-cols-2 gap-4">
									<Button
										variant="outline"
										className="w-full"
										onClick={() => handleSocialLogin("Google")}
										disabled={isLoading}
									>
										Google
									</Button>
									<Button
										variant="outline"
										className="w-full"
										onClick={() => handleSocialLogin("Microsoft")}
										disabled={isLoading}
									>
										Microsoft
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="register">
						<Card>
							<CardHeader>
								<CardTitle>Create an account</CardTitle>
								<CardDescription>
									Join our training platform to enhance your first aid skills
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form className="space-y-4" onSubmit={handleRegister}>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="first-name">First name</Label>
											<Input id="first-name" placeholder="John" required />
										</div>
										<div className="space-y-2">
											<Label htmlFor="last-name">Last name</Label>
											<Input id="last-name" placeholder="Doe" required />
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email-register">Email</Label>
										<Input
											id="email-register"
											type="email"
											placeholder="name@example.com"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="password-register">Password</Label>
										<div className="relative">
											<Input
												id="password-register"
												type={showPassword ? "text" : "password"}
												placeholder="••••••••"
												required
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute top-0 right-0 h-full px-3"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
												<span className="sr-only">
													{showPassword ? "Hide password" : "Show password"}
												</span>
											</Button>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="role">Your Role</Label>
										<select
											id="role"
											className="w-full rounded-md border border-input bg-background px-3 py-2"
										>
											<option value="volunteer">Volunteer</option>
											<option value="first-responder">First Responder</option>
											<option value="first-aider">First Aider</option>
											<option value="instructor">Instructor</option>
										</select>
									</div>
									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading ? "Creating account..." : "Create account"}
									</Button>
								</form>

								<div className="relative mt-6">
									<div className="absolute inset-0 flex items-center">
										<Separator className="w-full" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-card px-2 text-muted-foreground">
											Or continue with
										</span>
									</div>
								</div>

								<div className="mt-6 grid grid-cols-2 gap-4">
									<Button
										variant="outline"
										className="w-full"
										onClick={() => handleSocialLogin("Google")}
										disabled={isLoading}
									>
										Google
									</Button>
									<Button
										variant="outline"
										className="w-full"
										onClick={() => handleSocialLogin("Microsoft")}
										disabled={isLoading}
									>
										Microsoft
									</Button>
								</div>
							</CardContent>
							<CardFooter className="text-center text-sm">
								By creating an account, you agree to our{" "}
								<Link href="/terms" className="text-primary hover:underline">
									Terms of Service
								</Link>{" "}
								and{" "}
								<Link href="/privacy" className="text-primary hover:underline">
									Privacy Policy
								</Link>
							</CardFooter>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
