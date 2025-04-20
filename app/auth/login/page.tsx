"use client";

import type React from "react";

import { Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

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
import { useAuth } from "~/components/auth/AuthProvider";

export default function LoginPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [debugMode, setDebugMode] = useState(false);
	const [debugLogs, setDebugLogs] = useState<string[]>([]);
	const searchParams = useSearchParams();
	const { signIn } = useAuth();

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
	const addDebugLog = (message: string, data?: any) => {
		const logEntry = `${new Date().toISOString()}: ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
		setDebugLogs(prev => [logEntry, ...prev.slice(0, 99)]);
	};

	// Enhanced logger that ensures visibility of critical logs
	const logger = {
		log: (message: string, data?: any) => {
			console.log(message, data);
			if (debugMode) addDebugLog(`LOG: ${message}`, data);
		},
		error: (message: string, data?: any) => {
			console.error(message, data);
			if (debugMode) addDebugLog(`ERROR: ${message}`, data);
		},
		critical: (message: string, data?: any) => {
			// Use multiple console methods to maximize visibility
			console.log(`%c${message}`, 'color: red; font-weight: bold', data);
			console.error(message, data);
			console.warn(message, data);
			// Always add critical logs to debug display regardless of debug mode
			addDebugLog(`CRITICAL: ${message}`, data);
			
			// Also store critical logs in localStorage for persistence
			try {
				const existingLogs = JSON.parse(localStorage.getItem('auth_critical_logs') || '[]');
				existingLogs.unshift({ timestamp: new Date().toISOString(), message, data });
				localStorage.setItem('auth_critical_logs', 
					JSON.stringify(existingLogs.slice(0, 20))); // Keep last 20 logs
			} catch (e) {
				console.error("Failed to save critical log to localStorage");
			}
		}
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		logger.critical("AUTH CRITICAL: Form submission started", { 
			timestamp: new Date().toISOString(),
			hasEmail: !!email.trim(), 
			hasPassword: !!password.trim() 
		});

		try {
			// If we have the real auth system available, use it
			if (signIn) {
				logger.log("🔒 AUTH UI [Login]: Attempting to sign in with Supabase", { 
					emailHint: email.substring(0, 3) + "..."
				});
				
				const authResult = await signIn(email, password);
				
				// Log the auth result details
				logger.log("🔒 AUTH UI [Login]: Auth result received", {
					success: authResult?.success,
					hasMessage: !!authResult?.message,
					hasUser: !!authResult?.user,
					hasSession: !!authResult?.session
				});
				
				if (!authResult || !authResult.success) {
					logger.error("🔒 AUTH UI [Login]: Authentication failed", {
						errorMessage: authResult?.message
					});
					
					toast({
						title: "Login failed",
						description: authResult?.message || "Please check your credentials and try again.",
						variant: "destructive",
					});
					return;
				}
				
				// Verify authentication with server
				logger.log("🔒 AUTH UI [Login]: Verifying authentication with server");
				try {
					const authCheckResponse = await fetch('/api/auth/check', {
						cache: 'no-store',
						headers: {
							'Cache-Control': 'no-cache',
							'x-debug-timestamp': new Date().toISOString()
						}
					});
					
					const authState = await authCheckResponse.json();
					
					logger.log("🔒 AUTH UI [Login]: Server verification response", {
						authenticated: authState.authenticated,
						status: authCheckResponse.status,
						hasUser: !!authState.user
					});
					
					if (!authState.authenticated) {
						logger.critical("AUTH CRITICAL: Server rejected authentication despite client success", {
							serverMessage: authState.message || authState.error,
							hasSession: !!authState.session,
							hasUser: !!authState.user,
							statusCode: authCheckResponse.status
						});
						
						toast({
							title: "Authentication error",
							description: "Server could not verify your session. Please try again.",
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
					logger.critical("AUTH CRITICAL: Error during server verification", checkError);
					
					toast({
						title: "Verification error",
						description: "Could not verify your authentication with the server.",
						variant: "destructive",
					});
				}
			} else {
				// Fallback to simulation if no auth provider
				logger.critical("AUTH CRITICAL: Using simulated auth flow - real auth provider missing");
				
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
				error: error instanceof Error ? error.message : String(error)
			});
			
			toast({
				title: "Login failed",
				description: "Please check your credentials and try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
			logger.log("🔒 AUTH UI [Login]: Login process completed", {
				timestamp: new Date().toISOString()
			});
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
			(document.querySelector('[data-value="login"]') as HTMLElement)?.click();
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
		).then(() => {
			// Navigate to dashboard after successful login
			router.push("/dashboard");
		}).catch(() => {
			// Error is already handled by the toast
		});
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
											value={email}
											onChange={(e) => setEmail(e.target.value)}
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
												value={password}
												onChange={(e) => setPassword(e.target.value)}
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
									<Button
										type="submit"
										className="w-full"
										disabled={isLoading}
									>
										{isLoading ? "Creating account..." : "Create account"}
									</Button>
								</form>
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
			
			{/* Render debug logs panel when debug mode is active */}
			{debugMode && (
				<div 
					className="fixed bottom-4 right-4 max-w-md max-h-[50vh] overflow-y-auto bg-black/90 text-white p-4 rounded shadow-lg z-50"
					style={{ fontSize: '12px', fontFamily: 'monospace' }}
				>
					<div className="flex justify-between items-center mb-2">
						<h4 className="font-bold">Auth Debug Logs</h4>
						<button 
							onClick={() => setDebugLogs([])}
							className="px-2 py-1 bg-gray-700 text-xs rounded hover:bg-gray-600"
						>
							Clear
						</button>
					</div>
					
					<div className="space-y-1">
						{debugLogs.map((log, i) => (
							<div 
								key={i}
								className={`p-1 border-b border-gray-700 ${
									log.includes('CRITICAL') 
										? 'text-red-400 font-bold' 
										: log.includes('ERROR')
											? 'text-orange-400'
											: 'text-gray-300'
								}`}
							>
								{log}
							</div>
						))}
						
						{debugLogs.length === 0 && (
							<div className="text-gray-500 italic">No logs captured yet.</div>
						)}
					</div>
					
					{/* Show critical logs from localStorage for persistence across page loads */}
					{(() => {
						try {
							const storedLogs = typeof localStorage !== 'undefined' 
								? JSON.parse(localStorage.getItem('auth_critical_logs') || '[]') 
								: [];
							
							if (storedLogs.length > 0) {
								return (
									<div className="mt-4 pt-2 border-t border-gray-700">
										<h5 className="font-bold mb-2">Persistent Critical Logs</h5>
										{storedLogs.map((log: any, i: number) => (
											<div key={i} className="text-red-400 text-xs mb-1">
												{log.timestamp}: {log.message}
											</div>
										))}
									</div>
								);
							}
							return null;
						} catch (e) {
							return <div className="text-red-500">Error loading stored logs</div>;
						}
					})()}
				</div>
			)}
		</div>
	);
}
