"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { type User, type Session } from '@supabase/supabase-js';
import { env } from '~/env';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Create the Supabase client
  const supabase = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // This getAuthState function follows the secure pattern
  // recommended by Supabase to avoid security warnings
  const getAuthState = async () => {
    try {
      setIsLoading(true);
      
      // CRITICAL: Always use getUser() first to get authenticated user data
      // This validates the token with the Supabase Auth server
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      // Get session data separately AFTER verifying the user
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Set the verified user from getUser() and the session
      setUser(userData.user);
      setSession(sessionData.session);
    } catch (error) {
      console.error('Error retrieving auth data:', error);
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, get initial auth state
  useEffect(() => {
    // Get initial auth state
    getAuthState();

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        // On ANY auth state change, ALWAYS fetch fresh user data
        // from the Supabase Auth server using getUser()
        await getAuthState();
        
        // Handle specific events
        if (event === 'SIGNED_OUT') {
          router.push('/');
        }
      }
    );

    return () => {
      // Clean up on unmount
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  // Sign in handler
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Auth state will be updated by the listener
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up handler
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Auth state will be updated by the listener
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out handler
  const signOut = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Auth state will be updated by the listener
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}