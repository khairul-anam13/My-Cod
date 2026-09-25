import { Router } from "express";
import { z } from "zod";
import { sendDbError } from "../lib/errors.js";
import { reverseGeocode, searchGeocode } from "../lib/nominatim.js";

export const locationsRouter = Router();

// Kecamatan — Kabupaten Karanganyar only (this app's whole service area).
locationsRouter.get("/districts", async (req, res) => {
  const { data, error } = await req.supabase
    .from("districts")
    .select("id, code, name")
    .order("name");

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});

const villagesQuerySchema = z.object({
  district_id: z.string().uuid(),
});

// Kelurahan/Desa for a given kecamatan — the frontend loads this after the
// user picks a Kecamatan (cascading dropdown).
locationsRouter.get("/villages", async (req, res) => {
  const parsed = villagesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "district_id (uuid) diperlukan." });
    return;
  }

  const { data, error } = await req.supabase
    .from("villages")
    .select("id, district_id, code, name")
    .eq("district_id", parsed.data.district_id)
    .order("name");

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});

const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

// Suggests an address_detail string for a map pin — the user can still edit
// it, this is a convenience fill-in, not authoritative.
locationsRouter.get("/geocode/reverse", async (req, res) => {
  const parsed = reverseGeocodeQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "lat dan lng diperlukan." });
    return;
  }

  try {
    const display_name = await reverseGeocode(parsed.data.lat, parsed.data.lng);
    res.json({ display_name });
  } catch {
    res.status(502).json({ error: "Gagal mengambil alamat dari Nominatim." });
  }
});

const searchGeocodeQuerySchema = z.object({
  q: z.string().min(3).max(200),
});

locationsRouter.get("/geocode/search", async (req, res) => {
  const parsed = searchGeocodeQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "q (min. 3 karakter) diperlukan." });
    return;
  }

  try {
    const results = await searchGeocode(parsed.data.q);
    res.json(results);
  } catch {
    res.status(502).json({ error: "Gagal mencari alamat dari Nominatim." });
  }
});
