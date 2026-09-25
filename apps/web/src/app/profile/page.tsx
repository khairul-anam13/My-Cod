"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export default function MyProfileRedirect() {
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent("/profile")}`);
      return;
    }
    router.replace(`/profile/${session.user.id}`);
  }, [loading, session, router]);

  return null;
}
