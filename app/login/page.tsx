"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "~/components/auth/AuthProvider";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const { signIn, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  // Function to add debug logs that will be visible on screen
  const addDebugLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Custom logger that both logs to console AND to our visible UI
  const logger = {
    log: (message: string, data?: any) => {
      console.log(message, data);
      addDebugLog(`LOG: ${message} ${data ? JSON.stringify(data) : ''}`);
    },
    error: (message: string, data?: any) => {
      console.error(message, data);
      addDebugLog(`ERROR: ${message} ${data ? JSON.stringify(data) : ''}`);
    },
    critical: (message: string, data?: any) => {
      // Try multiple console methods
      console.log(`%c${message}`, 'color: red; font-weight: bold', data);
      console.error(message, data);
      console.warn(message, data);
      addDebugLog(`CRITICAL: ${message} ${data ? JSON.stringify(data) : ''}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Display debug info directly in the UI - this will be visible even if logs don't work
    setDebugInfo(`Form submitted at ${new Date().toISOString()}`);
    
    // Use our custom logger with UI visibility
    logger.critical("AUTH CRITICAL: Form submission started", { 
      timestamp: new Date().toISOString(),
      hasEmail: !!email.trim(), 
      hasPassword: !!password.trim() 
    });
    
    // Add a more visual indicator for debugging
    if (searchParams.get("debug") === "true") {
      // Skip alert as it might be blocked and use UI state instead
      setDebugInfo(`DEBUG MODE: Form submission started at ${new Date().toISOString()}`);
    }
    
    // Use localStorage to persist debug info in case of navigation
    try {
      localStorage.setItem('auth_debug_last_submit', JSON.stringify({
        timestamp: new Date().toISOString(),
        email: email.substring(0, 3) + '...',
        passwordLength: password.length
      }));
    } catch (e) {
      logger.error("Could not save debug info to localStorage");
      setDebugInfo(`${debugInfo}\nFailed to save to localStorage`);
    }
    
    // Force log to display even if navigation happens - longer delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Basic input validation
    if (!email.trim()) {
      logger.log("🔒 AUTH UI [Login]: Validation failed - Email is required");
      setError("Email is required");
      return;
    }

    if (!password) {
      logger.log("🔒 AUTH UI [Login]: Validation failed - Password is required");
      setError("Password is required");
      return;
    }

    try {
      logger.log(`🔒 AUTH UI [Login]: Attempting login for: ${email.substring(0, 3)}...`);
      logger.log(`🔒 AUTH UI [Login]: Password length: ${password.length} chars`);
      
      // Attempt sign in
      logger.log("🔒 AUTH UI [Login]: Calling AuthProvider.signIn()");
      const authResult = await signIn(email, password);
      
      // Log detailed auth result
      logger.log("🔒 AUTH UI [Login]: authResult received from AuthProvider", {
        success: authResult?.success,
        hasMessage: !!authResult?.message,
        hasUser: !!authResult?.user,
        hasSession: !!authResult?.session,
        timestamp: new Date().toISOString()
      });
      
      // Check if sign-in was actually successful
      if (!authResult || !authResult.success) {
        logger.error("🔒 AUTH UI [Login]: Authentication failed", {
          errorMessage: authResult?.message
        });
        setError(authResult?.message || "Authentication failed");
        return;
      }
      
      // Double-check authentication with server using our reliable endpoint
      logger.log("🔒 AUTH UI [Login]: Authentication successful in client, verifying with server");
      try {
        logger.log("🔒 AUTH UI [Login]: Fetching server-side auth verification from NEW endpoint");
        // Use our new, more reliable auth check endpoint
        const authCheckResponse = await fetch('/api/auth/check', {
          // Prevent caching to ensure fresh result
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'x-debug-timestamp': new Date().toISOString()
          }
        });
        const authState = await authCheckResponse.json();
        
        logger.log("🔒 AUTH UI [Login]: NEW SERVER AUTH CHECK RESULT:", {
          ...authState,
          rawStatus: authCheckResponse.status,
          timestamp: new Date().toISOString()
        });
        
        if (!authState.authenticated) {
          logger.critical("AUTH CRITICAL: Server rejected authentication despite client success", {
            serverMessage: authState.message || authState.error,
            hasSession: !!authState.session,
            hasUser: !!authState.user,
            statusCode: authCheckResponse.status
          });
          // Force a small delay to make sure logs are visible
          await new Promise(resolve => setTimeout(resolve, 500));
          setError(`Authentication failed on server verification: ${authState.message || authState.error || "Unknown error"}`);
          return;
        }
        
        logger.log("🔒 AUTH UI [Login]: Server confirmed authentication successful");
      } catch (checkError) {
        logger.error("🔒 AUTH UI [Login]: Error checking server auth state:", checkError);
        setError("Authentication verification failed. Please try again.");
        return; // Stop the flow here if we can't verify authentication
      }
      
      // If we reach here, authentication succeeded
      logger.log("🔒 AUTH UI [Login]: Authentication fully verified, redirecting to:", redirectTo);
      router.push(redirectTo);
    } catch (err) {
      // Handle authentication errors
      logger.error("Login error:", err);
      let errorMessage = "Invalid login credentials";
      
      if (err instanceof Error) {
        // Extract more specific error messages
        errorMessage = err.message;
        if (err.message.includes("AuthSessionMissing")) {
          errorMessage = "Authentication failed: Session could not be created";
        }
      }
      
      setError(errorMessage);
    }
  };

  // Render debug logs on screen
  const renderDebugLogs = () => {
    if (debugLogs.length === 0) return null;
    
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        color: 'white',
        padding: '10px',
        maxHeight: '300px',
        overflowY: 'auto',
        zIndex: 9999,
        borderRadius: '4px',
        fontSize: '12px',
        maxWidth: '80%',
        fontFamily: 'monospace'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Debug Logs:</div>
        {debugLogs.map((log, i) => (
          <div key={i} style={{ 
            borderBottom: '1px solid rgba(255,255,255,0.2)', 
            padding: '3px 0',
            whiteSpace: 'pre-wrap'
          }}>
            {log}
          </div>
        ))}
        <button 
          onClick={() => setDebugLogs([])}
          style={{ marginTop: '5px', padding: '3px 8px', fontSize: '11px' }}
        >
          Clear
        </button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center font-bold text-3xl">Login</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {/* Debug information display - always visible */}
        {debugInfo && (
          <div className="mb-4 rounded-md bg-yellow-50 border-2 border-yellow-400 p-4 text-yellow-800 text-sm">
            <strong>Debug Info:</strong> {debugInfo}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block font-medium text-gray-700 text-sm"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-medium text-gray-700 text-sm"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>
        
        {/* Debug panel - toggle with ?debug=true in URL */}
        {searchParams.get("debug") === "true" && (
          <div className="mt-6 border border-gray-300 rounded p-4 bg-gray-50 text-xs font-mono">
            <h4 className="font-bold">Auth Debug Info</h4>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify({
                isLoading,
                formState: { email: email.substring(0,3) + "...", passwordLength: password.length },
                redirectTo,
                hasError: !!error,
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Always render our debug logs component */}
        {renderDebugLogs()}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
