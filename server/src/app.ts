import "dotenv/config";
import express from "express";
import { authRouter } from "./modules/auth/index.js";
import { profileRouter } from "./modules/profile/index.js";
import { championshipRouter } from "./modules/championship/index.js";
import { friendRouter } from "./modules/friend/index.js";
import { playerLinkRouter } from "./modules/player-link/index.js";
import { globalRateLimit } from "./middleware/rate-limit.js";

const app = express();

// ---------------------------------------------------------------------------
// CORS — allow requests from the configured origin (or all origins in dev)
// ---------------------------------------------------------------------------
const corsOrigin = process.env["CORS_ORIGIN"];
app.use((req, res, next) => {
  const origin = corsOrigin ?? "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// ---------------------------------------------------------------------------
// Global rate limiting — 500 req / 15 min per IP across all routes
// ---------------------------------------------------------------------------
app.use(globalRateLimit);

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// API routes (registered per module in subsequent tasks)
// ---------------------------------------------------------------------------
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/championships", championshipRouter);
app.use("/api/championships", playerLinkRouter);
app.use("/api/friends", friendRouter);

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env["PORT"] ?? "3000", 10);

app.listen(PORT, () => {
  console.log(`Sorte.ar API listening on port ${PORT}`);
});

export default app;
