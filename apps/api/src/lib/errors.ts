import type { Response } from "express";

interface PostgrestLikeError {
  message: string;
  code?: string;
}

/**
 * Maps common Postgres/PostgREST error codes to the right HTTP status.
 * Without this, a duplicate-key insert or an RLS policy rejection both fell
 * through to a generic 500 with the raw Postgres error text — confusing for
 * clients and misleading in server logs (these are client-caused 4xx cases,
 * not server crashes).
 */
export function sendDbError(res: Response, error: PostgrestLikeError) {
  switch (error.code) {
    case "23505": // unique_violation
      res.status(409).json({ error: "Data sudah ada atau bentrok dengan data lain." });
      return;
    case "42501": // insufficient_privilege (RLS policy rejection)
      res.status(403).json({ error: "Kamu tidak punya izin untuk melakukan aksi ini." });
      return;
    case "22P02": // invalid_text_representation (e.g. malformed UUID)
    case "22007": // invalid_datetime_format
      res.status(400).json({ error: "Format data pada permintaan tidak valid." });
      return;
    default:
      res.status(500).json({ error: error.message });
  }
}
