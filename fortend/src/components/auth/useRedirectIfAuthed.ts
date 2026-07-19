"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

/**
 * Bounces an already-signed-in visitor off the auth pages. Landing on
 * /sign-in or /sign-up while you already have a session is a dead end —
 * send them to the dashboard instead. `redirecting` lets the page hold back
 * the form for the split second before the navigation lands, so the form
 * doesn't flash for a logged-in user.
 */
export function useRedirectIfAuthed(to = "/dashboard") {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) router.replace(to);
  }, [isPending, session, router, to]);

  return { redirecting: !isPending && Boolean(session) };
}
