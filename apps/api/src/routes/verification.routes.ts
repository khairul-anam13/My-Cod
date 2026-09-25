import { createHash, randomInt } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { sendDbError } from "../lib/errors.js";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { normalizeIndonesianPhoneForWhatsApp, sendOtpMessage } from "../lib/whatsapp.js";

export const verificationRouter = Router();
verificationRouter.use(requireAuth);

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const SIGNED_URL_TTL_SECONDS = 300;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

verificationRouter.get("/me", async (req, res) => {
  const { data, error } = await req.supabase
    .from("identity_verifications")
    .select("status, phone_verified_at, rejection_reason, submitted_at, reviewed_at")
    .eq("user_id", req.userId)
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});

const sendOtpSchema = z.object({
  phone_number: z.string().min(8).max(20),
});

verificationRouter.post("/phone/send-otp", async (req, res) => {
  const parsed = sendOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Nomor HP tidak valid." });
    return;
  }

  const { data: recent, error: recentError } = await req.supabase
    .from("phone_otp_codes")
    .select("created_at")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentError) {
    sendDbError(res, recentError);
    return;
  }
  if (recent && Date.now() - new Date(recent.created_at).getTime() < OTP_RESEND_COOLDOWN_MS) {
    res.status(429).json({ error: "Tunggu sebentar sebelum minta kode baru." });
    return;
  }

  const code = randomInt(100_000, 1_000_000).toString();

  const { error: insertError } = await req.supabase.from("phone_otp_codes").insert({
    user_id: req.userId,
    phone_number: parsed.data.phone_number,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  if (insertError) {
    sendDbError(res, insertError);
    return;
  }

  try {
    await sendOtpMessage(normalizeIndonesianPhoneForWhatsApp(parsed.data.phone_number), code);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Gagal mengirim kode via WhatsApp." });
    return;
  }

  res.status(202).json({ sent: true });
});

const verifyOtpSchema = z.object({
  code: z.string().length(6),
});

verificationRouter.post("/phone/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Kode OTP tidak valid." });
    return;
  }

  const { data: otp, error: otpError } = await req.supabase
    .from("phone_otp_codes")
    .select("id, code_hash, expires_at, attempts")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError) {
    sendDbError(res, otpError);
    return;
  }
  if (!otp || new Date(otp.expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: "Kode OTP kedaluwarsa. Minta kode baru." });
    return;
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(429).json({ error: "Terlalu banyak percobaan. Minta kode baru." });
    return;
  }
  if (otp.code_hash !== hashCode(parsed.data.code)) {
    await req.supabase
      .from("phone_otp_codes")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id);
    res.status(400).json({ error: "Kode OTP salah." });
    return;
  }

  const { error: upsertError } = await req.supabase
    .from("identity_verifications")
    .upsert({ user_id: req.userId, phone_verified_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (upsertError) {
    sendDbError(res, upsertError);
    return;
  }
  res.json({ verified: true });
});

const submitIdentitySchema = z.object({
  ktp_photo_path: z.string().min(1),
  selfie_photo_path: z.string().min(1),
});

verificationRouter.post("/identity", async (req, res) => {
  const parsed = submitIdentitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Foto KTP dan selfie diperlukan." });
    return;
  }

  const { data, error } = await req.supabase
    .from("identity_verifications")
    .upsert(
      {
        user_id: req.userId,
        ktp_photo_path: parsed.data.ktp_photo_path,
        selfie_photo_path: parsed.data.selfie_photo_path,
        status: "pending",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("status, submitted_at")
    .single();

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.status(201).json(data);
});

// --- Admin review queue ---------------------------------------------------

verificationRouter.get("/queue", requireAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("identity_verifications")
    .select(
      "id, user_id, status, ktp_photo_path, selfie_photo_path, phone_verified_at, submitted_at, profile:profiles(name, phone_number)",
    )
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  if (error) {
    sendDbError(res, error);
    return;
  }

  const withSignedUrls = await Promise.all(
    data.map(async (row) => {
      const [ktp, selfie] = await Promise.all([
        row.ktp_photo_path
          ? supabaseAdmin.storage.from("identity-documents").createSignedUrl(row.ktp_photo_path, SIGNED_URL_TTL_SECONDS)
          : null,
        row.selfie_photo_path
          ? supabaseAdmin.storage
              .from("identity-documents")
              .createSignedUrl(row.selfie_photo_path, SIGNED_URL_TTL_SECONDS)
          : null,
      ]);
      return {
        ...row,
        ktp_photo_url: ktp?.data?.signedUrl ?? null,
        selfie_photo_url: selfie?.data?.signedUrl ?? null,
      };
    }),
  );

  res.json(withSignedUrls);
});

const reviewSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  rejection_reason: z.string().max(500).optional(),
});

verificationRouter.patch("/:id", requireAdmin, async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Status tidak valid." });
    return;
  }
  if (parsed.data.status === "rejected" && !parsed.data.rejection_reason) {
    res.status(400).json({ error: "Alasan penolakan diperlukan." });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("identity_verifications")
    .update({
      status: parsed.data.status,
      rejection_reason: parsed.data.status === "rejected" ? parsed.data.rejection_reason : null,
      reviewed_by: req.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", req.params.id)
    .select("id, user_id, status")
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Pengajuan verifikasi tidak ditemukan." });
    return;
  }

  // Keep the public badge flag in sync with the review decision.
  await supabaseAdmin
    .from("profiles")
    .update({ identity_verified: parsed.data.status === "verified" })
    .eq("id", data.user_id);

  res.json(data);
});
