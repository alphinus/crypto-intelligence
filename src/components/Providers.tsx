'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
