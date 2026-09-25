import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireVerified } from "../middleware/auth.js";
import { sendDbError } from "../lib/errors.js";

export const listingsRouter = Router();

// Explicit column list everywhere instead of "*" — the table also has a
// generated `location` geography column (raw PostGIS WKB) that clients have
// no use for and shouldn't see over the wire.
const LISTING_COLUMNS =
  "id, seller_id, title, description, price, category_id, photos, lat, lng, status, created_at";

const listQuerySchema = z.object({
  seller_id: z.string().uuid().optional(),
});

// Used by the seller's public profile page to show their active listings.
listingsRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parameter tidak valid." });
    return;
  }

  let query = req.supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .order("created_at", { ascending: false });

  if (parsed.data.seller_id) {
    query = query.eq("seller_id", parsed.data.seller_id);
  }

  const { data, error } = await query;
  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().positive().max(100).optional(),
  category_id: z.string().uuid().optional(),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().nonnegative().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

// PRD 3.1 #1 — the core feature: nearby listings, closest first.
listingsRouter.get("/nearby", async (req, res) => {
  const parsed = nearbyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Parameter pencarian tidak valid.", details: parsed.error.flatten() });
    return;
  }
  const q = parsed.data;

  const { data, error } = await req.supabase.rpc("nearby_listings", {
    p_lat: q.lat,
    p_lng: q.lng,
    p_radius_km: q.radius_km ?? 10,
    p_category_id: q.category_id ?? null,
    p_min_price: q.min_price ?? null,
    p_max_price: q.max_price ?? null,
    p_limit: q.limit ?? 20,
    p_offset: q.offset ?? 0,
  });

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});

listingsRouter.get("/:id", async (req, res) => {
  const { data, error } = await req.supabase
    .from("listings")
    .select(
      `${LISTING_COLUMNS}, seller:profiles!listings_seller_id_fkey(id, name, profile_photo_url, city, is_verified, rating_avg), category:categories(id, name, icon)`,
    )
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Barang tidak ditemukan." });
    return;
  }
  res.json(data);
});

const createListingSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).default(""),
  price: z.number().int().nonnegative(),
  category_id: z.string().uuid(),
  photos: z.array(z.string().url()).min(1).max(10),
  lat: z.number(),
  lng: z.number(),
});

// Posting requires a verified phone number (PRD 2.2 / 3.1 #3).
listingsRouter.post("/", requireAuth, requireVerified, async (req, res) => {
  const parsed = createListingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data barang tidak valid.", details: parsed.error.flatten() });
    return;
  }

  const { data, error } = await req.supabase
    .from("listings")
    .insert({ ...parsed.data, seller_id: req.userId })
    .select(LISTING_COLUMNS)
    .single();

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.status(201).json(data);
});

const updateListingSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).default(""),
  price: z.number().int().nonnegative(),
  category_id: z.string().uuid(),
  photos: z.array(z.string().url()).min(1).max(10),
});

// Content edit for a listing you own (title/price/description/category/photos).
// Location is intentionally not editable here — re-posting is how you'd move it.
listingsRouter.patch("/:id", requireAuth, async (req, res) => {
  const parsed = updateListingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data barang tidak valid.", details: parsed.error.flatten() });
    return;
  }

  const { data, error } = await req.supabase
    .from("listings")
    .update(parsed.data)
    .eq("id", req.params.id)
    .select(LISTING_COLUMNS)
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Barang tidak ditemukan atau bukan milik Anda." });
    return;
  }
  res.json(data);
});

const updateStatusSchema = z.object({
  status: z.enum(["available", "reserved", "sold"]),
});

listingsRouter.patch("/:id/status", requireAuth, async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Status tidak valid." });
    return;
  }

  const { data, error } = await req.supabase
    .from("listings")
    .update({ status: parsed.data.status })
    .eq("id", req.params.id)
    .select(LISTING_COLUMNS)
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Barang tidak ditemukan atau bukan milik Anda." });
    return;
  }
  res.json(data);
});

listingsRouter.delete("/:id", requireAuth, async (req, res) => {
  const { error, count } = await req.supabase
    .from("listings")
    .delete({ count: "exact" })
    .eq("id", req.params.id);

  if (error) {
    sendDbError(res, error);
    return;
  }
  if (!count) {
    res.status(404).json({ error: "Barang tidak ditemukan atau bukan milik Anda." });
    return;
  }
  res.status(204).send();
});
