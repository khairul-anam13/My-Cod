"use client";

import { CalendarClock, ChevronLeft, MoreVertical, Plus, Send, UserRound } from "lucide-react";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/useSession";
import { apiFetch } from "@/lib/api";
import { formatRelativeTime, initials } from "@/lib/format";
import type { CodMeetup, Conversation, Listing, Message, Profile } from "@my-cod/shared-types";
import { ListingPreviewCard } from "./ListingPreviewCard";
import { MeetupPanel } from "./MeetupPanel";
import { QuickReplies } from "./QuickReplies";
import { SafetyReminder } from "./SafetyReminder";

const POLL_INTERVAL_MS = 4000;

type ConversationDetail = Conversation & {
  listing: Pick<Listing, "id" | "title" | "price" | "photos" | "status">;
  buyer: Pick<Profile, "id" | "name" | "profile_photo_url">;
  seller: Pick<Profile, "id" | "name" | "profile_photo_url">;
  meetups: CodMeetup[];
};

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Hari ini";
  if (sameDay(date, yesterday)) return "Kemarin";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const router = useRouter();
  const { session, user, loading: sessionLoading } = useSession();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(`/chat/${conversationId}`)}`);
    }
  }, [sessionLoading, session, router, conversationId]);

  useEffect(() => {
    if (!session) return;
    apiFetch<ConversationDetail>(`/conversations/${conversationId}`, {
      token: session.access_token,
    })
      .then(setConversation)
      .catch(() => {});
  }, [session, conversationId]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    async function poll() {
      try {
        const data = await apiFetch<Message[]>(`/conversations/${conversationId}/messages`, {
          token: session!.access_token,
        });
        if (!cancelled) setMessages(data);
      } catch {
        // Chat uses simple REST polling for MVP (PRD 5.3) — a transient
        // network error just waits for the next tick.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send(content: string) {
    if (!session || !content.trim()) return;
    setSending(true);
    try {
      const message = await apiFetch<Message>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        token: session.access_token,
        body: { content: content.trim() },
      });
      setMessages((prev) => [...(prev ?? []), message]);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  if (sessionLoading || !session) return null;

  const other = conversation && (user?.id === conversation.buyer.id ? conversation.seller : conversation.buyer);

  let lastDay = "";

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <header className="flex items-center gap-1 border-b border-border px-2 py-2">
        <Button
          onClick={() => router.back()}
          aria-label="Kembali"
          variant="ghost"
          size="icon-lg"
          className="shrink-0 rounded-full text-foreground hover:bg-surface-muted"
        >
          <ChevronLeft size={20} strokeWidth={2.25} />
        </Button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={other?.profile_photo_url ?? undefined} alt={other?.name ?? ""} />
            <AvatarFallback className="text-xs">
              {other ? initials(other.name) : <UserRound size={14} />}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-sm font-bold text-foreground">{other?.name ?? "Percakapan"}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Menu percakapan"
              variant="ghost"
              size="icon-lg"
              className="shrink-0 rounded-full text-foreground hover:bg-surface-muted"
            >
              <MoreVertical size={19} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {other && (
              <DropdownMenuItem asChild>
                <Link href={`/profile/${other.id}`}>Lihat Profil</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setShowMeetupForm((v) => !v)}>
              <CalendarClock size={14} />
              Atur Jadwal COD
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {conversation && (
        <ListingPreviewCard listing={conversation.listing} />
      )}

      {showMeetupForm && conversation && other && (
        <MeetupPanel
          conversationId={conversationId}
          token={session.access_token}
          initialMeetups={conversation.meetups}
          listingId={conversation.listing.id}
          otherUserId={other.id}
          onClose={() => setShowMeetupForm(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <SafetyReminder />

        {messages === null && <p className="px-4 py-3 text-sm text-muted-foreground">Memuat pesan…</p>}

        <ul className="flex flex-col gap-2 px-4 py-3">
          {messages?.map((m) => {
            const mine = m.sender_id === user?.id;
            const showDivider = dayLabel(m.sent_at) !== lastDay;
            lastDay = dayLabel(m.sent_at);

            return (
              <li key={m.id} className="flex flex-col gap-2">
                {showDivider && (
                  <p className="my-1 text-center text-[11px] font-medium text-muted-foreground">
                    {dayLabel(m.sent_at)}
                  </p>
                )}
                <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={other?.profile_photo_url ?? undefined} alt="" />
                      <AvatarFallback className="text-[10px]">
                        {other ? initials(other.name) : <UserRound size={12} />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      mine ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                    <p className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {formatRelativeTime(m.sent_at)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div ref={bottomRef} />
      </div>

      <QuickReplies onPick={send} disabled={sending} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Button
          type="button"
          onClick={() => setShowMeetupForm((v) => !v)}
          aria-label="Atur jadwal COD"
          variant="outline"
          size="icon-lg"
          className="h-10 w-10 shrink-0 rounded-full"
        >
          <Plus size={18} />
        </Button>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tulis pesan…"
          className="h-10 flex-1 rounded-full bg-surface px-4 text-sm"
        />
        <Button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Kirim"
          size="icon-lg"
          className="h-10 w-10 shrink-0 rounded-full"
        >
          <Send size={16} strokeWidth={2.25} />
        </Button>
      </form>
    </div>
  );
}
