import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { sendDbError } from "../lib/errors.js";

export const reviewsRouter = Router();

reviewsRouter.get("/user/:userId", async (req, res) => {
  const { data, error } = await req.supabase
    .from("reviews")
    .select("*, reviewer:profiles!reviews_reviewer_id_fkey(id, name, profile_photo_url)")
    .eq("reviewed_user_id", req.params.userId)
    .order("created_at", { ascending: false });

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});

const createReviewSchema = z.object({
  listing_id: z.string().uuid(),
  reviewed_user_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// PRD 3.1 #6 — rating wajib pasca-transaksi, inti dari trust & retensi.
reviewsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Data ulasan tidak valid.", details: parsed.error.flatten() });
    return;
  }

  const { data, error } = await req.supabase
    .from("reviews")
    .insert({ ...parsed.data, reviewer_id: req.userId })
    .select("*")
    .single();

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.status(201).json(data);
});
