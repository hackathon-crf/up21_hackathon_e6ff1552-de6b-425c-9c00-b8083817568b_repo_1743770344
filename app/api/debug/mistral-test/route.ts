import { NextResponse, type NextRequest } from "next/server";

/**
 * Diagnostic endpoint to directly test Mistral API authentication
 * This helps isolate API key issues from application-specific problems
 */
export async function POST(request: NextRequest) {
  try {
    // Extract the API key from the request body
    const body = await request.json();
    const { apiKey, model = "mistral-large-latest" } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required", success: false },
        { status: 400 }
      );
    }

    // Clean the API key (remove whitespace and quotes)
    const cleanedKey = apiKey.trim().replace(/['"]/g, '');
    
    // Log key details (safely)
    console.log("[mistral-test] Testing key:", {
      keyLength: cleanedKey.length,
      keyPrefix: cleanedKey.substring(0, 3) + "...",
      keyFormat: cleanedKey.match(/^[A-Za-z0-9_\-]+$/) ? "valid format" : "invalid format"
    });

    // Prepare headers exactly as in the working curl example
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${cleanedKey}`
    };

    // Log the authorization header format (with redacted key)
    console.log("[mistral-test] Authorization header:", 
      `Bearer ${cleanedKey.substring(0, 3)}...${cleanedKey.substring(cleanedKey.length - 3)}`);

    // Simple payload for testing
    const payload = {
      model: model,
      messages: [{ role: "user", content: "Hello, testing API connection" }]
    };

    console.log("[mistral-test] Sending test request to Mistral API");
    
    // Make the actual API request to Mistral
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    // Log the response status
    console.log(`[mistral-test] Response status: ${response.status}`);

    // If successful, return the data
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        status: response.status,
        data: data
      });
    } else {
      // If error, try to get detailed error information
      const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" }));
      
      // Log the detailed error
      console.error("[mistral-test] API error:", {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: errorData
      }, { status: response.status });
    }
  } catch (error) {
    console.error("[mistral-test] Exception:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}