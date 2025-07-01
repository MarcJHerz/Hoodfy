'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeDebug() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = () => {
    console.log('🔧 Current theme:', theme);
    console.log('🔧 Resolved theme:', resolvedTheme);
    console.log('🔧 Document classes:', document.documentElement.className);
    
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    console.log('🔧 Setting theme to:', newTheme);
    setTheme(newTheme);
    
    setTimeout(() => {
      console.log('🔧 After change - Document classes:', document.documentElement.className);
      console.log('🔧 After change - Theme:', theme);
      console.log('🔧 After change - Resolved theme:', resolvedTheme);
    }, 200);
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
      <div className="text-sm mb-2">
        <div>Theme: {theme}</div>
        <div>Resolved: {resolvedTheme}</div>
        <div>Classes: {typeof window !== 'undefined' ? document.documentElement.className : 'SSR'}</div>
      </div>
      <button
        onClick={handleThemeToggle}
        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg"
      >
        {resolvedTheme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        Toggle Theme
      </button>
    </div>
  );
} 