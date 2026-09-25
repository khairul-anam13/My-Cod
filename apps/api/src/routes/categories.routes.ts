import { Router } from "express";
import { sendDbError } from "../lib/errors.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res) => {
  const { data, error } = await req.supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    sendDbError(res, error);
    return;
  }
  res.json(data);
});
