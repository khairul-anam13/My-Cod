import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { attachSupabase } from "./middleware/auth.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

// A malformed JSON body is a client error, not a server crash — without this,
// express.json()'s SyntaxError falls through to the generic error handler
// below and comes back as a misleading 500.
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Format JSON pada permintaan tidak valid." });
    return;
  }
  next(err);
});

app.use(attachSupabase);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
