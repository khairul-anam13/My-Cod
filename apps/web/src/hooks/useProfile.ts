"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { apiFetch } from "@/lib/api";
import type { Profile } from "@my-cod/shared-types";

/**
 * Current user's own profile. While signed in, `profile` stays null until
 * onboarding creates a profile row. The signed-out case is derived during
 * render rather than written from the effect, so no cascading re-render.
 */
export function useProfile() {
  const { session, loading: sessionLoading } = useSession();
  const [fetched, setFetched] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    if (!session) return;

    let ignore = false;
    apiFetch<Profile | null>("/profiles/me/profile", { token: session.access_token })
      .then((data) => {
        if (!ignore) setFetched(data);
      })
      .catch(() => {
        if (!ignore) setFetched(null);
      });

    return () => {
      ignore = true;
    };
  }, [session]);

  const profile = sessionLoading ? undefined : session ? fetched : null;

  return { session, profile: profile ?? null, loading: profile === undefined };
}
