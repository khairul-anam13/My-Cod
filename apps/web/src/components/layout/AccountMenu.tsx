"use client";

import { LogIn, LogOut, MessageCircle, Package, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabaseClient";

export function AccountMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, profile, loading } = useProfile();

  if (loading) return <Skeleton className="h-9 w-9 rounded-full" />;

  if (!session) {
    return (
      <Button asChild variant="outline" size="lg" className="gap-1.5 rounded-none border-2 font-bold uppercase">
        <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
          <LogIn size={16} strokeWidth={2.5} />
          Masuk
        </Link>
      </Button>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar.");
    router.push("/");
    router.refresh();
  }

  const displayName = profile?.name ?? session.user.email ?? "Akun";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label="Menu akun">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.profile_photo_url ?? undefined} alt={displayName} />
            <AvatarFallback>
              <UserRound size={18} />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound size={14} />
            Profil Saya
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/listings">
            <Package size={14} />
            Listing Saya
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/chat">
            <MessageCircle size={14} />
            Chat
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={signOut}>
          <LogOut size={14} />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
