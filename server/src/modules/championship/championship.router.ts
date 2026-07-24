import { Router, type Request, type Response } from "express";
import { ChampionshipService } from "./championship.service.js";
import { AppError } from "../auth/auth.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { db } from "../../db/index.js";
import { MigrationService } from "../migration/index.js";

// ---------------------------------------------------------------------------
// Singleton services backed by the shared DB pool
// ---------------------------------------------------------------------------

const championshipService = new ChampionshipService(db);
const migrationService = new MigrationService(db);

// ---------------------------------------------------------------------------
// Error code → HTTP status mapping
// ---------------------------------------------------------------------------

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  AUTHORIZATION_FAILED: 403,
  DB_SAVE_ERROR: 503,
};

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    const status = ERROR_STATUS[err.code] ?? 500;
    res.status(status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error("[championship.router] Unexpected error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const championshipRouter = Router();

// All championship routes require authentication
championshipRouter.use(authenticate);

/**
 * GET /api/championships
 * Lists championships for the authenticated user with cursor-based pagination.
 * Requirements 4.2, 4.9
 */
championshipRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const cursor = typeof req.query["cursor"] === "string" ? req.query["cursor"] : undefined;
    const result = await championshipService.list(userId, cursor);
    res.status(200).json(result);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/championships
 * Creates a new championship for the authenticated user.
 * Requirement 4.1
 */
championshipRouter.post("/", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const championship = await championshipService.create(userId, req.body);
    res.status(201).json(championship);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/championships/feed
 * Returns the Feed for the authenticated user: all championships where the
 * user is creator OR has a player_link, ordered by updated_at DESC.
 * Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
championshipRouter.get("/feed", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const feed = await championshipService.getFeed(userId);
    res.status(200).json(feed);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/championships/migrate
 * Migrates a batch of local championships from localStorage to the DB.
 * Requirements 8.1, 8.2, 8.3, 8.5
 */
championshipRouter.post("/migrate", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }

  const { championships } = req.body as { championships?: unknown };
  if (!Array.isArray(championships)) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "'championships' must be an array" },
    });
    return;
  }

  try {
    const result = await migrationService.migrateBatch(userId, championships);
    const status = result.skipped + result.failed === 0 ? 200 : 207;
    res.status(status).json(result);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/championships/:id
 * Returns a single championship by ID.
 * Requirement 4.3
 */
championshipRouter.get("/:id", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const id = String(req.params["id"] ?? "");
    const championship = await championshipService.get(id, userId);
    res.status(200).json(championship);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * PATCH /api/championships/:id
 * Updates championship score/state. Only the creator may modify.
 * Requirements 4.4, 4.5, 9.1
 */
championshipRouter.patch("/:id", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const id = String(req.params["id"] ?? "");
    await championshipService.updateScore(id, req.body, userId);
    res.status(200).json({ message: "Updated" });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * DELETE /api/championships/:id
 * Deletes a championship. Only the creator may delete.
 * Requirements 4.8, 9.1, 9.2
 */
championshipRouter.delete("/:id", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const id = String(req.params["id"] ?? "");
    await championshipService.delete(id, userId);
    res.status(204).send();
  } catch (err) {
    handleError(err, res);
  }
});
