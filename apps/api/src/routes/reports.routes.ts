import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { sendDbError } from "../lib/errors.js";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

const createReportSchema = z
  .object({
    reported_user_id: z.string().uuid().optional(),
    reported_listing_id: z.string().uuid().optional(),
    reason: z.enum(["penipuan", "barang_tidak_sesuai", "no_show", "lainnya"]),
  })
  .refine((v) => v.reported_user_id || v.reported_listing_id, {
    message: "reported_user_id atau reported_listing_id diperlukan.",
  });

// PRD 3.1 #7 — laporan mudah diakses dari listing maupun profil pengguna.
reportsRouter.post("/", async (req, res) => {
  const parsed = createReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data laporan tidak valid.", details: parsed.error.flatten() });
    return;
  }

  const { data, error } = await req.supabase
    .from("reports")
    .insert({ ...parsed.data, reporter_id: req.userId })
    .select("*")
    .single();

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.status(201).json(data);
});

reportsRouter.get("/", async (req, res) => {
  const { data, error } = await req.supabase
    .from("reports")
    .select("*")
    .eq("reporter_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});
