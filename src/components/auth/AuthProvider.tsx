"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { env } from "~/env";

type AuthResult = {
	success: boolean;
	message?: string;
	user?: User | null;
	session?: Session | null;
};

type AuthContextType = {
	user: User | null;
	session: Session | null;
	isLoading: boolean;
	signIn: (email: string, password: string) => Promise<AuthResult>;
	signUp: (email: string, password: string) => Promise<AuthResult>;
	signOut: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [initialAuthCheckComplete, setInitialAuthCheckComplete] =
		useState(false);
	const router = useRouter();

	// Create the Supabase client
	const supabase = createBrowserClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	);

	// This getAuthState function follows the secure pattern
	// recommended by Supabase to avoid security warnings
	const getAuthState = useCallback(async () => {
		try {
			setIsLoading(true);
			console.log(
				"🔒 AUTH FLOW [getAuthState]: Starting authentication state fetch",
			);

			// Use getSession() first to check if there's an existing session
			// This approach is more resilient to initial auth state conditions
			console.log(
				"🔒 AUTH FLOW [getAuthState]: Fetching session data from Supabase",
			);
			const { data: sessionData, error: sessionError } =
				await supabase.auth.getSession();

			console.log("🔒 AUTH FLOW [getAuthState]: Session response received", {
				hasSession: !!sessionData?.session,
				hasError: !!sessionError,
				errorType: sessionError?.name,
				errorMessage: sessionError?.message,
			});

			// Check if we got an AuthSessionMissingError - this is normal for logged out users
			if (sessionError) {
				// Check if error is an AuthSessionMissingError - treat as "not logged in"
				if (
					sessionError.name === "AuthSessionMissingError" ||
					sessionError.message?.includes("Auth session missing")
				) {
					console.log(
						"🔒 AUTH FLOW [getAuthState]: No active session found (normal for logged out users)",
					);
					setUser(null);
					setSession(null);
					return; // Exit early - this is a normal "not logged in" state
				}
				// Other errors should still be thrown
				console.error(
					"🔒 AUTH FLOW [getAuthState]: Unexpected session error:",
					sessionError,
				);
				throw sessionError;
			}

			// If we have a session, now fetch the user data
			if (sessionData.session) {
				console.log(
					"🔒 AUTH FLOW [getAuthState]: Valid session found, fetching user data",
					{
						accessToken: `${sessionData.session.access_token.substring(0, 10)}...`,
						expiresAt: sessionData.session.expires_at
							? new Date(sessionData.session.expires_at * 1000).toISOString()
							: "not set",
						isExpired: sessionData.session.expires_at
							? new Date(sessionData.session.expires_at * 1000) < new Date()
							: false,
					},
				);

				const { data: userData, error: userError } =
					await supabase.auth.getUser();

				console.log(
					"🔒 AUTH FLOW [getAuthState]: User data response received",
					{
						hasUser: !!userData?.user,
						userId: userData?.user?.id,
						email: userData?.user?.email,
						hasError: !!userError,
						errorMessage: userError?.message,
					},
				);

				if (userError) {
					console.error(
						"🔒 AUTH FLOW [getAuthState]: Error fetching user data:",
						userError,
					);
					throw userError;
				}

				// Set the verified user and session
				setUser(userData.user);
				setSession(sessionData.session);

				console.log(
					"🔒 AUTH FLOW [getAuthState]: Auth state successfully updated with valid user and session",
				);
			} else {
				// No session = no authenticated user
				console.log(
					"🔒 AUTH FLOW [getAuthState]: Session object exists but is empty - user not logged in",
				);
				setUser(null);
				setSession(null);
			}
		} catch (error) {
			// For any other errors, log them but don't crash
			console.error("Error retrieving auth data:", error);
			setUser(null);
			setSession(null);
		} finally {
			console.log(
				"🔍 AUTH FLOW [getAuthState] FINALLY BLOCK: Setting loading false and auth check complete",
				{
					currentUser: user?.email || "none",
					newUser: !!user,
				},
			);
			setIsLoading(false);
			setInitialAuthCheckComplete(true);
		}
	}, [supabase.auth, user]);

	// Track if we've initialized the auth state listener to prevent multiple subscriptions
	const authInitializedRef = useRef(false);

	// On mount, get initial auth state - use useRef to prevent repeated effect calls
	useEffect(() => {
		// Prevent multiple initializations
		if (authInitializedRef.current) {
			console.log(
				"🔒 AUTH PROVIDER: Auth already initialized, skipping duplicate initialization",
			);
			return;
		}

		// Mark as initialized immediately to prevent race conditions
		authInitializedRef.current = true;

		console.log("🔒 AUTH PROVIDER: Initial mount effect running", {
			timestamp: new Date().toISOString(),
			authCheckComplete: initialAuthCheckComplete,
			pathname: window.location.pathname,
		});

		// Create a unique ID for this instance of the effect
		const effectId = Math.random().toString(36).substring(2, 6);
		console.log(`🔒 AUTH PROVIDER [${effectId}]: Starting auth initialization`);

		// Get initial auth state without async/await to avoid blocking
		console.log(
			`🔒 AUTH PROVIDER [${effectId}]: Calling initial getAuthState()`,
		);
		getAuthState().catch((err) => {
			console.error(
				`🔒 AUTH PROVIDER [${effectId}]: Error in initial getAuthState()`,
				err,
			);
		});

		// Set up the auth state listener with enhanced logging - only once
		console.log(
			`🔒 AUTH PROVIDER [${effectId}]: Setting up auth state listener`,
		);
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log(`🔒 AUTH PROVIDER [${effectId}]: Auth state change event:`, {
				event,
				hasSession: !!session,
				timestamp: new Date().toISOString(),
				pathname: window.location.pathname,
			});

			// Only update auth state for specific events to reduce unnecessary updates
			if (
				event === "SIGNED_IN" ||
				event === "SIGNED_OUT" ||
				event === "USER_UPDATED" ||
				event === "PASSWORD_RECOVERY" ||
				event === "INITIAL_SESSION"
			) {
				try {
					console.log(
						`🔒 AUTH PROVIDER [${effectId}]: Refreshing auth state due to ${event}`,
					);
					await getAuthState();

					// Only handle navigation in specific cases:
					// 1. When user explicitly signs out
					// 2. When user explicitly signs in (but not on initial load)
					// And only if we're not on the target page already
					if (
						event === "SIGNED_OUT" &&
						!window.location.pathname.includes("/auth/")
					) {
						console.log(
							`🔒 AUTH PROVIDER [${effectId}]: User signed out, redirecting to login`,
						);
						router.push("/auth/login");
					} else if (
						event === "SIGNED_IN" &&
						initialAuthCheckComplete &&
						!window.location.pathname.includes("/dashboard")
					) {
						// Only redirect on explicit sign-in events (not initial page load auth checks)
						console.log(
							`🔒 AUTH PROVIDER [${effectId}]: User signed in, redirecting to dashboard`,
						);
						router.push("/dashboard");
					}
				} catch (error) {
					console.error(
						`🔒 AUTH PROVIDER [${effectId}]: Error handling auth event ${event}:`,
						error,
					);
				}
			} else if (event === "TOKEN_REFRESHED") {
				// For token refreshes, just log but don't trigger state updates or redirects
				console.log(
					`🔒 AUTH PROVIDER [${effectId}]: Token refreshed, no redirect needed`,
				);
			}
		});

		// Cleanup function that will run when the provider is unmounted
		return () => {
			console.log(
				`🔒 AUTH PROVIDER [${effectId}]: Cleanup - unsubscribing from auth events`,
			);
			subscription.unsubscribe();
		};

		// Empty dependency array removed - we want this to run when these dependencies change
	}, [getAuthState, router.push, initialAuthCheckComplete, supabase.auth]);

	// Sign in handler
	const signIn = async (
		email: string,
		password: string,
	): Promise<AuthResult> => {
		setIsLoading(true);
		console.log(
			`🔒 AUTH FLOW [signIn]: Login attempt initiated for email: ${email.substring(0, 3)}...`,
		);

		try {
			console.log("🔒 AUTH FLOW [signIn]: Calling Supabase signInWithPassword");
			// Attempt to sign in with credentials
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			console.log("🔒 AUTH FLOW [signIn]: Sign-in response received", {
				hasError: !!error,
				errorMessage: error?.message,
				errorName: error?.name,
				hasData: !!data,
				hasUser: !!data?.user,
				hasSession: !!data?.session,
				timestamp: new Date().toISOString(),
			});

			if (error) {
				console.error(
					"🔒 AUTH FLOW [signIn]: Login error received:",
					error.message,
				);
				return {
					success: false,
					message: error.message || "Invalid login credentials",
				};
			} // Verify we actually got a user and session back
			if (!data?.user || !data?.session) {
				console.error(
					"🔒 AUTH FLOW [signIn]: Auth response missing user or session despite no error",
					{
						hasUser: !!data?.user,
						hasSession: !!data?.session,
					},
				);

				// Try to refresh auth state
				console.log(
					"🔒 AUTH FLOW [signIn]: Attempting to refresh auth state via getAuthState()",
				);
				await getAuthState();

				// Check if auth state refresh worked
				console.log("🔒 AUTH FLOW [signIn]: Auth state refresh complete", {
					refreshedUser: !!user,
					refreshedSession: !!session,
					timestamp: new Date().toISOString(),
				});

				if (!user || !session) {
					console.error(
						"🔒 AUTH FLOW [signIn]: Auth state refresh failed to retrieve valid user/session",
					);
					return {
						success: false,
						message: "Authentication failed: No valid session was created",
					};
				}

				// Auth state refresh worked
				console.log(
					"🔒 AUTH FLOW [signIn]: Auth state refresh successful, returning authenticated state",
				);
				return {
					success: true,
					user: user,
					session: session,
				};
			}
			console.log(
				"🔒 AUTH FLOW [signIn]: Login successful with valid user and session",
				{
					userId: data.user.id,
					email: `${data.user.email?.substring(0, 3)}...`,
					sessionExpiry: data.session.expires_at
						? new Date(data.session.expires_at * 1000).toISOString()
						: "unknown",
					authenticated: true,
				},
			);

			// Explicitly update state with new data
			setUser(data.user);
			setSession(data.session);

			return {
				success: true,
				user: data.user,
				session: data.session,
			};
		} catch (error) {
			console.error(
				"🔒 AUTH FLOW [signIn]: Exception during sign-in process:",
				error,
			);
			const errorMessage =
				error instanceof Error ? error.message : "An unknown error occurred";
			console.log(
				"🔒 AUTH FLOW [signIn]: Returning failure result with message:",
				errorMessage,
			);
			return {
				success: false,
				message: errorMessage,
			};
		} finally {
			console.log(
				"🔒 AUTH FLOW [signIn]: Sign-in process complete, isLoading set to false",
			);
			setIsLoading(false);
		}
	};

	// Sign up handler
	const signUp = async (
		email: string,
		password: string,
	): Promise<AuthResult> => {
		setIsLoading(true);

		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			});

			if (error) {
				console.error("Error signing up:", error);
				return {
					success: false,
					message: error.message || "Sign up failed",
				};
			}

			// Check if sign-up was successful
			if (data?.user) {
				// Auth state will be updated by the listener
				return {
					success: true,
					user: data.user,
					session: data.session,
					message:
						"Sign up successful. Please check your email for verification.",
				};
			}
			return {
				success: false,
				message: "Sign up failed: No user was created",
			};
		} catch (error) {
			console.error("Error signing up:", error);
			const errorMessage =
				error instanceof Error ? error.message : "An unknown error occurred";
			return {
				success: false,
				message: errorMessage,
			};
		} finally {
			setIsLoading(false);
		}
	};

	// Sign out handler
	const signOut = async (): Promise<AuthResult> => {
		setIsLoading(true);

		try {
			const { error } = await supabase.auth.signOut();

			if (error) {
				console.error("Error signing out:", error);
				return {
					success: false,
					message: error.message || "Sign out failed",
				};
			}

			// Auth state will be updated by the listener
			return {
				success: true,
				message: "Successfully signed out",
			};
		} catch (error) {
			console.error("Error signing out:", error);
			const errorMessage =
				error instanceof Error ? error.message : "An unknown error occurred";
			return {
				success: false,
				message: errorMessage,
			};
		} finally {
			setIsLoading(false);
		}
	};

	const value = {
		user,
		session,
		isLoading,
		signIn,
		signUp,
		signOut,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
