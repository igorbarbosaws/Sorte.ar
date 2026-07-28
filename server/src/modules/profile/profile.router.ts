import { Router, type Request, type Response } from "express";
import multer from "multer";
import { db } from "../../db/index.js";
import { authenticate } from "../../middleware/authenticate.js";
import { AppError } from "../auth/auth.service.js";
import { createProfileService } from "./profile.service.js";

const profileService = createProfileService(db);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

export const profileRouter = Router();

// ---------------------------------------------------------------------------
// Error mapper
// ---------------------------------------------------------------------------

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    switch (err.code) {
      case "NOT_FOUND":
        res.status(404).json({ error: { code: err.code, message: err.message } });
        return;
      case "VALIDATION_ERROR":
        res.status(400).json({ error: { code: err.code, message: err.message } });
        return;
      case "AUTHORIZATION_FAILED":
        res.status(403).json({ error: { code: err.code, message: err.message } });
        return;
      default:
        res.status(500).json({ error: { code: err.code, message: err.message } });
        return;
    }
  }
  res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" } });
}

// ---------------------------------------------------------------------------
// GET /api/profile/me — authenticated, returns own profile
// ---------------------------------------------------------------------------
profileRouter.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Authentication required" } }); return; }
    const profile = await profileService.getPublicProfile(userId);
    res.status(200).json(profile);
  } catch (err) {
    handleError(err, res);
  }
});

// ---------------------------------------------------------------------------
// GET /api/profile/:userId — public, no auth required
// ---------------------------------------------------------------------------
profileRouter.get("/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await profileService.getPublicProfile(req.params.userId as string);
    res.status(200).json(profile);
  } catch (err) {
    handleError(err, res);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/profile/me — requires auth
// Requirements: 3.2, 3.3
// ---------------------------------------------------------------------------
profileRouter.patch("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Authentication required" } });
      return;
    }
    await profileService.updateDisplayName(userId, req.body.displayName as string);
    res.status(200).json({ message: "Profile updated" });
  } catch (err) {
    handleError(err, res);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/profile/me/username
// ---------------------------------------------------------------------------
profileRouter.patch("/me/username", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Authentication required" } }); return; }
    await profileService.updateUsername(userId, req.body.username as string ?? "");
    res.status(200).json({ message: "Username updated" });
  } catch (err) {
    if (err instanceof AppError && err.code === "USERNAME_TAKEN") {
      res.status(409).json({ error: { code: err.code, message: err.message } });
      return;
    }
    handleError(err, res);
  }
});

// ---------------------------------------------------------------------------
// POST /api/profile/me/avatar
// ---------------------------------------------------------------------------
profileRouter.post(
  "/me/avatar",
  authenticate,
  upload.single("avatar"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", message: "Authentication required" } });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "No file uploaded" } });
        return;
      }

      const avatarUrl = await profileService.uploadAvatar(
        userId,
        file.buffer,
        file.mimetype,
        file.size,
      );

      res.status(200).json({ avatarUrl });
    } catch (err) {
      // multer throws its own error when the file exceeds the size limit
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Avatar file exceeds 2 MB limit" } });
        return;
      }
      handleError(err, res);
    }
  },
);
