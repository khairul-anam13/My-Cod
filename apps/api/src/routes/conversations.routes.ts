import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireVerified } from "../middleware/auth.js";
import { sendDbError } from "../lib/errors.js";

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth);

conversationsRouter.get("/", async (req, res) => {
  const { data, error } = await req.supabase
    .from("conversations")
    .select(
      "*, listing:listings(id, title, price, photos, status), buyer:profiles!conversations_buyer_id_fkey(id, name, profile_photo_url, is_verified), seller:profiles!conversations_seller_id_fkey(id, name, profile_photo_url, is_verified), messages(content, sent_at)",
    )
    .or(`buyer_id.eq.${req.userId},seller_id.eq.${req.userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    sendDbError(res, error);
    return;
  }

  // Collapse the embedded messages array down to just the latest one per
  // conversation for the inbox preview — done in JS rather than relying on
  // PostgREST's embedded order/limit modifiers on an aliased relation.
  const withLastMessage = data.map(({ messages, ...conversation }) => ({
    ...conversation,
    last_message: messages.length
      ? messages.reduce((latest: typeof messages[number], m: typeof messages[number]) =>
          m.sent_at > latest.sent_at ? m : latest,
        )
      : null,
  }));

  res.json(withLastMessage);
});

conversationsRouter.get("/:id", async (req, res) => {
  const { data, error } = await req.supabase
    .from("conversations")
    .select(
      "*, listing:listings(id, title, price, photos, status), buyer:profiles!conversations_buyer_id_fkey(id, name, profile_photo_url), seller:profiles!conversations_seller_id_fkey(id, name, profile_photo_url), meetups:cod_meetups(*)",
    )
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Percakapan tidak ditemukan." });
    return;
  }
  res.json(data);
});

const startConversationSchema = z.object({
  listing_id: z.string().uuid(),
});

// Chat is how a buyer reaches a seller — no phone numbers exchanged upfront (PRD 3.1 #4).
conversationsRouter.post("/", requireVerified, async (req, res) => {
  const parsed = startConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "listing_id diperlukan." });
    return;
  }

  const { data: listing, error: listingError } = await req.supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", parsed.data.listing_id)
    .maybeSingle();

  if (listingError) {
    sendDbError(res, listingError);
    return;
  }
  if (!listing) {
    res.status(404).json({ error: "Barang tidak ditemukan." });
    return;
  }
  if (listing.seller_id === req.userId) {
    res.status(400).json({ error: "Tidak bisa chat dengan diri sendiri." });
    return;
  }

  const { data, error } = await req.supabase
    .from("conversations")
    .upsert(
      { listing_id: listing.id, buyer_id: req.userId, seller_id: listing.seller_id },
      { onConflict: "listing_id,buyer_id" },
    )
    .select("*")
    .single();

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.status(201).json(data);
});

conversationsRouter.get("/:id/messages", async (req, res) => {
  const { data, error } = await req.supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", req.params.id)
    .order("sent_at", { ascending: true });

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

conversationsRouter.post("/:id/messages", requireVerified, async (req, res) => {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Isi pesan diperlukan." });
    return;
  }

  const { data, error } = await req.supabase
    .from("messages")
    .insert({
      conversation_id: req.params.id,
      sender_id: req.userId,
      content: parsed.data.content,
    })
    .select("*")
    .single();

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.status(201).json(data);
});

// PRD 3.1 #5 — set jadwal + titik temu COD langsung dari chat.
const createMeetupSchema = z.object({
  meetup_location: z.string().min(1).max(200),
  meetup_time: z.string().datetime(),
});

conversationsRouter.post("/:id/meetup", async (req, res) => {
  const parsed = createMeetupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Lokasi dan waktu COD diperlukan." });
    return;
  }

  const { data, error } = await req.supabase
    .from("cod_meetups")
    .insert({ conversation_id: req.params.id, ...parsed.data })
    .select("*")
    .single();

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.status(201).json(data);
});

const updateMeetupSchema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

conversationsRouter.patch("/:id/meetup/:meetupId", async (req, res) => {
  const parsed = updateMeetupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Status tidak valid." });
    return;
  }

  const { data, error } = await req.supabase
    .from("cod_meetups")
    .update({ status: parsed.data.status })
    .eq("id", req.params.meetupId)
    .eq("conversation_id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    sendDbError(res, error);
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Jadwal COD tidak ditemukan." });
    return;
  }
  res.json(data);
});
