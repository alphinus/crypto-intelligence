'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AuthButton() {
  const { data: session, status } = useSession();
  const [isAuthAvailable, setIsAuthAvailable] = useState<boolean | null>(null);

  // Check if auth providers are configured
  useEffect(() => {
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(providers => {
        // If providers object is empty or null, auth is not configured
        setIsAuthAvailable(providers && Object.keys(providers).length > 0);
      })
      .catch(() => {
        setIsAuthAvailable(false);
      });
  }, []);

  // Don't render anything if auth is not available
  if (isAuthAvailable === false) {
    return null;
  }

  if (status === 'loading' || isAuthAvailable === null) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-gray-800/50 rounded-lg">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <User className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-xs text-gray-300 max-w-[100px] truncate">
            {session.user.name || session.user.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
          title="Abmelden"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Abmelden</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>Anmelden</span>
    </button>
  );
}
