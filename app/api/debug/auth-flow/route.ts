import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "~/env";

export async function GET() {
  // Await the cookies() function to get the actual store
  const cookieStore = await cookies();
  
  // Create Supabase client with the correct API pattern
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Use method syntax instead of property assignments
        getAll() {
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll() {
          // Not needed for this read-only endpoint,
          // but required by the type definition
        }
      }
    }
  );
  
  try {
    // Get user session - this is the more critical check
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    // If there's a session error, authentication has failed
    if (sessionError) {
      return NextResponse.json({
        authenticated: false,
        hasSession: false,
        hasUser: false,
        error: sessionError.message,
        message: "AuthError: " + sessionError.message,
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }
    
    // Verify session exists
    if (!sessionData?.session) {
      return NextResponse.json({
        authenticated: false,
        hasSession: false,
        hasUser: false,
        message: "AuthSessionMissing",
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }
    
    // Check if session is expired (if we have an expiration timestamp)
    const expiresAt = sessionData.session.expires_at;
    if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
      return NextResponse.json({
        authenticated: false,
        hasSession: true,
        hasUser: false,
        message: "SessionExpired",
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }
    
    // Now get user data - this validates the token with Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    // If there's a user error or no user, authentication has failed
    if (userError || !userData?.user) {
      return NextResponse.json({
        authenticated: false,
        hasSession: true,  // We have a session but invalid user
        hasUser: false,
        error: userError?.message,
        message: userError ? "UserError: " + userError.message : "UserMissing",
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }
    
    // At this point, both session and user are valid
    return NextResponse.json({
      authenticated: true,
      hasSession: true,
      hasUser: true,
      userId: userData.user.id,
      email: userData.user.email,
      message: "Authenticated",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Server auth verification error:", error);
    return NextResponse.json({
      authenticated: false,
      hasSession: false,
      hasUser: false,
      message: "ServerError: " + (error instanceof Error ? error.message : "Unknown error"),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
