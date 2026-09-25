"use client";

import { BadgeCheck, ImageOff, MessagesSquare, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PrimaryHeader } from "@/components/layout/PrimaryHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useSession";
import { apiFetch } from "@/lib/api";
import { formatRelativeTime, initials } from "@/lib/format";
import type { Conversation, Listing, Message, Profile } from "@my-cod/shared-types";

type ConversationWithRelations = Conversation & {
  listing: Pick<Listing, "id" | "title" | "price" | "photos" | "status">;
  buyer: Pick<Profile, "id" | "name" | "profile_photo_url" | "is_verified">;
  seller: Pick<Profile, "id" | "name" | "profile_photo_url" | "is_verified">;
  last_message: Pick<Message, "content" | "sent_at"> | null;
};

export default function ChatListPage() {
  const router = useRouter();
  const { session, user, loading: sessionLoading } = useSession();
  const [conversations, setConversations] = useState<ConversationWithRelations[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent("/chat")}`);
      return;
    }
    apiFetch<ConversationWithRelations[]>("/conversations", { token: session.access_token }).then(
      setConversations,
    );
  }, [sessionLoading, session, router]);

  const filtered = useMemo(() => {
    if (!conversations) return null;
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const other = c.buyer.id === user?.id ? c.seller : c.buyer;
      return other.name.toLowerCase().includes(q) || c.listing.title.toLowerCase().includes(q);
    });
  }, [conversations, query, user?.id]);

  if (sessionLoading || !session) return null;

  return (
    <div className="flex flex-col">
      <PrimaryHeader title="Chat" />

      {conversations !== null && conversations.length > 0 && (
        <div className="px-4 pt-3 pb-1 md:pt-4">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-muted px-4 py-2.5 text-sm text-muted-foreground">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari chat…"
              className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      {conversations === null && (
        <ul className="mt-2 divide-y divide-border">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {conversations !== null && conversations.length === 0 && (
        <div className="mt-14 flex flex-col items-center gap-2 px-8 text-center">
          <MessagesSquare size={32} className="text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            Belum ada chat. Cari barang di beranda lalu tekan &quot;Chat Penjual&quot;.
          </p>
        </div>
      )}

      {filtered !== null && filtered.length === 0 && conversations !== null && conversations.length > 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">Tidak ada chat yang cocok.</p>
      )}

      <ul className="mt-1 divide-y divide-border">
        {filtered?.map((c) => {
          const other = c.buyer.id === user?.id ? c.seller : c.buyer;
          return (
            <li key={c.id}>
              <Link href={`/chat/${c.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-muted">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={other.profile_photo_url ?? undefined} alt={other.name} />
                  <AvatarFallback>{initials(other.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-foreground">{other.name}</p>
                    {other.is_verified && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-soft-foreground">
                        <BadgeCheck size={9} />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.last_message?.content ?? c.listing.title}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(c.last_message?.sent_at ?? c.created_at)}
                  </span>
                  <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-surface-muted text-muted-foreground">
                    {c.listing.photos[0] ? (
                      <Image src={c.listing.photos[0]} alt={c.listing.title} fill className="object-cover" />
                    ) : (
                      <ImageOff size={14} strokeWidth={1.5} />
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
