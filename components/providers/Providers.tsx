'use client';

import React, { Suspense } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Lazy load DevTools only in development for better production performance
const ReactQueryDevtools = 
  process.env.NODE_ENV !== 'production'
    ? React.lazy(() =>
        import('@tanstack/react-query-devtools').then((module) => ({
          default: module.ReactQueryDevtools,
        }))
      )
    : null;

interface ProvidersProps {
  children: ReactNode;
  defaultTheme?: 'dark' | 'light' | 'system';
}

export function Providers({ children, defaultTheme = 'dark' }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme={defaultTheme}>
        {children}
      </ThemeProvider>
      
      {/* DevTools only in development, lazy loaded for better performance */}
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools 
            initialIsOpen={false} 
            buttonPosition="bottom-left"
            position="bottom"
          />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}