"use client";

import { CircleCheck, Loader2, MessageCircle, Package, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useSession";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { Conversation, ListingStatus } from "@my-cod/shared-types";

/**
 * Primary actions for a listing. Renders twice from one piece of state: inline
 * inside the desktop buy box, and as a thumb-reachable sticky bar on mobile
 * (PRD 7.3). Sellers viewing their own listing get manage actions instead of
 * chat, so the page is never a dead end for them.
 */
export function ListingActions({
  listingId,
  sellerId,
  price,
  status,
}: {
  listingId: string;
  sellerId: string;
  price: number;
  status: ListingStatus;
}) {
  const router = useRouter();
  const { session, user, loading } = useSession();
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user?.id === sellerId;
  const isSold = status === "sold";

  async function startChat() {
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/listing/${listingId}`)}`);
      return;
    }
    setSubmitting(true);
    try {
      const conversation = await apiFetch<Conversation>("/conversations", {
        method: "POST",
        token: session.access_token,
        body: { listing_id: listingId },
      });
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memulai chat.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-12 w-full rounded-none" />;
  }

  const actions = isOwner ? (
    <div className="flex gap-2">
      <Button asChild variant="brutalist" className="h-12 flex-1 text-sm">
        <Link href={`/listing/${listingId}/edit`}>
          <Pencil size={16} strokeWidth={3} />
          Edit Barang
        </Link>
      </Button>
      <Button asChild variant="outline" className="h-12 flex-1 rounded-none border-2 text-sm font-bold">
        <Link href="/profile/listings">
          <Package size={16} />
          Kelola
        </Link>
      </Button>
    </div>
  ) : isSold ? (
    <Button disabled className="h-12 w-full rounded-none border-2 text-sm font-bold">
      <CircleCheck size={16} />
      Barang sudah terjual
    </Button>
  ) : (
    <Button
      onClick={startChat}
      disabled={submitting}
      variant="brutalist"
      className="h-12 w-full text-sm"
    >
      {submitting ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} strokeWidth={3} />}
      {submitting ? "Membuka chat…" : "Chat Penjual"}
    </Button>
  );

  return (
    <>
      <div className="hidden md:block">{actions}</div>

      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {!isOwner && (
            <div className="min-w-0 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Harga</p>
              <p className="truncate text-lg font-black text-primary">{formatRupiah(price)}</p>
            </div>
          )}
          <div className="min-w-0 flex-1">{actions}</div>
        </div>
      </div>
    </>
  );
}
