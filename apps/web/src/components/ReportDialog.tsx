"use client";

import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSession } from "@/hooks/useSession";
import { apiFetch } from "@/lib/api";
import type { ReportReason } from "@my-cod/shared-types";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "penipuan", label: "Penipuan" },
  { value: "barang_tidak_sesuai", label: "Barang tidak sesuai" },
  { value: "no_show", label: "Tidak muncul saat COD" },
  { value: "lainnya", label: "Lainnya" },
];

type ReportTarget = { reported_listing_id: string } | { reported_user_id: string };

export function ReportDialog({
  target,
  triggerLabel = "Laporkan",
  backHref,
}: {
  target: ReportTarget;
  triggerLabel?: string;
  backHref: string;
}) {
  const router = useRouter();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("penipuan");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!session) {
      setOpen(false);
      router.push(`/login?next=${encodeURIComponent(backHref)}`);
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/reports", {
        method: "POST",
        token: session.access_token,
        body: { ...target, reason },
      });
      toast.success("Laporan terkirim, tim kami akan meninjau.");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim laporan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto gap-1.5 self-center px-2 py-1 text-xs font-normal text-muted-foreground">
          <Flag size={13} />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan</DialogTitle>
          <DialogDescription>Pilih alasan laporan kamu. Tim kami akan meninjau laporan ini.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
          {REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-2.5 text-sm text-foreground">
              <RadioGroupItem value={r.value} />
              {r.label}
            </label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button type="button" variant="destructive" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Mengirim…" : "Kirim laporan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
