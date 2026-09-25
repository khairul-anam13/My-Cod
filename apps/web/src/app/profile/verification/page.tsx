"use client";

import { BadgeCheck, CircleAlert, Clock, IdCard, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/useSession";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import type { IdentityVerification } from "@my-cod/shared-types";

const STATUS_LABEL: Record<IdentityVerification["status"], string> = {
  pending: "Menunggu ditinjau",
  verified: "Terverifikasi",
  rejected: "Ditolak",
};

export default function VerificationPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();

  const [status, setStatus] = useState<Pick<
    IdentityVerification,
    "status" | "phone_verified_at" | "rejection_reason" | "submitted_at"
  > | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Phone OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpStep, setOtpStep] = useState<"idle" | "sent">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // KTP + selfie
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace(`/login?next=${encodeURIComponent("/profile/verification")}`);
    }
  }, [sessionLoading, session, router]);

  useEffect(() => {
    if (!session) return;
    apiFetch<typeof status>("/verification/me", { token: session.access_token })
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setStatusLoading(false));
  }, [session]);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!session || phoneNumber.trim().length < 8) return;
    setOtpSending(true);
    setOtpError(null);
    try {
      await apiFetch("/verification/phone/send-otp", {
        method: "POST",
        token: session.access_token,
        body: { phone_number: phoneNumber.trim() },
      });
      setOtpStep("sent");
      toast.success("Kode OTP dikirim lewat WhatsApp.");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Gagal mengirim kode OTP.");
    } finally {
      setOtpSending(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!session || otpCode.trim().length !== 6) return;
    setOtpVerifying(true);
    setOtpError(null);
    try {
      await apiFetch("/verification/phone/verify-otp", {
        method: "POST",
        token: session.access_token,
        body: { code: otpCode.trim() },
      });
      toast.success("Nomor HP terverifikasi!");
      setOtpStep("idle");
      setOtpCode("");
      const next = await apiFetch<typeof status>("/verification/me", { token: session.access_token });
      setStatus(next);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Kode OTP salah atau kedaluwarsa.");
    } finally {
      setOtpVerifying(false);
    }
  }

  async function submitIdentity(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !ktpFile || !selfieFile) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const upload = async (file: File, label: string) => {
        const path = `${session.user.id}/${label}-${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from("identity-documents").upload(path, file);
        if (error) throw error;
        return path;
      };

      const [ktp_photo_path, selfie_photo_path] = await Promise.all([
        upload(ktpFile, "ktp"),
        upload(selfieFile, "selfie"),
      ]);

      const next = await apiFetch<typeof status>("/verification/identity", {
        method: "POST",
        token: session.access_token,
        body: { ktp_photo_path, selfie_photo_path },
      });
      setStatus(next);
      setKtpFile(null);
      setSelfieFile(null);
      if (ktpInputRef.current) ktpInputRef.current.value = "";
      if (selfieInputRef.current) selfieInputRef.current.value = "";
      toast.success("Verifikasi identitas terkirim — menunggu ditinjau.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal mengirim verifikasi identitas.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionLoading || !session) return null;

  const phoneVerified = Boolean(status?.phone_verified_at);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2 border-b border-border px-2 py-2">
        <BackButton />
        <div>
          <h1 className="text-base font-semibold text-foreground">Verifikasi Identitas</h1>
          <p className="text-xs text-muted-foreground">Dapatkan lencana Identitas Terverifikasi</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6">
        {statusLoading ? (
          <Loader2 size={22} className="mx-auto animate-spin text-muted-foreground" />
        ) : (
          status && (
            <Alert
              className={
                status.status === "verified"
                  ? "rounded-none border-2 border-accent/40 bg-accent-soft"
                  : status.status === "rejected"
                    ? "rounded-none border-2 border-danger/40 bg-danger-soft"
                    : "rounded-none border-2 border-primary/40 bg-primary-soft"
              }
            >
              {status.status === "verified" ? (
                <BadgeCheck size={15} className="text-accent" />
              ) : status.status === "rejected" ? (
                <CircleAlert size={15} className="text-danger" />
              ) : (
                <Clock size={15} className="text-primary-soft-foreground" />
              )}
              <AlertDescription>
                Status: {STATUS_LABEL[status.status]}
                {status.status === "rejected" && status.rejection_reason && (
                  <> — {status.rejection_reason}</>
                )}
              </AlertDescription>
            </Alert>
          )
        )}

        <section className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MessageCircle size={15} />
            1. Verifikasi Nomor HP (OTP via WhatsApp)
          </p>

          {phoneVerified ? (
            <p className="text-xs text-muted-foreground">Nomor HP sudah terverifikasi.</p>
          ) : otpStep === "idle" ? (
            <form onSubmit={sendOtp} className="flex flex-col gap-2">
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                required
                placeholder="08123456789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-11 rounded-none border-2 bg-surface text-base"
              />
              <Button type="submit" disabled={otpSending} variant="brutalist" className="h-11 text-sm">
                {otpSending && <Loader2 size={16} className="animate-spin" />}
                {otpSending ? "Mengirim…" : "Kirim Kode OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="flex flex-col gap-2">
              <Label htmlFor="otp">Kode OTP</Label>
              <Input
                id="otp"
                inputMode="numeric"
                required
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="h-11 rounded-none border-2 bg-surface text-base tracking-[0.4em]"
              />
              <Button type="submit" disabled={otpVerifying} variant="brutalist" className="h-11 text-sm">
                {otpVerifying && <Loader2 size={16} className="animate-spin" />}
                {otpVerifying ? "Memverifikasi…" : "Verifikasi Kode"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOtpStep("idle")} className="h-auto py-1 text-xs">
                Ganti nomor
              </Button>
            </form>
          )}

          {otpError && (
            <Alert variant="destructive" className="rounded-none border-2 border-danger">
              <CircleAlert size={15} />
              <AlertDescription>{otpError}</AlertDescription>
            </Alert>
          )}
        </section>

        <section className="flex flex-col gap-3 border-t-2 border-border pt-6">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <IdCard size={15} />
            2. Foto KTP &amp; Selfie
          </p>
          <p className="text-xs text-muted-foreground">
            Foto disimpan privat — cuma kamu dan admin peninjau yang bisa melihatnya.
          </p>

          <form onSubmit={submitIdentity} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ktp">Foto KTP</Label>
              <input
                ref={ktpInputRef}
                id="ktp"
                type="file"
                accept="image/*"
                capture="environment"
                required
                onChange={(e) => setKtpFile(e.target.files?.[0] ?? null)}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="selfie">Foto Selfie (pegang KTP)</Label>
              <input
                ref={selfieInputRef}
                id="selfie"
                type="file"
                accept="image/*"
                capture="user"
                required
                onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
              />
            </div>

            {submitError && (
              <Alert variant="destructive" className="rounded-none border-2 border-danger">
                <CircleAlert size={15} />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={submitting || !ktpFile || !selfieFile}
              variant="brutalist"
              className="h-11 text-sm"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <ShieldCheck size={16} />
              {submitting ? "Mengirim…" : "Kirim Verifikasi Identitas"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
