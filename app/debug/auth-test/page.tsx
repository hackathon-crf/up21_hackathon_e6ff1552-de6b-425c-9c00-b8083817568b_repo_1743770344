"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '~/components/auth/AuthProvider';

export default function AuthDebugPage() {
  const [logs, setLogs] = useState<Array<{level: string, message: string, timestamp: string}>>([]);
  const [serverResponse, setServerResponse] = useState<any>(null);
  const [testType, setTestType] = useState<string>('form-submit');
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const { signIn } = useAuth();

  // Override console methods to capture logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const logInterceptor = (level: string) => (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // Only add to our logs if it's related to AUTH
      if (message.includes('AUTH')) {
        setLogs(prevLogs => [
          { level, message, timestamp: new Date().toISOString() },
          ...prevLogs.slice(0, 99) // Keep last 100 logs
        ]);
      }
      
      // Call original logger
      if (level === 'error') return originalError(...args);
      if (level === 'warn') return originalWarn(...args);
      return originalLog(...args);
    };

    console.log = logInterceptor('log');
    console.error = logInterceptor('error');
    console.warn = logInterceptor('warn');

    return () => {
      // Restore original methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Test functions to trigger different scenarios
  const runTest = async () => {
    try {
      switch(testType) {
        case 'form-submit':
          console.log("🚨 AUTH CRITICAL: Form submission started", { 
            timestamp: new Date().toISOString(),
            hasEmail: !!email.trim(), 
            hasPassword: !!password.trim() 
          });
          break;
          
        case 'login-attempt':
          await signIn(email, password);
          break;
          
        case 'verify-server':
          const authCheckResponse = await fetch('/api/auth/check', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'x-debug-timestamp': new Date().toISOString()
            }
          });
          const authState = await authCheckResponse.json();
          
          setServerResponse(authState);
          
          if (!authState.authenticated) {
            console.error("🦊 AUTH CRITICAL: Server rejected authentication despite client success", {
              serverMessage: authState.message || authState.error,
              hasSession: !!authState.session,
              hasUser: !!authState.user,
              statusCode: authCheckResponse.status
            });
          }
          break;
          
        case 'direct-log':
          console.log("🚨 AUTH CRITICAL: Direct test log", { timestamp: new Date().toISOString() });
          console.error("🦊 AUTH CRITICAL: Direct test error", { timestamp: new Date().toISOString() });
          console.warn("⚠️ AUTH CRITICAL: Direct test warning", { timestamp: new Date().toISOString() });
          break;
      }
    } catch (error) {
      console.error("Test error:", error);
    }
  };

  // Filter logs by type
  const filteredLogs = logs.filter(log => {
    if (log.message.includes('CRITICAL')) return true;
    return false;
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Console</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Test Type</label>
              <select 
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="form-submit">Simulate Form Submit</option>
                <option value="login-attempt">Attempt Login</option>
                <option value="verify-server">Check Server Auth</option>
                <option value="direct-log">Direct Console Logs</option>
              </select>
            </div>
            
            {(testType === 'login-attempt') && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium">Email</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">Password</label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </>
            )}
            
            <button 
              onClick={runTest}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Run Test
            </button>
          </div>
          
          {serverResponse && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Server Response:</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                {JSON.stringify(serverResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Critical Logs ({filteredLogs.length})</h2>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredLogs.map((log, i) => (
              <div 
                key={i} 
                className={`mb-2 p-2 text-xs font-mono rounded ${
                  log.level === 'error' ? 'bg-red-100' : 
                  log.level === 'warn' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}
              >
                <div className="text-xs text-gray-500">{log.timestamp}</div>
                <div className="whitespace-pre-wrap">{log.message}</div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-gray-500 italic">No critical logs captured yet.</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 border rounded p-4">
        <h2 className="text-lg font-semibold mb-2">All Captured Logs ({logs.length})</h2>
        <div className="max-h-96 overflow-y-auto">
          {logs.map((log, i) => (
            <div 
              key={i} 
              className={`mb-1 p-1 text-xs font-mono ${
                log.level === 'error' ? 'text-red-600' : 
                log.level === 'warn' ? 'text-yellow-600' : 'text-gray-800'
              }`}
            >
              <span className="opacity-70">[{log.timestamp}]</span> {log.message}
            </div>
          ))}
          
          {logs.length === 0 && (
            <div className="text-gray-500 italic">No logs captured yet.</div>
          )}
        </div>
        <div className="mt-2">
          <button 
            onClick={() => setLogs([])}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
}
