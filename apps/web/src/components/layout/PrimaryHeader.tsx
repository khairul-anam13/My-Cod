"use client";

import { Bell, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";

/**
 * Shared mobile-only top bar for primary tabs (Home, Chat): avatar, bell,
 * big title. There's no notifications backend yet, so the bell just
 * acknowledges the tap instead of linking somewhere fake.
 */
export function PrimaryHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const { session, profile, loading } = useProfile();

  return (
    <header className="md:hidden px-4 pt-4">
      <div className="flex items-center justify-between">
        {loading ? (
          <div className="h-9 w-9" />
        ) : session ? (
          <Link href="/profile" aria-label="Profil">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.profile_photo_url ?? undefined} alt="" />
              <AvatarFallback>
                <UserRound size={16} />
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Button asChild variant="outline" size="icon-lg" className="rounded-full border-2">
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} aria-label="Masuk">
              <UserRound size={16} />
            </Link>
          </Button>
        )}

        <Button
          onClick={() => toast("Belum ada notifikasi baru.")}
          aria-label="Notifikasi"
          variant="ghost"
          size="icon-lg"
          className="rounded-full text-foreground hover:bg-surface-muted"
        >
          <Bell size={20} />
        </Button>
      </div>

      <h1 className="mt-3 text-3xl font-black leading-tight text-foreground">{title}</h1>
      <div className="mt-4 border-b-2 border-border" />
    </header>
  );
}
