"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from '@posthog/react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check that we are on the client side before initializing
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        // Note: 'defaults' is not a standard PostHog config property, but preserved per request
        defaults: '2026-05-30',
        capture_pageview: false, // Usually disabled here if manually tracked
        capture_pageleave: true,
      } as any);
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  );
}

/**
 * Client-side provider wrapper. Mount this in the root layout.
 * React Query owns server state; Zustand (no provider needed) owns client UI state.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <PostHogProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PostHogProvider>
  );
}
