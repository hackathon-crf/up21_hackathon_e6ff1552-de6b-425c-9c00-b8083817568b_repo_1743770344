"use client";

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';

export default function MistralTestPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to load API key from localStorage
  const loadFromLocalStorage = () => {
    try {
      const storedKey = localStorage.getItem('mistral_api_key');
      if (storedKey) {
        setApiKey(storedKey);
        console.log("Loaded API key from localStorage, length:", storedKey.length);
      } else {
        setError("No Mistral API key found in localStorage");
      }
    } catch (err) {
      setError("Failed to load from localStorage");
      console.error("localStorage error:", err);
    }
  };

  // Test the API key
  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`Testing Mistral API with key length: ${apiKey.length}`);
      const cleanKey = apiKey.trim().replace(/['"]/g, '');
      console.log("Cleaned key length:", cleanKey.length);
      
      const response = await fetch('/api/debug/mistral-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: cleanKey }),
      });

      const data = await response.json();
      console.log("Response:", data);
      
      setResult(data);
      
      if (!data.success) {
        setError(data.error?.message || data.error || 'Unknown error');
      }
    } catch (err) {
      console.error("Test error:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Compare with curl format
  const generateCurlCommand = () => {
    if (!apiKey) return '';
    
    // Generate a curl command equivalent to our test
    return `curl --location "https://api.mistral.ai/v1/chat/completions" \\
  --header 'Content-Type: application/json' \\
  --header 'Accept: application/json' \\
  --header "Authorization: Bearer ${apiKey.trim()}" \\
  --data '{
    "model": "mistral-large-latest",
    "messages": [{"role": "user", "content": "Hello, testing API connection"}]
  }'`;
  };

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Mistral API Diagnostic Tool</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Key Test</CardTitle>
          <CardDescription>
            Test your Mistral API key directly to diagnose authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Mistral API Key</Label>
              <div className="flex space-x-2">
                <Input
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                  placeholder="Enter your Mistral API key"
                  className="flex-1"
                />
                <Button 
                  onClick={loadFromLocalStorage} 
                  variant="outline"
                >
                  Load from App
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={testApiKey} 
              disabled={loading || !apiKey.trim()}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test API Key'}
            </Button>

            {error && (
              <div className="mt-4 rounded border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <h3 className="font-semibold">Error:</h3>
                <p>{error}</p>
              </div>
            )}

            {result && (
              <div className={`mt-4 rounded border p-4 ${result.success ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300' : 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300'}`}>
                <h3 className="font-semibold">
                  {result.success ? 'Success!' : 'Response (with error):'}
                </h3>
                <pre className="mt-2 max-h-60 overflow-auto rounded bg-black/5 p-2 text-xs dark:bg-white/5">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equivalent Curl Command</CardTitle>
          <CardDescription>
            For comparison with your working curl command
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={generateCurlCommand()}
            readOnly
            className="font-mono text-sm"
            rows={8}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            You can run this command in your terminal to test directly
          </p>
        </CardContent>
      </Card>
    </div>
  );
}