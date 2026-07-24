import { Router, type Request, type Response } from "express";
import { FriendService } from "./friend.service.js";
import { AppError } from "../auth/auth.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { db } from "../../db/index.js";

// ---------------------------------------------------------------------------
// Singleton FriendService backed by the shared DB pool
// ---------------------------------------------------------------------------

const friendService = new FriendService(db);

// ---------------------------------------------------------------------------
// Error code → HTTP status mapping
// ---------------------------------------------------------------------------

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  AUTHORIZATION_FAILED: 403,
};

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    const status = ERROR_STATUS[err.code] ?? 500;
    res.status(status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error("[friend.router] Unexpected error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
  });
}

// ---------------------------------------------------------------------------
// Router — all routes require authentication
// ---------------------------------------------------------------------------

export const friendRouter = Router();

friendRouter.use(authenticate);

/**
 * GET /api/friends
 * Returns the authenticated user's accepted friends list, ordered alphabetically.
 * Requirement 5.9
 */
friendRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const friends = await friendService.listFriends(userId);
    res.status(200).json({ friends });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/friends/requests
 * Sends a friend request to the user identified by email.
 * Requirements 5.1, 5.2, 5.3, 5.4
 */
friendRouter.post("/requests", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "email is required" } });
      return;
    }
    const request = await friendService.sendRequest(userId, email);
    res.status(201).json(request);
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/friends/requests/pending
 * Returns pending friend requests received by the authenticated user.
 * Requirement 5.1
 */
friendRouter.get("/requests/pending", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const requests = await friendService.listPendingRequests(userId);
    res.status(200).json({ requests });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/friends/requests/:id/accept
 * Accepts a pending friend request. Establishes bidirectional friendship.
 * Requirement 5.5
 */
friendRouter.post("/requests/:id/accept", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const id = String(req.params["id"] ?? "");
    await friendService.acceptRequest(id, userId);
    res.status(200).json({ message: "Request accepted" });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/friends/requests/:id/reject
 * Rejects a pending friend request. Silently succeeds if already non-PENDING.
 * Requirements 5.6, 5.7
 */
friendRouter.post("/requests/:id/reject", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const id = String(req.params["id"] ?? "");
    await friendService.rejectRequest(id, userId);
    res.status(200).json({ message: "Request rejected" });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * DELETE /api/friends/:friendId
 * Removes an existing friendship between the authenticated user and the specified friend.
 * Requirement 5.8
 */
friendRouter.delete("/:friendId", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Unauthorized" } });
    return;
  }
  try {
    const friendId = String(req.params["friendId"] ?? "");
    await friendService.removeFriend(userId, friendId);
    res.status(204).send();
  } catch (err) {
    handleError(err, res);
  }
});
