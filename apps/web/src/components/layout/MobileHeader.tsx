"use client";

import { LogIn, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

/** Routes that render their own full-screen chrome (own back button / header). */
const HIDDEN_ON = ["/login", "/post", "/chat", "/chat/", "/listing/", "/profile/", "/search"];

/**
 * Mobile-only app-style header: compact, minimal chrome, with a tap-to-search
 * pill rather than a live input (search lives on its own screen, like a
 * native app).
 */
export function MobileHeader() {
  const pathname = usePathname();
  const { session, profile, loading } = useProfile();

  // "/" is checked separately (not via the wildcard scheme below) since a
  // trailing-slash entry of "/" would startsWith-match every route.
  if (pathname === "/") return null;

  if (HIDDEN_ON.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p))) {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-40 border-b-2 border-border bg-surface/95 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl border-2 border-border bg-white">
            <Image src="/logo-cod.png" alt="" fill sizes="36px" className="object-contain p-1" />
          </div>
          <span className="text-lg font-black italic tracking-tight text-foreground">
            My<span className="text-primary">COD</span>
          </span>
        </Link>

        <Link
          href="/search"
          aria-label="Cari barang"
          className="flex flex-1 items-center gap-2 rounded-none border-2 border-border bg-surface-muted px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"
        >
          <Search size={15} />
          Cari barang
        </Link>

        {loading ? null : session ? (
          <Link href="/profile" aria-label="Profil" className="shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.profile_photo_url ?? undefined} alt="" />
              <AvatarFallback>
                <UserRound size={16} />
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Button
            asChild
            size="icon-lg"
            variant="outline"
            className="shrink-0 rounded-none border-2"
            aria-label="Masuk"
          >
            <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
              <LogIn size={17} strokeWidth={2.5} />
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
