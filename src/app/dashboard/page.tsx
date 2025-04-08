"use client";

import { useEffect } from 'react';
import { useAuth } from '~/components/auth/AuthProvider';
import { api } from "~/trpc/react";
import Link from 'next/link';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  
  // Fetch user profile from our database
  const { data: profile, isLoading } = api.user.getProfile.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Sync user with our database if they exist in Supabase Auth
  const syncUserMutation = api.user.syncUser.useMutation();
  
  useEffect(() => {
    // If user exists in Supabase Auth but not in our database, create them
    if (user && !isLoading && !profile) {
      syncUserMutation.mutate();
    }
  }, [user, profile, isLoading, syncUserMutation]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={() => void signOut()}
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Sign out
        </button>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Welcome!</h2>
        <p>You are logged in as: {user?.email}</p>
        {syncUserMutation.isSuccess && (
          <p className="mt-2 text-sm text-green-600">User profile synchronized with database</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Flashcards</h2>
          <p className="mb-4 text-gray-600">Study, create, and manage your flashcards</p>
          <Link href="/flashcards" className="text-blue-600 hover:underline">Go to Flashcards →</Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Study</h2>
          <p className="mb-4 text-gray-600">Start a study session with your flashcards</p>
          <Link href="/study" className="text-blue-600 hover:underline">Start Studying →</Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Chat</h2>
          <p className="mb-4 text-gray-600">Chat with AI to enhance your learning</p>
          <Link href="/chat" className="text-blue-600 hover:underline">Open Chat →</Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Multiplayer</h2>
          <p className="mb-4 text-gray-600">Play flashcard games with friends</p>
          <Link href="/multiplayer" className="text-blue-600 hover:underline">Play Games →</Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Settings</h2>
          <p className="mb-4 text-gray-600">Manage your account settings</p>
          <Link href="/settings" className="text-blue-600 hover:underline">Go to Settings →</Link>
        </div>
      </div>
    </div>
  );
}