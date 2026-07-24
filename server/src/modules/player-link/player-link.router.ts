import { Router, type Request, type Response } from "express";
import { PlayerLinkService, AppError } from "./player-link.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { db } from "../../db/index.js";

// ---------------------------------------------------------------------------
// Singleton PlayerLinkService backed by the shared DB pool
// ---------------------------------------------------------------------------

const service = new PlayerLinkService(db);

// ---------------------------------------------------------------------------
// Error code → HTTP status mapping
// ---------------------------------------------------------------------------

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  AUTHORIZATION_FAILED: 403,
  CHAMPIONSHIP_FINISHED: 422,
  CONFLICT: 409,
  FRIEND_NOT_FOUND: 400,
  DB_SAVE_ERROR: 503,
};

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    const status = ERROR_STATUS[err.code] ?? 500;
    res.status(status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error("[player-link.router] Unexpected error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
  });
}

// ---------------------------------------------------------------------------
// Router — mergeParams so :id from the parent router is accessible
// ---------------------------------------------------------------------------

export const playerLinkRouter = Router({ mergeParams: true });

// All player-link routes require authentication
playerLinkRouter.use(authenticate);

/**
 * POST /api/championships/:id/links
 * Creates a Player_Link associating a player name to a registered friend.
 * Requirements: 6.1, 6.2, 6.5
 */
playerLinkRouter.post("/:id/links", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const championshipId = String(req.params["id"] ?? "");
    const { playerName, linkedUserEmail } = req.body as {
      playerName: string;
      linkedUserEmail: string;
    };
    const link = await service.createLink(championshipId, userId, playerName, linkedUserEmail);
    res.status(201).json(link);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * PATCH /api/championships/:id/links/:linkId
 * Replaces the linked user of an existing Player_Link.
 * Requirements: 6.6, 6.8, 6.9
 */
playerLinkRouter.patch("/:id/links/:linkId", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const championshipId = String(req.params["id"] ?? "");
    const linkId = String(req.params["linkId"] ?? "");
    const { email } = req.body as { email: string };
    const link = await service.updateLink(championshipId, linkId, userId, email);
    res.status(200).json(link);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * DELETE /api/championships/:id/links/:linkId
 * Removes a Player_Link.
 * Requirements: 6.6, 6.7, 6.8
 */
playerLinkRouter.delete("/:id/links/:linkId", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const championshipId = String(req.params["id"] ?? "");
    const linkId = String(req.params["linkId"] ?? "");
    await service.removeLink(championshipId, linkId, userId);
    res.status(204).send();
  } catch (err) {
    handleError(err, res);
  }
});
