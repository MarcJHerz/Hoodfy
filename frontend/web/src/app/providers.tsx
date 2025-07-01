'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="hoodfy-theme"
      themes={['light', 'dark', 'system']}
      forcedTheme={undefined}
      enableColorScheme={true}
    >
      {children}
    </ThemeProvider>
  );
} 