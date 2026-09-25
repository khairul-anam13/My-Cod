"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useLocation } from "@/hooks/useLocation";
import { apiFetch } from "@/lib/api";
import type { Profile } from "@my-cod/shared-types";
import { NewListingForm } from "./NewListingForm";

export default function PostListingPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const location = useLocation();

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent("/post")}`);
      return;
    }
    apiFetch<Profile | null>("/profiles/me/profile", { token: session.access_token })
      .then((profile) => {
        if (!profile) router.replace(`/profile/edit?next=${encodeURIComponent("/post")}`);
      })
      .catch(() => {});
  }, [sessionLoading, session, router]);

  if (sessionLoading || !session) return null;

  return <NewListingForm token={session.access_token} userId={session.user.id} location={location} />;
}
