"use client";

import { CalendarClock, CircleCheck, Loader2, MapPin, Star, X, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { CodMeetup, CodMeetupStatus } from "@my-cod/shared-types";

const STATUS_LABEL: Record<CodMeetupStatus, string> = {
  scheduled: "Terjadwal",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_STYLE: Record<CodMeetupStatus, string> = {
  scheduled: "bg-primary-soft text-primary-soft-foreground",
  completed: "bg-surface-muted text-muted-foreground",
  cancelled: "bg-danger-soft text-danger-soft-foreground",
};

export function MeetupPanel({
  conversationId,
  token,
  initialMeetups,
  listingId,
  otherUserId,
  onClose,
}: {
  conversationId: string;
  token: string;
  initialMeetups: CodMeetup[];
  listingId: string;
  otherUserId: string;
  onClose: () => void;
}) {
  const [meetups, setMeetups] = useState(initialMeetups);
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewedMeetupIds, setReviewedMeetupIds] = useState<Set<string>>(new Set());

  async function createMeetup(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim() || !time) return;
    setSubmitting(true);
    try {
      const meetup = await apiFetch<CodMeetup>(`/conversations/${conversationId}/meetup`, {
        method: "POST",
        token,
        body: { meetup_location: location.trim(), meetup_time: new Date(time).toISOString() },
      });
      setMeetups((prev) => [meetup, ...prev]);
      setLocation("");
      setTime("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan jadwal COD.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(meetupId: string, status: CodMeetupStatus) {
    const updated = await apiFetch<CodMeetup>(`/conversations/${conversationId}/meetup/${meetupId}`, {
      method: "PATCH",
      token,
      body: { status },
    });
    setMeetups((prev) => prev.map((m) => (m.id === meetupId ? updated : m)));
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-primary-soft/40 p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <CalendarClock size={14} />
          Jadwal COD
        </p>
        <Button onClick={onClose} aria-label="Tutup" variant="ghost" size="icon-sm" className="text-muted-foreground">
          <X size={16} />
        </Button>
      </div>

      {meetups.length === 0 && <p className="text-xs text-muted-foreground">Belum ada jadwal COD.</p>}

      <ul className="flex flex-col gap-2">
        {meetups.map((m) => (
          <li key={m.id} className="rounded-xl bg-surface p-2.5 text-sm shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <MapPin size={13} className="shrink-0 text-muted-foreground" />
                {m.meetup_location}
              </span>
              <Badge className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[m.status]}`}>
                {STATUS_LABEL[m.status]}
              </Badge>
            </div>
            <p className="ml-[19px] text-xs text-muted-foreground">
              {new Date(m.meetup_time).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
            </p>

            {m.status === "scheduled" && (
              <div className="mt-2 flex gap-2">
                <Button
                  onClick={() => updateStatus(m.id, "completed")}
                  size="sm"
                  className="h-auto gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                >
                  <CircleCheck size={13} />
                  Tandai Selesai
                </Button>
                <Button
                  onClick={() => updateStatus(m.id, "cancelled")}
                  variant="secondary"
                  size="sm"
                  className="h-auto gap-1 rounded-lg px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <XCircle size={13} />
                  Batalkan
                </Button>
              </div>
            )}

            {m.status === "completed" && !reviewedMeetupIds.has(m.id) && (
              <ReviewForm
                token={token}
                listingId={listingId}
                reviewedUserId={otherUserId}
                onDone={() => setReviewedMeetupIds((prev) => new Set(prev).add(m.id))}
              />
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={createMeetup} className="flex flex-col gap-2">
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Titik ketemu (mis. minimarket X)"
          className="h-auto rounded-lg bg-surface px-3 py-2 text-sm"
        />
        <Input
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-auto rounded-lg bg-surface px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={submitting} size="sm" className="h-auto rounded-lg py-2 text-sm font-medium">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? "Menyimpan…" : "Simpan Jadwal"}
        </Button>
      </form>
    </div>
  );
}

function ReviewForm({
  token,
  listingId,
  reviewedUserId,
  onDone,
}: {
  token: string;
  listingId: string;
  reviewedUserId: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await apiFetch("/reviews", {
        method: "POST",
        token,
        body: { listing_id: listingId, reviewed_user_id: reviewedUserId, rating, comment: comment || undefined },
      });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim ulasan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-accent-soft p-2">
      <p className="text-xs font-medium text-foreground">Transaksi selesai — beri rating:</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} bintang`}>
            <Star size={18} className={n <= rating ? "fill-accent text-accent" : "fill-border text-border"} />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ulasan (opsional)"
        rows={2}
        className="rounded bg-surface px-2 py-1 text-xs"
      />
      <Button
        onClick={submit}
        disabled={submitting}
        size="sm"
        className="h-auto rounded bg-accent py-1.5 text-xs font-medium text-[#0D0F12] hover:bg-accent/85"
      >
        {submitting && <Loader2 size={12} className="animate-spin" />}
        {submitting ? "Mengirim…" : "Kirim Ulasan"}
      </Button>
    </div>
  );
}
