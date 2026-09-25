"use client";

import { BadgeCheck, CircleAlert, Loader2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useSession";
import { apiFetch, ApiError } from "@/lib/api";
import type { VerificationQueueItem } from "@my-cod/shared-types";

/**
 * No client-side admin flag — `role` isn't exposed on the Profile type
 * because it's meaningless as a client-trust signal anyway. This page just
 * calls the admin-gated endpoint and reacts to the 403 `requireAdmin`
 * already enforces server-side (apps/api/src/middleware/auth.ts).
 */
export default function AdminVerificationPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();

  const [queue, setQueue] = useState<VerificationQueueItem[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace(`/login?next=${encodeURIComponent("/admin/verification")}`);
    }
  }, [sessionLoading, session, router]);

  useEffect(() => {
    if (!session) return;
    apiFetch<VerificationQueueItem[]>("/verification/queue", { token: session.access_token })
      .then(setQueue)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat antrian.");
      });
  }, [session]);

  async function review(id: string, status: "verified" | "rejected", rejectionReason?: string) {
    if (!session) return;
    try {
      await apiFetch(`/verification/${id}`, {
        method: "PATCH",
        token: session.access_token,
        body: { status, rejection_reason: rejectionReason },
      });
      setQueue((prev) => prev?.filter((item) => item.id !== id) ?? null);
      toast.success(status === "verified" ? "Disetujui." : "Ditolak.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan keputusan.");
    }
  }

  if (sessionLoading || !session) return null;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2 border-b border-border px-2 py-2">
        <BackButton />
        <div>
          <h1 className="text-base font-semibold text-foreground">Antrian Verifikasi Identitas</h1>
          <p className="text-xs text-muted-foreground">Khusus admin</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6">
        {forbidden && (
          <Alert variant="destructive" className="rounded-xl">
            <ShieldAlert size={15} />
            <AlertDescription>Halaman ini khusus admin.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <CircleAlert size={15} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!forbidden && !error && queue === null && (
          <Loader2 size={22} className="mx-auto animate-spin text-muted-foreground" />
        )}

        {queue?.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada pengajuan menunggu.</p>
        )}

        {queue?.map((item) => (
          <QueueCard key={item.id} item={item} onReview={review} />
        ))}
      </div>
    </div>
  );
}

function QueueCard({
  item,
  onReview,
}: {
  item: VerificationQueueItem;
  onReview: (id: string, status: "verified" | "rejected", rejectionReason?: string) => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    await onReview(item.id, "verified");
    setBusy(false);
  }

  async function reject() {
    if (!reason.trim()) return;
    setBusy(true);
    await onReview(item.id, "rejected", reason.trim());
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3 border-2 border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bold text-foreground">{item.profile.name}</p>
          <p className="text-xs text-muted-foreground">{item.profile.phone_number}</p>
        </div>
        {item.phone_verified_at ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-accent">
            <BadgeCheck size={13} />
            HP terverifikasi
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">HP belum diverifikasi</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <PhotoTile label="KTP" url={item.ktp_photo_url} />
        <PhotoTile label="Selfie" url={item.selfie_photo_url} />
      </div>

      {!rejecting ? (
        <div className="flex gap-2">
          <Button onClick={approve} disabled={busy} size="sm" className="h-9 flex-1 gap-1.5 text-xs">
            <ShieldCheck size={14} />
            Setujui
          </Button>
          <Button
            onClick={() => setRejecting(true)}
            disabled={busy}
            variant="outline"
            size="sm"
            className="h-9 flex-1 gap-1.5 text-xs text-danger"
          >
            <XCircle size={14} />
            Tolak
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Alasan penolakan…"
            rows={2}
            className="rounded-lg bg-surface-muted text-xs"
          />
          <div className="flex gap-2">
            <Button
              onClick={reject}
              disabled={busy || !reason.trim()}
              size="sm"
              className="h-9 flex-1 bg-danger text-xs hover:bg-danger-hover"
            >
              Kirim Penolakan
            </Button>
            <Button onClick={() => setRejecting(false)} variant="ghost" size="sm" className="h-9 text-xs">
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoTile({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- private signed URL, not worth a next/image remote-pattern for an admin-only page
        <img src={url} alt={label} className="aspect-[4/3] w-full border border-border object-cover" />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center border border-border bg-surface-muted text-[10px] text-muted-foreground">
          Tidak ada foto
        </div>
      )}
    </div>
  );
}
