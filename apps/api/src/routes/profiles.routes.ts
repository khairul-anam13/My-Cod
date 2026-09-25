import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { sendDbError } from "../lib/errors.js";
import { evaluateAndLogLocation } from "../lib/locationTrust.js";

export const profilesRouter = Router();

// Explicit column list — the table also has a generated `location` geography
// column (raw PostGIS WKB) that clients have no use for.
const PROFILE_COLUMNS =
  "id, phone_number, name, profile_photo_url, city, lat, lng, is_verified, identity_verified, rating_avg, created_at";

// My COD only serves Kabupaten Karanganyar (see location master data
// migration) — "city" predates the district/village system and is now just
// a legacy display label, no longer meaningful as free text from the user.
const SERVICE_AREA_CITY = "Kabupaten Karanganyar";

const upsertProfileSchema = z.object({
  name: z.string().min(1).max(80),
  phone_number: z.string().min(8).max(20),
  city: z.string().min(1).max(80).optional(),
  lat: z.number(),
  lng: z.number(),
  profile_photo_url: z.string().url().optional(),
});

// Public profile (name, city, rating, verified badge) — shown on listings/chat.
profilesRouter.get("/:id", async (req, res) => {
  const { data, error } = await req.supabase
    .from("profiles")
    .select(
      "id, name, profile_photo_url, city, is_verified, identity_verified, rating_avg, created_at",
    )
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Profil tidak ditemukan." });
    return;
  }
  res.json(data);
});

profilesRouter.get("/me/profile", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", req.userId)
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});

// Onboarding step after login: pick a name/phone/city/area (PRD 4.3).
//
// NOTE on `is_verified`: despite the PRD's phone-verification framing (2.2 /
// 7.2), actual login is email OTP (see apps/web login page) and this phone
// number is self-reported, not confirmed via SMS — there's no real phone
// provider wired up (config.toml's Twilio credentials are placeholders, and
// local Supabase disables phone auth entirely without one). So `is_verified`
// here really just means "completed onboarding", not "phone verified". Don't
// read more trust into it than that until real SMS verification is added.
profilesRouter.put("/me/profile", requireAuth, async (req, res) => {
  const parsed = upsertProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data tidak valid.", details: parsed.error.flatten() });
    return;
  }

  const { data, error } = await req.supabase
    .from("profiles")
    .upsert(
      {
        id: req.userId,
        is_verified: true,
        ...parsed.data,
        city: parsed.data.city ?? SERVICE_AREA_CITY,
      },
      { onConflict: "id" },
    )
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      res.status(409).json({ error: "Nomor HP sudah dipakai akun lain." });
      return;
    }
    sendDbError(res, error);
    return;
  }
  res.status(200).json(data);
});

// ---------------------------------------------------------------------------
// Address — district/village/detail/home-location, gated by a 30-day
// update cooldown (separate from the rest of the profile, which has none).
// ---------------------------------------------------------------------------
const ADDRESS_COLUMNS = "district_id, village_id, address_detail, lat, lng, last_address_updated_at";
const ADDRESS_UPDATE_COOLDOWN_DAYS = 30;

function addressCooldown(lastUpdatedAt: string | null) {
  if (!lastUpdatedAt) {
    return { canUpdateNow: true, nextUpdateAllowedAt: null as string | null };
  }
  const nextAllowedMs =
    new Date(lastUpdatedAt).getTime() + ADDRESS_UPDATE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  return {
    canUpdateNow: Date.now() >= nextAllowedMs,
    nextUpdateAllowedAt: new Date(nextAllowedMs).toISOString(),
  };
}

function formatIndonesianDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }) + " WIB";
}

profilesRouter.get("/me/address", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from("profiles")
    .select(ADDRESS_COLUMNS)
    .eq("id", req.userId)
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  if (!data) {
    res.json({
      district_id: null,
      village_id: null,
      address_detail: null,
      lat: null,
      lng: null,
      last_address_updated_at: null,
      can_update_now: true,
      next_update_allowed_at: null,
    });
    return;
  }

  const { canUpdateNow, nextUpdateAllowedAt } = addressCooldown(data.last_address_updated_at);
  res.json({ ...data, can_update_now: canUpdateNow, next_update_allowed_at: nextUpdateAllowedAt });
});

const upsertAddressSchema = z.object({
  district_id: z.string().uuid(),
  village_id: z.string().uuid(),
  address_detail: z.string().min(3).max(300),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nullable().optional(),
});

profilesRouter.put("/me/address", requireAuth, async (req, res) => {
  const parsed = upsertAddressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data alamat tidak valid.", details: parsed.error.flatten() });
    return;
  }

  const { data: existing, error: fetchError } = await req.supabase
    .from("profiles")
    .select("last_address_updated_at")
    .eq("id", req.userId)
    .maybeSingle();

  if (fetchError) {
    sendDbError(res, fetchError);
    return;
  }
  if (!existing) {
    res.status(404).json({ error: "Lengkapi profil dasar (nama & nomor HP) dulu sebelum mengatur alamat." });
    return;
  }

  const { canUpdateNow, nextUpdateAllowedAt } = addressCooldown(existing.last_address_updated_at);
  if (!canUpdateNow) {
    res.status(403).json({
      error: `Alamat cuma bisa diubah sekali tiap 30 hari. Kamu bisa mengubahnya lagi mulai ${formatIndonesianDateTime(nextUpdateAllowedAt!)}.`,
      next_update_allowed_at: nextUpdateAllowedAt,
    });
    return;
  }

  // Friendlier than letting the DB trigger's raw exception surface — same
  // rule enforced twice, this one just reads better.
  const { data: village, error: villageError } = await req.supabase
    .from("villages")
    .select("id")
    .eq("id", parsed.data.village_id)
    .eq("district_id", parsed.data.district_id)
    .maybeSingle();

  if (villageError) {
    sendDbError(res, villageError);
    return;
  }
  if (!village) {
    res.status(400).json({ error: "Kelurahan/Desa yang dipilih tidak sesuai dengan Kecamatan." });
    return;
  }

  const now = new Date().toISOString();
  const { data, error } = await req.supabase
    .from("profiles")
    .update({
      district_id: parsed.data.district_id,
      village_id: parsed.data.village_id,
      address_detail: parsed.data.address_detail,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      last_address_updated_at: now,
    })
    .eq("id", req.userId)
    .select(ADDRESS_COLUMNS)
    .single();

  if (error) {
    sendDbError(res, error);
    return;
  }

  void evaluateAndLogLocation({
    userId: req.userId!,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    accuracy: parsed.data.accuracy ?? null,
    ip: req.ip ?? "",
    source: "address",
    supabase: req.supabase,
  });

  const { nextUpdateAllowedAt: nextAfterThis } = addressCooldown(now);
  res.json({ ...data, can_update_now: false, next_update_allowed_at: nextAfterThis });
});
