"use client";

import { ChevronLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Mobile-only immersive sub-header for someone else's trust profile: focused
 * back + title + share, replacing the shared MobileHeader chrome (which hides
 * on this route — see MobileHeader's HIDDEN_ON). Own-profile view keeps the
 * plain BackButton instead, since there's nothing to "share" about yourself.
 */
export function ProfileHeader({ title, shareUrl }: { title: string; shareUrl: string }) {
  const router = useRouter();

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url: shareUrl }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link profil disalin.");
  }

  return (
    <header className="md:hidden sticky top-0 z-40 border-b-2 border-border bg-surface/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-2">
        <Button
          onClick={() => router.back()}
          aria-label="Kembali"
          variant="ghost"
          size="icon-lg"
          className="rounded-full text-foreground hover:bg-surface-muted"
        >
          <ChevronLeft size={22} strokeWidth={2.25} />
        </Button>
        <h1 className="truncate px-2 text-sm font-bold text-foreground">{title}</h1>
        <Button
          onClick={share}
          aria-label="Bagikan profil"
          variant="ghost"
          size="icon-lg"
          className="rounded-full text-foreground hover:bg-surface-muted"
        >
          <Share2 size={19} />
        </Button>
      </div>
    </header>
  );
}
