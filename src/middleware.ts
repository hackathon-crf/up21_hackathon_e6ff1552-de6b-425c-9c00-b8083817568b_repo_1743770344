import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // ONLY use getUser() for authentication - this is the secure method
  // that validates auth with the Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get session separately if needed, but never use session.user for auth
  const { data: { session } } = await supabase.auth.getSession();

  // Handle auth redirects
  const path = request.nextUrl.pathname;
  
  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ['/dashboard', '/flashcards', '/study', '/chat', '/settings'];
  
  if (protectedRoutes.some(route => path.startsWith(route)) && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Auth routes - redirect to dashboard if already authenticated
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  
  if (authRoutes.includes(path) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Update response headers
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Update cookies for client components - include authenticated user data directly
  // This is more secure than just passing the session
  if (user) {
    // Only set cookie with user data if we have a verified user
    response.cookies.set("auth_user", JSON.stringify(user), { 
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    });
    
    if (session) {
      response.cookies.set("auth_session", JSON.stringify(session), { 
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true
      });
    }
  } else {
    // If no user, clear auth cookies to prevent stale data
    response.cookies.delete("auth_user");
    response.cookies.delete("auth_session");
  }

  return response;
}

// Specify which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};