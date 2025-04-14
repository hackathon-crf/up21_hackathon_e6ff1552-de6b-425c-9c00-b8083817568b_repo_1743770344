"use client"

import { useState, useEffect } from 'react';
import { api } from "~/trpc/react";
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';

// Define type for test connection result
type TestConnectionResult = {
  authenticated: boolean;
  userId: string;
  dbStatus: string;
  dbError: string | null;
  timestamp: string;
};

export default function DebugAuthPage() {
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Use the test connection procedure
  const { data, isLoading, isError, error: queryError } = api.chat.testConnection.useQuery(
    undefined,
    {
      retry: false
    }
  );

  // Use effect to handle result and errors
  useEffect(() => {
    if (isLoading) return;
    
    if (isError && queryError) {
      console.error("Test connection failed:", queryError);
      setError(queryError.message);
      setLoading(false);
      return;
    }
    
    if (data) {
      console.log("Test connection successful:", data);
      setTestResult(data);
      setLoading(false);
    }
  }, [data, isError, isLoading, queryError]);

  useEffect(() => {
    // This will help track component mounting and initialization
    console.log("DebugAuthPage mounted");
    return () => console.log("DebugAuthPage unmounted");
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">TRPC Authentication Debug Page</h1>
      <p className="mb-6 text-gray-300">This page tests your authentication status and database connection.</p>

      {loading ? (
        <div className="bg-zinc-800 rounded-lg p-4 mb-4">
          <p>Testing connection...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-xl mb-2">Authentication Error</h2>
          <p className="text-red-300">{error}</p>
          <p className="mt-4">This error suggests that:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>You might not be logged in</li>
            <li>Your session might have expired</li>
            <li>There could be an issue with the authentication system</li>
          </ul>
        </div>
      ) : (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-xl mb-2">Authentication Success</h2>
          <p>You are authenticated as:</p>
          <pre className="bg-zinc-800 p-3 rounded mt-2 overflow-x-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
          
          <div className="mt-4">
            <h3 className="font-medium text-lg">Database Status: <span 
              className={
                testResult?.dbStatus === "connected" ? "text-green-400" : 
                testResult?.dbStatus === "error" ? "text-red-400" : 
                "text-yellow-400"
              }
            >
              {testResult?.dbStatus || "Unknown"}
            </span></h3>
            
            {testResult?.dbError && (
              <div className="mt-2">
                <h4 className="font-medium">Database Error:</h4>
                <p className="text-red-300 bg-red-900/20 p-2 rounded mt-1">{testResult.dbError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-zinc-800/70 rounded-lg p-4 mt-6">
        <h2 className="font-semibold text-lg mb-2">Debugging Tips:</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Check that you're logged in by visiting the login page</li>
          <li>Verify that your session hasn't expired</li>
          <li>Check browser console for additional errors</li>
          <li>Database connectivity issues might require server-side investigation</li>
        </ul>
      </div>
    </div>
  );
}