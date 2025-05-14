import { NextResponse, type NextRequest } from 'next/server';

// This middleware will automatically redirect old /multiplayer/lobby/[id] paths 
// to the new /multiplayer/lobby/[code] paths
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if this is a lobby path with a numeric ID
  if (path.startsWith('/multiplayer/lobby/')) {
    const segments = path.split('/');
    const idOrCode = segments[3];
    
    // If it looks like a numeric ID (only contains digits)
    if (idOrCode && /^\d+$/.test(idOrCode)) {
      // Fetch the code for this ID
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/multiplayer/${idOrCode}/code`);
        if (response.ok) {
          const data = await response.json();
          if (data.code) {
            // Redirect to the code-based URL
            return NextResponse.redirect(
              new URL(`/multiplayer/lobby/${data.code}`, request.url)
            );
          }
        }
      } catch (error) {
        console.error('Error redirecting to code-based URL:', error);
      }
    }
  }
  
  return NextResponse.next();
}

// Only run this middleware on the multiplayer lobby paths
export const config = {
  matcher: '/multiplayer/lobby/:path*',
};
