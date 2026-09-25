import { Router } from "express";
import { z } from "zod";
import { sendDbError } from "../lib/errors.js";

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
