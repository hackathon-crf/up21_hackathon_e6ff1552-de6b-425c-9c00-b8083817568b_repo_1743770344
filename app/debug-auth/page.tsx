"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({ loading: true });
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setDebugInfo({ loading: true });
    setError(null);
    
    try {
      console.log("🔍 AUTH DEBUG: Starting diagnostics");
      
      // Check server-side auth state
      const serverAuthResponse = await fetch('/api/auth/check', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const serverAuth = await serverAuthResponse.json();
      
      // Also check the original debug endpoint for comparison
      const originalDebugResponse = await fetch('/api/debug/auth-flow', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const originalDebug = await originalDebugResponse.json();
      
      // Get local storage items related to auth
      const localStorageKeys = Object.keys(localStorage)
        .filter(key => key.includes('supabase') || key.includes('auth') || key.includes('session'));
        
      const localStorageData: Record<string, unknown> = {};
      localStorageKeys.forEach(key => {
        try {
          localStorageData[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch (e) {
          localStorageData[key] = localStorage.getItem(key);
        }
      });
      
      // Get cookie names (not values for security)
      const cookies = document.cookie.split(';').map(c => c.trim().split('=')[0]);
      
      setDebugInfo({
        serverAuth,
        originalDebug,
        localStorageData,
        cookieNames: cookies,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        loading: false
      });
      
    } catch (err) {
      console.error("Error in diagnostics:", err);
      setError(err instanceof Error ? err.message : "Unknown error running diagnostics");
      setDebugInfo({ loading: false, error: true });
    }
  };
  
  // Run on component mount
  useEffect(() => {
    runDiagnostics();
  }, []);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white p-8 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Authentication Diagnostic Tool</h1>
          <div className="flex space-x-2">
            <Link href="/login" className="rounded bg-blue-500 px-3 py-1 text-white">
              Login Page
            </Link>
            <button 
              onClick={runDiagnostics}
              className="rounded bg-green-500 px-3 py-1 text-white"
            >
              Refresh Data
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}
        
        <div className="mt-6">
          {debugInfo.loading ? (
            <div className="flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Server Auth Status */}
              <div className="rounded-md border border-gray-200 p-4">
                <h2 className="mb-2 text-lg font-semibold">Server Auth Status</h2>
                <div className={`mb-2 rounded-md p-2 text-sm ${debugInfo.serverAuth?.authenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  Authentication: {debugInfo.serverAuth?.authenticated ? 'Authenticated' : 'Not Authenticated'}
                </div>
                <pre className="max-h-40 overflow-auto rounded-md bg-gray-100 p-2 text-xs">
                  {JSON.stringify(debugInfo.serverAuth, null, 2)}
                </pre>
              </div>
              
              {/* Original Debug Endpoint */}
              <div className="rounded-md border border-gray-200 p-4">
                <h2 className="mb-2 text-lg font-semibold">Original Debug Endpoint Response</h2>
                <div className={`mb-2 rounded-md p-2 text-sm ${debugInfo.originalDebug?.authenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  Authentication: {debugInfo.originalDebug?.authenticated ? 'Authenticated' : 'Not Authenticated'}
                </div>
                <pre className="max-h-40 overflow-auto rounded-md bg-gray-100 p-2 text-xs">
                  {JSON.stringify(debugInfo.originalDebug, null, 2)}
                </pre>
              </div>
              
              {/* Local Storage Data */}
              <div className="rounded-md border border-gray-200 p-4">
                <h2 className="mb-2 text-lg font-semibold">Auth-Related Local Storage</h2>
                <pre className="max-h-40 overflow-auto rounded-md bg-gray-100 p-2 text-xs">
                  {JSON.stringify(debugInfo.localStorageData, null, 2)}
                </pre>
              </div>
              
              {/* Cookie Names */}
              <div className="rounded-md border border-gray-200 p-4">
                <h2 className="mb-2 text-lg font-semibold">Cookie Names</h2>
                <pre className="max-h-40 overflow-auto rounded-md bg-gray-100 p-2 text-xs">
                  {JSON.stringify(debugInfo.cookieNames, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-center text-xs text-gray-500">
        Timestamp: {new Date().toISOString()}
      </div>
    </div>
  );
}
