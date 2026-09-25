import type { NextFunction, Request, Response } from "express";
import { createSupabaseClientForRequest } from "../lib/supabaseClient.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      supabase: ReturnType<typeof createSupabaseClientForRequest>;
      userId?: string;
    }
  }
}

/** Attaches a request-scoped Supabase client and, if a valid bearer token is present, req.userId. */
export async function attachSupabase(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;

  req.supabase = createSupabaseClientForRequest(token);

  if (token) {
    const { data, error } = await req.supabase.auth.getUser(token);
    if (!error && data.user) {
      req.userId = data.user.id;
    }
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: "Login diperlukan." });
    return;
  }
  next();
}

/**
 * Must run after requireAuth. Gates posting/chat on having completed the
 * onboarding profile (PRD 2.2's "phone verification" in practice just means
 * this — see the note on PUT /profiles/me/profile for why).
 */
export async function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { data, error } = await req.supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", req.userId)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data?.is_verified) {
    res
      .status(403)
      .json({ error: "Lengkapi profil kamu dulu untuk melakukan aksi ini." });
    return;
  }
  next();
}
