'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
  toggle: () => void; // convenience method for quick switching
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Helper to get system theme preference
function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Helper to validate and coerce theme values (protect against corrupt localStorage)
function coerceTheme(value: unknown, fallback: Theme = 'dark'): Theme {
  return value === 'dark' || value === 'light' || value === 'system' ? value : fallback;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'edgepilot-theme',
}: ThemeProviderProps) {
  // Initialize from prop (no window on server)
  const [theme, setThemeState] = useState<Theme>(() => defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() =>
    defaultTheme === 'system' ? 'dark' : (defaultTheme as 'dark' | 'light')
  );

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const validated = coerceTheme(stored, defaultTheme);
      setThemeState(validated);
    } catch {
      // Ignore storage errors (e.g., storage disabled)
    }
  }, [storageKey, defaultTheme]);

  // Apply theme early to minimize flash; also set color-scheme for native controls
  // useLayoutEffect runs synchronously before browser paint
  useLayoutEffect(() => {
    const root = document.documentElement;
    const actualTheme = theme === 'system' ? getSystemTheme() : theme;

    setResolvedTheme(actualTheme);
    
    // Avoid unnecessary DOM writes for performance
    const currentClasses = root.classList;
    if (!currentClasses.contains(actualTheme)) {
      currentClasses.remove('light', 'dark');
      currentClasses.add(actualTheme);
    }
    
    // Set color-scheme for native form controls and scrollbars
    root.style.colorScheme = actualTheme;
    
    // Also set a data attribute for CSS selectors if needed
    root.setAttribute('data-theme', actualTheme);
  }, [theme]);

  // React to system theme changes only when using 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handleChange = () => {
      const newSystemTheme = getSystemTheme();
      setResolvedTheme(newSystemTheme);
      
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newSystemTheme);
      root.style.colorScheme = newSystemTheme;
      root.setAttribute('data-theme', newSystemTheme);
    };

    // Use addEventListener for better compatibility
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, [theme]);

  // Sync theme changes across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== storageKey || !e.newValue) return;
      
      const newTheme = coerceTheme(e.newValue, defaultTheme);
      setThemeState(newTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, defaultTheme]);

  // Persist theme to localStorage whenever it changes
  const setTheme = useMemo(() => (nextTheme: Theme) => {
    const validated = coerceTheme(nextTheme, defaultTheme);
    setThemeState(validated);
    
    try {
      localStorage.setItem(storageKey, validated);
      
      // Dispatch storage event manually for same-tab updates (storage events don't fire in same tab)
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: validated,
        url: window.location.href,
      }));
    } catch {
      // Ignore storage errors
      console.warn('Failed to persist theme preference');
    }
  }, [storageKey, defaultTheme]);

  // Convenience toggle function
  const toggle = useMemo(() => () => {
    const currentTheme = theme === 'system' ? resolvedTheme : theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }, [theme, resolvedTheme, setTheme]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, toggle }),
    [theme, setTheme, resolvedTheme, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}