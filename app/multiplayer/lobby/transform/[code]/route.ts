import { NextResponse, type NextRequest } from "next/server";

// Redirect handler for old ID-based URLs
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;
  
  // If code looks like a numeric ID (all digits)
  if (/^\d+$/.test(code)) {
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/multiplayer/${code}/code`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.code) {
          // Redirect to the code-based URL
          return NextResponse.redirect(
            new URL(`/multiplayer/lobby/${data.code}`, request.url)
          );
        }
      }
      
      // If we couldn't find a valid code, redirect to the multiplayer main page
      return NextResponse.redirect(
        new URL('/multiplayer', request.url)
      );
    } catch (error) {
      console.error("Error redirecting:", error);
      
      // On error, redirect to the multiplayer main page
      return NextResponse.redirect(
        new URL('/multiplayer', request.url)
      );
    }
  }
  
  // Pass-through if it's already a code
  return NextResponse.redirect(
    new URL(`/multiplayer/lobby/${code}`, request.url)
  );
}