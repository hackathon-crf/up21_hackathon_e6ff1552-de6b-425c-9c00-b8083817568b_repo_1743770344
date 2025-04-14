import { NextRequest, NextResponse } from 'next/server';

const PROVIDER_ENDPOINTS = {
  openai: "https://api.openai.com/v1/models",
  mistral: "https://api.mistral.ai/v1/models",
  anthropic: "https://api.anthropic.com/v1/models",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  openrouter: "https://openrouter.ai/api/v1/models"
};

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();
    
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    const endpoint = PROVIDER_ENDPOINTS[provider as keyof typeof PROVIDER_ENDPOINTS];
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    let url = endpoint;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Configure provider-specific headers and URLs
    if (provider === 'gemini') {
      url = `${endpoint}?key=${apiKey}`;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        console.error(`[models-api] Provider ${provider} error:`, error);
        return NextResponse.json(
          { error: `API request failed: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error(`[models-api] Fetch error for ${provider}:`, error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch models' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[models-api] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}