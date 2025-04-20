"use client";

import type React from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "~/components/auth/AuthProvider";
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
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";
import {
	type LoginFormValues,
	type RegisterFormValues,
	calculatePasswordStrength,
	loginSchema,
	registerSchema,
} from "~/lib/validation/auth";

export default function LoginPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [debugMode, setDebugMode] = useState(false);
	const [debugLogs, setDebugLogs] = useState<string[]>([]);
	const searchParams = useSearchParams();
	const { signIn } = useAuth();

	// React Hook Form for login
	const loginForm = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	// React Hook Form for registration
	const registerForm = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	// Password strength state
	const [passwordStrength, setPasswordStrength] = useState(0);
	const password = registerForm.watch("password");

	// Update password strength when password changes
	useEffect(() => {
		if (password) {
			setPasswordStrength(calculatePasswordStrength(password));
		} else {
			setPasswordStrength(0);
		}
	}, [password]);

	// Function to get color based on password strength
	const getPasswordStrengthColor = (strength: number) => {
		if (strength < 30) return "bg-red-500";
		if (strength < 60) return "bg-yellow-500";
		if (strength < 80) return "bg-blue-500";
		return "bg-green-500";
	};

	// Function to get label based on password strength
	const getPasswordStrengthText = (strength: number) => {
		if (strength < 30) return "Weak";
		if (strength < 60) return "Fair";
		if (strength < 80) return "Good";
		return "Strong";
	};

	// Check for debug mode on mount
	useEffect(() => {
		const isDebug = searchParams?.get("debug") === "true";
		setDebugMode(isDebug);

		if (isDebug) {
			// Add a note to logs that debug mode is active
			addDebugLog("Debug mode activated");
		}
	}, [searchParams]);

	// Function to add debug logs that will be visible on screen when debug=true
	const addDebugLog = (message: string, data?: unknown) => {
		const logEntry = `${new Date().toISOString()}: ${message}${data ? ` ${JSON.stringify(data)}` : ""}`;
		setDebugLogs((prev) => [logEntry, ...prev.slice(0, 99)]);
	};

	// Enhanced logger that ensures visibility of critical logs
	const logger = {
		log: (message: string, data?: unknown) => {
			console.log(message, data);
			if (debugMode) addDebugLog(`LOG: ${message}`, data);
		},
		error: (message: string, data?: unknown) => {
			console.error(message, data);
			if (debugMode) addDebugLog(`ERROR: ${message}`, data);
		},
		critical: (message: string, data?: unknown) => {
			// Use multiple console methods to maximize visibility
			console.log(`%c${message}`, "color: red; font-weight: bold", data);
			console.error(message, data);
			console.warn(message, data);
			// Always add critical logs to debug display regardless of debug mode
			addDebugLog(`CRITICAL: ${message}`, data);

			// Also store critical logs in localStorage for persistence
			try {
				const existingLogs = JSON.parse(
					localStorage.getItem("auth_critical_logs") || "[]",
				);
				existingLogs.unshift({
					timestamp: new Date().toISOString(),
					message,
					data,
				});
				localStorage.setItem(
					"auth_critical_logs",
					JSON.stringify(existingLogs.slice(0, 20)),
				); // Keep last 20 logs
			} catch (e) {
				console.error("Failed to save critical log to localStorage");
			}
		},
	};

	// Login form submission handler
	const onLoginSubmit = async (data: LoginFormValues) => {
		setIsLoading(true);

		// logger.critical("AUTH CRITICAL: Form submission started", {
		//   timestamp: new Date().toISOString(),
		//   hasEmail: !!data.email.trim(),
		//   hasPassword: !!data.password.trim()
		// });

		try {
			// If we have the real auth system available, use it
			if (signIn) {
				logger.log("🔒 AUTH UI [Login]: Attempting to sign in with Supabase", {
					emailHint: `${data.email.substring(0, 3)}...`,
				});

				const authResult = await signIn(data.email, data.password);

				// Log the auth result details
				logger.log("🔒 AUTH UI [Login]: Auth result received", {
					success: authResult?.success,
					hasMessage: !!authResult?.message,
					hasUser: !!authResult?.user,
					hasSession: !!authResult?.session,
				});

				if (!authResult || !authResult.success) {
					logger.error("🔒 AUTH UI [Login]: Authentication failed", {
						errorMessage: authResult?.message,
					});

					toast({
						title: "Login failed",
						description:
							authResult?.message ||
							"Please check your credentials and try again.",
						variant: "destructive",
					});
					return;
				}

				// Verify authentication with server
				logger.log("🔒 AUTH UI [Login]: Verifying authentication with server");
				try {
					const authCheckResponse = await fetch("/api/auth/check", {
						cache: "no-store",
						headers: {
							"Cache-Control": "no-cache",
							"x-debug-timestamp": new Date().toISOString(),
						},
					});

					const authState = await authCheckResponse.json();

					logger.log("🔒 AUTH UI [Login]: Server verification response", {
						authenticated: authState.authenticated,
						status: authCheckResponse.status,
						hasUser: !!authState.user,
					});

					if (!authState.authenticated) {
						logger.critical(
							"AUTH CRITICAL: Server rejected authentication despite client success",
							{
								serverMessage: authState.message || authState.error,
								hasSession: !!authState.session,
								hasUser: !!authState.user,
								statusCode: authCheckResponse.status,
							},
						);

						toast({
							title: "Authentication error",
							description:
								"Server could not verify your session. Please try again.",
							variant: "destructive",
						});
						return;
					}

					// Authentication successful
					logger.log("🔒 AUTH UI [Login]: Authentication fully verified");

					toast({
						title: "Login successful",
						description: "Welcome back! You've been logged in.",
						variant: "success",
					});

					router.push("/dashboard");
				} catch (checkError) {
					logger.critical(
						"AUTH CRITICAL: Error during server verification",
						checkError,
					);

					toast({
						title: "Verification error",
						description:
							"Could not verify your authentication with the server.",
						variant: "destructive",
					});
				}
			} else {
				// Fallback to simulation if no auth provider
				logger.critical(
					"AUTH CRITICAL: Using simulated auth flow - real auth provider missing",
				);

				// Simulate API call delay
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// In a real app, we'd handle authentication here
				toast({
					title: "Login successful",
					description: "Welcome back! You've been logged in.",
					variant: "success",
				});

				router.push("/dashboard");
			}
		} catch (error) {
			logger.critical("AUTH CRITICAL: Unhandled exception during login", {
				error: error instanceof Error ? error.message : String(error),
			});

			toast({
				title: "Login failed",
				description: "Please check your credentials and try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
			logger.log("🔒 AUTH UI [Login]: Login process completed", {
				timestamp: new Date().toISOString(),
			});
		}
	};

	// Register form submission handler
	const onRegisterSubmit = async (data: RegisterFormValues) => {
		setIsLoading(true);

		logger.critical("AUTH CRITICAL: Registration submission started", {
			timestamp: new Date().toISOString(),
			hasEmail: !!data.email.trim(),
			hasName: !!data.firstName.trim() && !!data.lastName.trim(),
			passwordStrength: passwordStrength,
		});

		try {
			// Simulate API call delay
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Implement rate limiting check (demo)
			const ipAddress = "192.168.1.1"; // Normally would get this from the request
			const registrationAttempts =
				sessionStorage.getItem("registration_attempts") || "0";
			const attempts = Number.parseInt(registrationAttempts, 10) + 1;
			sessionStorage.setItem("registration_attempts", attempts.toString());

			// Apply rate limiting (for demo purposes)
			if (attempts > 5) {
				const lastAttemptTime =
					sessionStorage.getItem("last_registration_attempt") || "0";
				const cooldownTime =
					Number.parseInt(lastAttemptTime, 10) + 30 * 60 * 1000; // 30 minutes

				if (Date.now() < cooldownTime) {
					const minutesRemaining = Math.ceil(
						(cooldownTime - Date.now()) / (60 * 1000),
					);

					logger.error("🔒 AUTH UI [Register]: Rate limit exceeded", {
						attempts,
						minutesRemaining,
						ipAddress,
					});

					toast({
						title: "Too many attempts",
						description: `Please try again after ${minutesRemaining} minutes.`,
						variant: "destructive",
					});

					setIsLoading(false);
					return;
				}
				// Reset counter after cooldown period
				sessionStorage.setItem("registration_attempts", "1");
			}

			// Record attempt timestamp
			sessionStorage.setItem(
				"last_registration_attempt",
				Date.now().toString(),
			);

			// In a real app, we would send the data to the server here
			// and handle email verification
			logger.log("🔒 AUTH UI [Register]: Account created successfully", {
				email: data.email,
				fullName: `${data.firstName} ${data.lastName}`,
			});

			toast({
				title: "Registration successful",
				description:
					"A verification link has been sent to your email address. Please verify your account to continue.",
				variant: "success",
			});

			// Switch to login tab after successful registration
			(document.querySelector('[data-value="login"]') as HTMLElement)?.click();
		} catch (error) {
			logger.critical(
				"AUTH CRITICAL: Unhandled exception during registration",
				{
					error: error instanceof Error ? error.message : String(error),
				},
			);

			toast({
				title: "Registration failed",
				description:
					"There was an error creating your account. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
			logger.log("🔒 AUTH UI [Register]: Registration process completed", {
				timestamp: new Date().toISOString(),
			});
		}
	};

	const handleSocialLogin = (provider: string) => {
		toast
			.promise(
				// This would be your actual authentication logic
				new Promise<void>((resolve, reject) => {
					// Simulate successful login 80% of the time
					if (Math.random() > 0.2) {
						setTimeout(resolve, 2000);
					} else {
						setTimeout(() => reject(new Error("Authentication failed")), 2000);
					}
				}),
				{
					loading: {
						title: `Signing in with ${provider}`,
						description: "Please wait while we connect to your account...",
					},
					success: () => ({
						title: "Login successful",
						description: `You've successfully signed in with ${provider}.`,
					}),
					error: () => ({
						title: "Authentication failed",
						description: `Could not authenticate with ${provider}. Please try again.`,
					}),
				},
			)
			.then(() => {
				// Navigate to dashboard after successful login
				router.push("/dashboard");
			})
			.catch(() => {
				// Error is already handled by the toast
			});
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
			<div className="w-full max-w-md">
				<Tabs defaultValue="login" className="w-full">
					<TabsList className="mb-6 grid w-full grid-cols-2">
						<TabsTrigger value="login">Login</TabsTrigger>
						<TabsTrigger value="register">Register</TabsTrigger>
					</TabsList>

					{/* Login Tab */}
					<TabsContent value="login">
						<Card>
							<CardHeader className="space-y-1">
								<CardTitle className="text-2xl">Login</CardTitle>
								<CardDescription>
									Enter your credentials to access your account
								</CardDescription>
							</CardHeader>

							<CardContent>
								<Form {...loginForm}>
									<form
										onSubmit={loginForm.handleSubmit(onLoginSubmit)}
										className="space-y-4"
									>
										<FormField
											control={loginForm.control}
											name="email"
											render={({
												field,
											}: {
												field: ControllerRenderProps<LoginFormValues, "email">;
											}) => (
												<FormItem>
													<FormLabel htmlFor="email">Email</FormLabel>
													<FormControl>
														<div className="relative">
															<Input
																id="email"
																type="email"
																placeholder="name@example.com"
																{...field}
															/>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={loginForm.control}
											name="password"
											render={({
												field,
											}: {
												field: ControllerRenderProps<
													LoginFormValues,
													"password"
												>;
											}) => (
												<FormItem>
													<div className="flex items-center justify-between">
														<FormLabel htmlFor="password">Password</FormLabel>
														<Link
															href="#"
															className="text-primary text-sm hover:underline"
														>
															Forgot password?
														</Link>
													</div>
													<FormControl>
														<div className="relative">
															<Input
																id="password"
																type={showPassword ? "text" : "password"}
																placeholder="••••••••"
																{...field}
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
																	{showPassword
																		? "Hide password"
																		: "Show password"}
																</span>
															</Button>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button
											type="submit"
											className="w-full"
											disabled={isLoading}
										>
											{isLoading ? "Signing in..." : "Sign in"}
										</Button>
									</form>
								</Form>

								<div className="relative mt-6">
									<div className="absolute inset-0 flex items-center">
										<Separator className="w-full" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-card px-2 text-muted-foreground">
											or continue with
										</span>
									</div>
								</div>

								<div className="mt-6 grid grid-cols-2 gap-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => handleSocialLogin("Google")}
										disabled={isLoading}
									>
										<svg
											className="mr-2 h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											role="img"
											aria-labelledby="googleIconTitle"
										>
											<title id="googleIconTitle">Google Logo</title>
											<path
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
												fill="#4285F4"
											/>
											<path
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
												fill="#34A853"
											/>
											<path
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
												fill="#FBBC05"
											/>
											<path
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
												fill="#EA4335"
											/>
										</svg>
										Google
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => handleSocialLogin("GitHub")}
										disabled={isLoading}
									>
										<svg
											className="mr-2 h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											role="img"
											aria-labelledby="githubIconTitle"
										>
											<title id="githubIconTitle">GitHub Logo</title>
											<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
										</svg>
										GitHub
									</Button>
								</div>
							</CardContent>

							<CardFooter>
								<p className="w-full text-center text-muted-foreground text-sm">
									Don't have an account?{" "}
									<Link
										href="#"
										className="text-primary underline hover:no-underline"
										onClick={(e) => {
											e.preventDefault();
											document
												.querySelector('[data-value="register"]')
												?.dispatchEvent(
													new MouseEvent("click", { bubbles: true }),
												);
										}}
									>
										Register
									</Link>
								</p>
							</CardFooter>
						</Card>
					</TabsContent>

					{/* Register Tab */}
					<TabsContent value="register">
						<Card>
							<CardHeader className="space-y-1">
								<CardTitle className="text-2xl">Create an account</CardTitle>
								<CardDescription>
									Enter your information to create an account
								</CardDescription>
							</CardHeader>

							<CardContent>
								<Form {...registerForm}>
									<form
										onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
										className="space-y-4"
									>
										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={registerForm.control}
												name="firstName"
												render={({
													field,
												}: {
													field: ControllerRenderProps<
														RegisterFormValues,
														"firstName"
													>;
												}) => (
													<FormItem>
														<FormLabel htmlFor="first-name">
															First name
														</FormLabel>
														<FormControl>
															<Input
																id="first-name"
																placeholder="John"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={registerForm.control}
												name="lastName"
												render={({
													field,
												}: {
													field: ControllerRenderProps<
														RegisterFormValues,
														"lastName"
													>;
												}) => (
													<FormItem>
														<FormLabel htmlFor="last-name">Last name</FormLabel>
														<FormControl>
															<Input
																id="last-name"
																placeholder="Doe"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={registerForm.control}
											name="email"
											render={({
												field,
											}: {
												field: ControllerRenderProps<
													RegisterFormValues,
													"email"
												>;
											}) => (
												<FormItem>
													<FormLabel htmlFor="email-register">Email</FormLabel>
													<FormControl>
														<Input
															id="email-register"
															type="email"
															placeholder="name@example.com"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={registerForm.control}
											name="password"
											render={({
												field,
											}: {
												field: ControllerRenderProps<
													RegisterFormValues,
													"password"
												>;
											}) => (
												<FormItem>
													<FormLabel htmlFor="password-register">
														Password
													</FormLabel>
													<FormControl>
														<div className="relative">
															<Input
																id="password-register"
																type={showPassword ? "text" : "password"}
																placeholder="••••••••"
																{...field}
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
																	{showPassword
																		? "Hide password"
																		: "Show password"}
																</span>
															</Button>
														</div>
													</FormControl>{" "}
													{/* Password strength meter */}
													<div className="mt-2">
														<Progress
															value={passwordStrength}
															className={`transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
														/>
														<p className="mt-1 text-muted-foreground text-xs">
															{getPasswordStrengthText(passwordStrength)}{" "}
															password
														</p>

														{/* Visual password requirements */}
														<div className="mt-3 space-y-2 text-sm">
															<h4 className="font-medium text-foreground">
																Password requirements:
															</h4>
															<ul className="space-y-1 text-xs">
																<li
																	className={`flex items-center gap-2 ${password.length >= 8 ? "text-green-500" : "text-red-500"}`}
																>
																	{password.length >= 8 ? (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="checkIcon1Title"
																		>
																			<title id="checkIcon1Title">
																				Check mark
																			</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M5 13l4 4L19 7"
																			/>
																		</svg>
																	) : (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="xIcon1Title"
																		>
																			<title id="xIcon1Title">X mark</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M6 18L18 6M6 6l12 12"
																			/>
																		</svg>
																	)}
																	At least 8 characters
																</li>
																<li
																	className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? "text-green-500" : "text-red-500"}`}
																>
																	{/[A-Z]/.test(password) ? (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="checkIcon2Title"
																		>
																			<title id="checkIcon2Title">
																				Check mark
																			</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M5 13l4 4L19 7"
																			/>
																		</svg>
																	) : (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="xIcon2Title"
																		>
																			<title id="xIcon2Title">X mark</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M6 18L18 6M6 6l12 12"
																			/>
																		</svg>
																	)}
																	At least one uppercase letter
																</li>
																<li
																	className={`flex items-center gap-2 ${/[a-z]/.test(password) ? "text-green-500" : "text-red-500"}`}
																>
																	{/[a-z]/.test(password) ? (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="checkIcon3Title"
																		>
																			<title id="checkIcon3Title">
																				Check mark
																			</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M5 13l4 4L19 7"
																			/>
																		</svg>
																	) : (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="xIcon3Title"
																		>
																			<title id="xIcon3Title">X mark</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M6 18L18 6M6 6l12 12"
																			/>
																		</svg>
																	)}
																	At least one lowercase letter
																</li>
																<li
																	className={`flex items-center gap-2 ${/[0-9]/.test(password) ? "text-green-500" : "text-red-500"}`}
																>
																	{/[0-9]/.test(password) ? (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="checkIcon4Title"
																		>
																			<title id="checkIcon4Title">
																				Check mark
																			</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M5 13l4 4L19 7"
																			/>
																		</svg>
																	) : (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="xIcon4Title"
																		>
																			<title id="xIcon4Title">X mark</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M6 18L18 6M6 6l12 12"
																			/>
																		</svg>
																	)}
																	At least one number
																</li>
																<li
																	className={`flex items-center gap-2 ${/[\W_]/.test(password) ? "text-green-500" : "text-red-500"}`}
																>
																	{/[\W_]/.test(password) ? (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="checkIcon5Title"
																		>
																			<title id="checkIcon5Title">
																				Check mark
																			</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M5 13l4 4L19 7"
																			/>
																		</svg>
																	) : (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="xIcon5Title"
																		>
																			<title id="xIcon5Title">X mark</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M6 18L18 6M6 6l12 12"
																			/>
																		</svg>
																	)}
																	At least one special character
																</li>
																<li
																	className={`flex items-center gap-2 ${!/\s/.test(password) ? "text-green-500" : "text-red-500"}`}
																>
																	{!/\s/.test(password) ? (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="checkIcon6Title"
																		>
																			<title id="checkIcon6Title">
																				Check mark
																			</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M5 13l4 4L19 7"
																			/>
																		</svg>
																	) : (
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-4 w-4"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			strokeWidth="2"
																			role="img"
																			aria-labelledby="xIcon6Title"
																		>
																			<title id="xIcon6Title">X mark</title>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M6 18L18 6M6 6l12 12"
																			/>
																		</svg>
																	)}
																	No spaces
																</li>
															</ul>
														</div>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={registerForm.control}
											name="confirmPassword"
											render={({
												field,
											}: {
												field: ControllerRenderProps<
													RegisterFormValues,
													"confirmPassword"
												>;
											}) => (
												<FormItem>
													<FormLabel htmlFor="confirm-password">
														Confirm Password
													</FormLabel>
													<FormControl>
														<div className="relative">
															<Input
																id="confirm-password"
																type={showConfirmPassword ? "text" : "password"}
																placeholder="••••••••"
																{...field}
															/>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="absolute top-0 right-0 h-full px-3"
																onClick={() =>
																	setShowConfirmPassword(!showConfirmPassword)
																}
															>
																{showConfirmPassword ? (
																	<EyeOff className="h-4 w-4" />
																) : (
																	<Eye className="h-4 w-4" />
																)}
																<span className="sr-only">
																	{showConfirmPassword
																		? "Hide password"
																		: "Show password"}
																</span>
															</Button>
														</div>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button
											type="submit"
											className="w-full"
											disabled={isLoading}
										>
											{isLoading ? "Creating account..." : "Create account"}
										</Button>
									</form>
								</Form>

								<div className="relative mt-6">
									<div className="absolute inset-0 flex items-center">
										<Separator className="w-full" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-card px-2 text-muted-foreground">
											or register with
										</span>
									</div>
								</div>

								<div className="mt-6 grid grid-cols-2 gap-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => handleSocialLogin("Google")}
										disabled={isLoading}
									>
										<svg
											className="mr-2 h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											role="img"
											aria-labelledby="googleIconTitle2"
										>
											<title id="googleIconTitle2">Google Logo</title>
											<path
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
												fill="#4285F4"
											/>
											<path
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
												fill="#34A853"
											/>
											<path
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
												fill="#FBBC05"
											/>
											<path
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
												fill="#EA4335"
											/>
										</svg>
										Google
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => handleSocialLogin("GitHub")}
										disabled={isLoading}
									>
										<svg
											className="mr-2 h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											role="img"
											aria-labelledby="githubIconTitle2"
										>
											<title id="githubIconTitle2">GitHub Logo</title>
											<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
										</svg>
										GitHub
									</Button>
								</div>
							</CardContent>

							<CardFooter>
								<p className="w-full text-center text-muted-foreground text-sm">
									Don't have an account?{" "}
									<Link
										href="#"
										className="text-primary underline hover:no-underline"
										onClick={(e) => {
											e.preventDefault();
											document
												.querySelector('[data-value="register"]')
												?.dispatchEvent(
													new MouseEvent("click", { bubbles: true }),
												);
										}}
									>
										Register
									</Link>
								</p>
							</CardFooter>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Debug Panel (Only visible when ?debug=true) */}
				{debugMode && (
					<div className="mt-6 rounded border border-gray-700 bg-gray-950/50 p-4 text-xs">
						<div className="mb-2 flex items-center justify-between">
							<h4 className="font-bold">Auth Debug Logs</h4>
							<button
								type="button"
								onClick={() => setDebugLogs([])}
								className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
							>
								Clear
							</button>
						</div>
						<div className="h-40 overflow-auto rounded bg-gray-900 p-2">
							<div className="space-y-1">
								{debugLogs.map((log) => {
									// Extract timestamp to use as part of the unique key
									const timestamp = log.substring(0, log.indexOf(":"));
									const logDigest = log.substring(0, 20).replace(/\s+/g, "");
									return (
										<div
											key={`debug-${timestamp}-${logDigest}`}
											className={cn(
												"whitespace-pre-wrap break-all",
												log.includes("CRITICAL:") && "text-red-400",
												log.includes("ERROR:") && "text-yellow-400",
											)}
										>
											{log}
										</div>
									);
								})}
							</div>
						</div>

						<div className="mt-4">
							<h5 className="mb-1 font-semibold">Recent Critical Issues</h5>
							{(() => {
								try {
									const storedLogs = JSON.parse(
										localStorage.getItem("auth_critical_logs") || "[]",
									);
									return (
										<div className="space-y-1 text-red-400">
											{storedLogs.slice(0, 5).map(
												(log: {
													timestamp: string;
													message: string;
													data: unknown;
												}) => {
													// Create a unique key using timestamp and message digest
													const uniqueKey = `${log.timestamp}-${log.message.substring(0, 10).replace(/\s+/g, "")}`;
													return (
														<div
															key={`crit-log-${uniqueKey}`}
															className="whitespace-pre-wrap break-all"
														>
															[{new Date(log.timestamp).toLocaleTimeString()}]{" "}
															{log.message}
														</div>
													);
												},
											)}
											{storedLogs.length === 0 && (
												<div className="text-gray-500">
													No critical issues recorded
												</div>
											)}
										</div>
									);
								} catch (e) {
									return (
										<div className="text-yellow-500">
											Error retrieving stored logs: {String(e)}
										</div>
									);
								}
							})()}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
